/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Text,
    useColorModeValue,
    useToast,
    Icon,
    VStack,
    SimpleGrid,
    Badge,
    Divider,
    HStack,
} from '@chakra-ui/react';
import DefaultAuth from 'layouts/auth/Default';
import illustration from 'assets/img/auth/login_bg.png';
import { MdBusiness, MdVpnKey, MdLogout, MdCheckCircle } from 'react-icons/md';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from 'contexts/AuthContext';
import { useLanguage } from 'contexts/LanguageContext';
import LanguageSwitcher from 'components/navbar/LanguageSwitcher';
import { createCompany } from 'services/companyService';
import { getInvitationByKey, markInvitationAccepted, Invitation } from 'services/inviteService';

type OnboardingMode = 'choose' | 'join' | 'create';

export default function OnboardingView() {
    const { user, loading: authLoading, isApproved, isDemoMode, enableDemoMode, refreshUserProfile, signOut } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const toast = useToast();

    const textColor = useColorModeValue('navy.700', 'white');
    const textColorSecondary = 'gray.400';
    const cardBg = useColorModeValue('white', 'navy.800');
    const cardBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
    const activeBorder = useColorModeValue('brand.500', 'brand.400');

    const [mode, setMode] = useState<OnboardingMode>('choose');
    const [loading, setLoading] = useState(false);

    const displayParts = (user?.displayName || '').trim().split(' ');
    const [firstName, setFirstName] = useState(displayParts[0] || '');
    const [lastName, setLastName] = useState(displayParts.slice(1).join(' ') || '');

    // Join Company (Key) state
    const [inviteKey, setInviteKey] = useState('');
    const [verifiedInvite, setVerifiedInvite] = useState<Invitation | null>(null);
    const [checkingKey, setCheckingKey] = useState(false);

    // Create Company state
    const [companyName, setCompanyName] = useState('');
    const [companySubtitle, setCompanySubtitle] = useState('Yönetim Bilişim Sistemi');
    const [workspaceLabel, setWorkspaceLabel] = useState('Çalışma Alanı');
    const [initialSubTeam, setInitialSubTeam] = useState('');

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            navigate('/auth/sign-in', { replace: true });
            return;
        }
        if (isApproved) {
            navigate('/admin/default', { replace: true });
        }
    }, [user, authLoading, isApproved, navigate]);

    const handleVerifyKey = async () => {
        if (!inviteKey.trim()) {
            toast({
                title: t('Lütfen davet anahtarını girin', 'Please enter your invitation key'),
                status: 'warning',
                duration: 2500,
            });
            return;
        }
        setCheckingKey(true);
        try {
            const inv = await getInvitationByKey(inviteKey);
            if (!inv) {
                setVerifiedInvite(null);
                toast({
                    title: t('Geçersiz Anahtar', 'Invalid Key'),
                    description: t(
                        'Bu davet anahtarına ait bir kayıt bulunamadı.',
                        'No invitation record found for this key.'
                    ),
                    status: 'error',
                    duration: 3000,
                });
                return;
            }
            if (inv.status !== 'pending') {
                setVerifiedInvite(null);
                toast({
                    title: t('Anahtar Kullanılmış', 'Key Already Used'),
                    description: t(
                        'Bu davet anahtarı daha önce kullanılmış veya iptal edilmiş.',
                        'This invitation key has already been used or revoked.'
                    ),
                    status: 'warning',
                    duration: 3000,
                });
                return;
            }
            if (
                !isDemoMode &&
                inv.email &&
                user?.email &&
                inv.email.toLowerCase() !== user.email.toLowerCase()
            ) {
                setVerifiedInvite(null);
                toast({
                    title: t('E-posta Uyuşmazlığı', 'Email Mismatch'),
                    description: t(
                        `Bu davet anahtarı (${inv.email}) adresine tanımlanmıştır. Lütfen o hesapla giriş yapın.`,
                        `This key is assigned to (${inv.email}). Please sign in with that account.`
                    ),
                    status: 'error',
                    duration: 4500,
                });
                return;
            }

            setVerifiedInvite(inv);
            if (inv.invitedName && !firstName) setFirstName(inv.invitedName);
            if (inv.invitedSurname && !lastName) setLastName(inv.invitedSurname);
            toast({
                title: t('Davet Anahtarı Doğrulandı', 'Invitation Key Verified'),
                description: t(
                    `${inv.companyName} şirketine katılmaya hazırsınız.`,
                    `You are ready to join ${inv.companyName}.`
                ),
                status: 'success',
                duration: 2500,
            });
        } catch (err) {
            console.error(err);
            toast({ title: t('Doğrulama hatası', 'Verification error'), status: 'error', duration: 3000 });
        } finally {
            setCheckingKey(false);
        }
    };

    const handleJoinWithKey = async () => {
        if (!user) return;
        if (!firstName.trim() || !lastName.trim()) {
            toast({
                title: t('Lütfen adınızı ve soyadınızı girin', 'Please enter your first and last name'),
                status: 'warning',
                duration: 2500,
            });
            return;
        }

        if (isDemoMode) {
            enableDemoMode('company');
            navigate('/admin/default', { replace: true });
            return;
        }

        setLoading(true);
        try {
            let inv = verifiedInvite;
            if (!inv) {
                inv = await getInvitationByKey(inviteKey);
            }
            if (!inv || inv.status !== 'pending') {
                toast({
                    title: t('Geçersiz veya kullanılmış davet anahtarı', 'Invalid or already used invitation key'),
                    status: 'error',
                    duration: 3000,
                });
                setLoading(false);
                return;
            }

            await setDoc(doc(db, 'approvedUsers', user.uid), {
                uid: user.uid,
                name: firstName.trim(),
                surname: lastName.trim(),
                email: user.email || inv.email,
                photoURL: user.photoURL || '',
                companyId: inv.companyId,
                companyName: inv.companyName,
                subTeamId: inv.subTeamId || '',
                subTeamName: inv.subTeamName || '',
                department: inv.department || 'Genel',
                role: inv.role || 'Personel',
                isSuperAdmin: !!inv.isSuperAdmin,
                isManager: !!inv.isManager,
                approvedAt: serverTimestamp(),
                joinedViaKey: inv.key,
            });

            await markInvitationAccepted(inv.key, user.uid);
            await refreshUserProfile();

            toast({
                title: t('Şirkete Katıldınız!', 'Joined Company!'),
                description: `${inv.companyName}`,
                status: 'success',
                duration: 2500,
            });
            navigate('/admin/default', { replace: true });
        } catch (err) {
            console.error('Error joining company:', err);
            toast({ title: t('Katılım sırasında hata oluştu', 'Error joining company'), status: 'error', duration: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCompany = async () => {
        if (!user) return;
        if (!firstName.trim() || !lastName.trim() || !companyName.trim()) {
            toast({
                title: t('Eksik Bilgi', 'Missing Information'),
                description: t(
                    'Lütfen ad, soyad ve şirket adı alanlarını doldurun.',
                    'Please fill in your first name, last name, and company name.'
                ),
                status: 'warning',
                duration: 3000,
            });
            return;
        }

        if (isDemoMode) {
            enableDemoMode('company');
            navigate('/admin/default', { replace: true });
            return;
        }

        setLoading(true);
        try {
            const { company, initialSubTeam: createdSubTeam } = await createCompany({
                name: companyName.trim(),
                subtitle: companySubtitle.trim() || 'Yönetim Bilişim Sistemi',
                workspaceLabel: workspaceLabel.trim() || 'Çalışma Alanı',
                ownerUid: user.uid,
                initialSubTeamName: initialSubTeam.trim() || undefined,
            });

            await addDoc(collection(db, 'departments'), {
                companyId: company.id,
                name: 'Yönetim',
                createdAt: serverTimestamp(),
            });

            await setDoc(doc(db, 'approvedUsers', user.uid), {
                uid: user.uid,
                name: firstName.trim(),
                surname: lastName.trim(),
                email: user.email || '',
                photoURL: user.photoURL || '',
                companyId: company.id,
                companyName: company.name,
                subTeamId: createdSubTeam?.id || '',
                subTeamName: createdSubTeam?.name || '',
                department: 'Yönetim',
                role: 'Süper Yönetici',
                isSuperAdmin: true,
                isManager: true,
                approvedAt: serverTimestamp(),
            });

            await refreshUserProfile();

            toast({
                title: t('Şirketiniz Oluşturuldu!', 'Company Created!'),
                description: `${company.name}`,
                status: 'success',
                duration: 2500,
            });
            navigate('/admin/default', { replace: true });
        } catch (err) {
            console.error('Error creating company:', err);
            toast({ title: t('Şirket oluşturulurken hata oluştu', 'Error creating company'), status: 'error', duration: 3000 });
        } finally {
            setLoading(false);
        }
    };

    return (
        <DefaultAuth illustrationBackground={illustration} image={illustration}>
            <Flex
                maxW={{ base: '100%', md: '540px' }}
                w="100%"
                mx={{ base: 'auto', lg: '0px' }}
                me="auto"
                h="100%"
                alignItems="start"
                justifyContent="center"
                mb={{ base: '30px', md: '60px' }}
                px={{ base: '25px', md: '0px' }}
                mt={{ base: '30px', md: '7vh' }}
                flexDirection="column"
            >
                <Flex w="100%" justify="space-between" align="center" mb="10px">
                    <Heading color={textColor} fontSize="28px">
                        {t('Hoş Geldiniz', 'Welcome')}
                    </Heading>
                    <HStack spacing="8px">
                        <LanguageSwitcher />
                        <Button
                            size="sm"
                            variant="ghost"
                            leftIcon={<Icon as={MdLogout as any} />}
                            onClick={async () => {
                                await signOut();
                                navigate('/auth/sign-in');
                            }}
                        >
                            {t('Çıkış Yap', 'Sign Out')}
                        </Button>
                    </HStack>
                </Flex>
                <Text mb="24px" color={textColorSecondary} fontSize="sm">
                    {t(
                        `${user?.email} hesabıyla giriş yaptınız. Devam etmek için bir şirkete katılın veya yeni bir şirket oluşturun.`,
                        `Signed in as ${user?.email}. Choose whether to join an existing company with a key or create a new company.`
                    )}
                </Text>

                {/* Two Option Cards */}
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing="14px" w="100%" mb="24px">
                    <Box
                        p="18px"
                        bg={cardBg}
                        border="2px solid"
                        borderColor={mode === 'join' ? activeBorder : cardBorder}
                        borderRadius="16px"
                        cursor="pointer"
                        onClick={() => setMode('join')}
                        transition="all 0.2s"
                        _hover={{ borderColor: activeBorder, transform: 'translateY(-2px)' }}
                    >
                        <Icon as={MdVpnKey as any} w="28px" h="28px" color="brand.500" mb="8px" />
                        <Text fontWeight="700" color={textColor} fontSize="md">
                            {t('Şirkete Katıl (Key ile)', 'Join a Company (With Key)')}
                        </Text>
                        <Text fontSize="xs" color={textColorSecondary} mt="4px">
                            {t(
                                'Yöneticinizden aldığınız kişiye özel davet anahtarı (INV-XXXX-XXXX) ile katılın',
                                'Join an existing organization using the personal invitation key generated for you'
                            )}
                        </Text>
                    </Box>

                    <Box
                        p="18px"
                        bg={cardBg}
                        border="2px solid"
                        borderColor={mode === 'create' ? activeBorder : cardBorder}
                        borderRadius="16px"
                        cursor="pointer"
                        onClick={() => setMode('create')}
                        transition="all 0.2s"
                        _hover={{ borderColor: activeBorder, transform: 'translateY(-2px)' }}
                    >
                        <Icon as={MdBusiness as any} w="28px" h="28px" color="green.500" mb="8px" />
                        <Text fontWeight="700" color={textColor} fontSize="md">
                            {t('Yeni Şirket Aç', 'Create a New Company')}
                        </Text>
                        <Text fontSize="xs" color={textColorSecondary} mt="4px">
                            {t(
                                'Kendi şirketinizi ve alt çalışma alanlarınızı kurup çalışanlarınızı davet edin',
                                'Set up your own company and sub-team workspaces, then invite your employees'
                            )}
                        </Text>
                    </Box>
                </SimpleGrid>

                {/* Join Company Form */}
                {mode === 'join' && (
                    <Box
                        w="100%"
                        p="22px"
                        bg={cardBg}
                        border="1px solid"
                        borderColor={cardBorder}
                        borderRadius="18px"
                    >
                        <VStack spacing="14px" align="stretch">
                            <Text fontWeight="700" color={textColor} fontSize="lg">
                                {t('Davet Anahtarı ile Şirkete Katıl', 'Join Company with Invitation Key')}
                            </Text>

                            <FormControl isRequired>
                                <FormLabel fontSize="sm" fontWeight="600">
                                    {t('Kişiye Özel Davet Anahtarı (Key)', 'Personal Invitation Key')}
                                </FormLabel>
                                <Flex gap="8px">
                                    <Input
                                        placeholder={t('Örn: INV-NOVA-2026', 'e.g. INV-NOVA-2026')}
                                        value={inviteKey}
                                        onChange={(e) => {
                                            setInviteKey(e.target.value.toUpperCase());
                                            setVerifiedInvite(null);
                                        }}
                                        fontFamily="monospace"
                                        fontWeight="700"
                                        borderRadius="12px"
                                    />
                                    <Button
                                        colorScheme="brand"
                                        variant="outline"
                                        borderRadius="12px"
                                        onClick={handleVerifyKey}
                                        isLoading={checkingKey}
                                    >
                                        {t('Doğrula', 'Verify')}
                                    </Button>
                                </Flex>
                            </FormControl>

                            {verifiedInvite && (
                                <Box
                                    p="12px"
                                    bg="green.50"
                                    borderRadius="12px"
                                    border="1px solid"
                                    borderColor="green.200"
                                >
                                    <Flex align="center" gap="8px" mb="4px">
                                        <Icon as={MdCheckCircle as any} color="green.500" />
                                        <Text fontWeight="700" color="green.800" fontSize="sm">
                                            {verifiedInvite.companyName}
                                        </Text>
                                    </Flex>
                                    <Flex gap="6px" flexWrap="wrap">
                                        <Badge colorScheme="purple">{verifiedInvite.role}</Badge>
                                        <Badge colorScheme="blue">{verifiedInvite.department}</Badge>
                                        {verifiedInvite.subTeamName && (
                                            <Badge colorScheme="teal">
                                                {t('Alt Takım', 'Sub-Team')}: {verifiedInvite.subTeamName}
                                            </Badge>
                                        )}
                                    </Flex>
                                </Box>
                            )}

                            <SimpleGrid columns={2} spacing="10px">
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="600">
                                        {t('Adınız', 'First Name')}
                                    </FormLabel>
                                    <Input
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder={t('Ad', 'First Name')}
                                        borderRadius="12px"
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="600">
                                        {t('Soyadınız', 'Last Name')}
                                    </FormLabel>
                                    <Input
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder={t('Soyad', 'Last Name')}
                                        borderRadius="12px"
                                    />
                                </FormControl>
                            </SimpleGrid>

                            <Button
                                colorScheme="brand"
                                size="lg"
                                borderRadius="14px"
                                onClick={handleJoinWithKey}
                                isLoading={loading}
                                isDisabled={!inviteKey.trim()}
                            >
                                {t('Şirkete Katıl ve Başla', 'Join Company & Continue')}
                            </Button>
                        </VStack>
                    </Box>
                )}

                {/* Create Company Form */}
                {mode === 'create' && (
                    <Box
                        w="100%"
                        p="22px"
                        bg={cardBg}
                        border="1px solid"
                        borderColor={cardBorder}
                        borderRadius="18px"
                    >
                        <VStack spacing="14px" align="stretch">
                            <Text fontWeight="700" color={textColor} fontSize="lg">
                                {t('Yeni Şirket / Organizasyon Oluştur', 'Create New Company / Organization')}
                            </Text>

                            <SimpleGrid columns={2} spacing="10px">
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="600">
                                        {t('Adınız', 'First Name')}
                                    </FormLabel>
                                    <Input
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder={t('Ad', 'First Name')}
                                        borderRadius="12px"
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="600">
                                        {t('Soyadınız', 'Last Name')}
                                    </FormLabel>
                                    <Input
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder={t('Soyad', 'Last Name')}
                                        borderRadius="12px"
                                    />
                                </FormControl>
                            </SimpleGrid>

                            <Divider />

                            <FormControl isRequired>
                                <FormLabel fontSize="sm" fontWeight="600">
                                    {t('Şirket / Kurum Adı', 'Company / Organization Name')}
                                </FormLabel>
                                <Input
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder={t('Örn: Nova Teknoloji A.Ş.', 'e.g. Nova Technologies Inc.')}
                                    borderRadius="12px"
                                />
                            </FormControl>

                            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing="10px">
                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="600">
                                        {t('Sistem Alt Başlığı', 'System Subtitle')}
                                    </FormLabel>
                                    <Input
                                        value={companySubtitle}
                                        onChange={(e) => setCompanySubtitle(e.target.value)}
                                        placeholder={t('Yönetim Bilişim Sistemi', 'Management Information System')}
                                        borderRadius="12px"
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="600">
                                        {t('Çalışma Alanı Tipi', 'Workspace Label')}
                                    </FormLabel>
                                    <Input
                                        value={workspaceLabel}
                                        onChange={(e) => setWorkspaceLabel(e.target.value)}
                                        placeholder={t('Ofis, Atölye, Şube vb.', 'Office, Lab, Branch, etc.')}
                                        borderRadius="12px"
                                    />
                                </FormControl>
                            </SimpleGrid>

                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="600">
                                    {t('İlk Alt Takım / Çalışma Alanı (İsteğe Bağlı)', 'Initial Sub-Team / Workspace (Optional)')}
                                </FormLabel>
                                <Input
                                    value={initialSubTeam}
                                    onChange={(e) => setInitialSubTeam(e.target.value)}
                                    placeholder={t(
                                        'Örn: Ar-Ge Takımı, Merkez Ofis (Boş bırakılırsa tek şirket çalışır)',
                                        'e.g. R&D Team, Main Office (Leave empty for single-workspace mode)'
                                    )}
                                    borderRadius="12px"
                                />
                                <Text fontSize="xs" color="gray.400" mt="4px">
                                    {t(
                                        'Daha sonra panelden istediğiniz kadar alt takım veya çalışma alanı ekleyebilirsiniz.',
                                        'You can add as many sub-teams or workspaces as you want later from the settings panel.'
                                    )}
                                </Text>
                            </FormControl>

                            <Button
                                colorScheme="green"
                                size="lg"
                                borderRadius="14px"
                                onClick={handleCreateCompany}
                                isLoading={loading}
                            >
                                {t('Şirketi Kur ve Yönetim Paneline Geç', 'Create Company & Open Dashboard')}
                            </Button>
                        </VStack>
                    </Box>
                )}
            </Flex>
        </DefaultAuth>
    );
}

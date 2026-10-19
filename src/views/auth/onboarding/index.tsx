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
} from '@chakra-ui/react';
import DefaultAuth from 'layouts/auth/Default';
import illustration from 'assets/img/auth/login_bg.png';
import { MdBusiness, MdVpnKey, MdPerson, MdGroups, MdLogout, MdCheckCircle } from 'react-icons/md';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from 'contexts/AuthContext';
import { createCompany } from 'services/companyService';
import { getInvitationByKey, markInvitationAccepted, Invitation } from 'services/inviteService';

type OnboardingMode = 'choose' | 'join' | 'create';

export default function OnboardingView() {
    const { user, isApproved, refreshUserProfile, signOut } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const textColor = useColorModeValue('navy.700', 'white');
    const textColorSecondary = 'gray.400';
    const cardBg = useColorModeValue('white', 'navy.800');
    const cardBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
    const activeBorder = useColorModeValue('brand.500', 'brand.400');

    const [mode, setMode] = useState<OnboardingMode>('choose');
    const [loading, setLoading] = useState(false);

    // Ortak kullanıcı bilgileri
    const displayParts = (user?.displayName || '').trim().split(' ');
    const [firstName, setFirstName] = useState(displayParts[0] || '');
    const [lastName, setLastName] = useState(displayParts.slice(1).join(' ') || '');

    // Şirkete Katıl (Key) state
    const [inviteKey, setInviteKey] = useState('');
    const [verifiedInvite, setVerifiedInvite] = useState<Invitation | null>(null);
    const [checkingKey, setCheckingKey] = useState(false);

    // Şirket Aç state
    const [companyName, setCompanyName] = useState('');
    const [companySubtitle, setCompanySubtitle] = useState('Yönetim Bilişim Sistemi');
    const [workspaceLabel, setWorkspaceLabel] = useState('Çalışma Alanı');
    const [initialSubTeam, setInitialSubTeam] = useState('');

    useEffect(() => {
        if (!user) {
            navigate('/auth/sign-in', { replace: true });
            return;
        }
        if (isApproved) {
            navigate('/admin/default', { replace: true });
        }
    }, [user, isApproved, navigate]);

    const handleVerifyKey = async () => {
        if (!inviteKey.trim()) {
            toast({ title: 'Lütfen davet anahtarını girin', status: 'warning', duration: 2500 });
            return;
        }
        setCheckingKey(true);
        try {
            const inv = await getInvitationByKey(inviteKey);
            if (!inv) {
                setVerifiedInvite(null);
                toast({
                    title: 'Geçersiz Anahtar',
                    description: 'Bu davet anahtarına ait bir kayıt bulunamadı.',
                    status: 'error',
                    duration: 3000,
                });
                return;
            }
            if (inv.status !== 'pending') {
                setVerifiedInvite(null);
                toast({
                    title: 'Anahtar Kullanılmış',
                    description: 'Bu davet anahtarı daha önce kullanılmış veya iptal edilmiş.',
                    status: 'warning',
                    duration: 3000,
                });
                return;
            }
            if (
                inv.email &&
                user?.email &&
                inv.email.toLowerCase() !== user.email.toLowerCase()
            ) {
                setVerifiedInvite(null);
                toast({
                    title: 'E-posta Uyuşmazlığı',
                    description: `Bu davet anahtarı (${inv.email}) adresine tanımlanmıştır. Lütfen o hesapla giriş yapın.`,
                    status: 'error',
                    duration: 4500,
                });
                return;
            }

            setVerifiedInvite(inv);
            if (inv.invitedName && !firstName) setFirstName(inv.invitedName);
            if (inv.invitedSurname && !lastName) setLastName(inv.invitedSurname);
            toast({
                title: 'Davet Anahtarı Doğrulandı',
                description: `${inv.companyName} şirketine katılmaya hazırsınız.`,
                status: 'success',
                duration: 2500,
            });
        } catch (err) {
            console.error(err);
            toast({ title: 'Doğrulama hatası', status: 'error', duration: 3000 });
        } finally {
            setCheckingKey(false);
        }
    };

    const handleJoinWithKey = async () => {
        if (!user) return;
        if (!firstName.trim() || !lastName.trim()) {
            toast({ title: 'Lütfen adınızı ve soyadınızı girin', status: 'warning', duration: 2500 });
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
                    title: 'Geçersiz veya kullanılmış davet anahtarı',
                    status: 'error',
                    duration: 3000,
                });
                setLoading(false);
                return;
            }
            if (
                inv.email &&
                user.email &&
                inv.email.toLowerCase() !== user.email.toLowerCase()
            ) {
                toast({
                    title: 'E-posta Uyuşmazlığı',
                    description: `Bu anahtar ${inv.email} adresi için oluşturulmuştur.`,
                    status: 'error',
                    duration: 4000,
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
                title: 'Şirkete Katıldınız!',
                description: `${inv.companyName} yönetim paneline yönlendiriliyorsunuz...`,
                status: 'success',
                duration: 2500,
            });
            navigate('/admin/default', { replace: true });
        } catch (err) {
            console.error('Error joining company:', err);
            toast({ title: 'Katılım sırasında hata oluştu', status: 'error', duration: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCompany = async () => {
        if (!user) return;
        if (!firstName.trim() || !lastName.trim() || !companyName.trim()) {
            toast({
                title: 'Eksik Bilgi',
                description: 'Lütfen ad, soyad ve şirket adı alanlarını doldurun.',
                status: 'warning',
                duration: 3000,
            });
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

            // Varsayılan Yönetim departmanını oluştur
            await addDoc(collection(db, 'departments'), {
                companyId: company.id,
                name: 'Yönetim',
                createdAt: serverTimestamp(),
            });

            // Kurucuyu Süper Yönetici olarak kaydet
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
                title: 'Şirketiniz Oluşturuldu!',
                description: `${company.name} yönetim paneline yönlendiriliyorsunuz...`,
                status: 'success',
                duration: 2500,
            });
            navigate('/admin/default', { replace: true });
        } catch (err) {
            console.error('Error creating company:', err);
            toast({ title: 'Şirket oluşturulurken hata oluştu', status: 'error', duration: 3000 });
        } finally {
            setLoading(false);
        }
    };

    return (
        <DefaultAuth illustrationBackground={illustration} image={illustration}>
            <Flex
                maxW={{ base: '100%', md: '520px' }}
                w="100%"
                mx={{ base: 'auto', lg: '0px' }}
                me="auto"
                h="100%"
                alignItems="start"
                justifyContent="center"
                mb={{ base: '30px', md: '60px' }}
                px={{ base: '25px', md: '0px' }}
                mt={{ base: '30px', md: '8vh' }}
                flexDirection="column"
            >
                <Flex w="100%" justify="space-between" align="center" mb="10px">
                    <Heading color={textColor} fontSize="28px">
                        Hoş Geldiniz
                    </Heading>
                    <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Icon as={MdLogout as any} />}
                        onClick={async () => {
                            await signOut();
                            navigate('/auth/sign-in');
                        }}
                    >
                        Çıkış Yap
                    </Button>
                </Flex>
                <Text mb="24px" color={textColorSecondary} fontSize="sm">
                    {user?.email} hesabıyla giriş yaptınız. Devam etmek için bir şirkete katılın veya yeni bir şirket oluşturun.
                </Text>

                {/* İki Seçenek Kartları */}
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
                            Şirkete Katıl
                        </Text>
                        <Text fontSize="xs" color={textColorSecondary} mt="4px">
                            Yöneticinizden aldığınız kişiye özel davet anahtarı (Key) ile katılın
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
                            Şirket Aç
                        </Text>
                        <Text fontSize="xs" color={textColorSecondary} mt="4px">
                            Kendi şirketinizi ve alt çalışma alanlarınızı kurup ekibinizi davet edin
                        </Text>
                    </Box>
                </SimpleGrid>

                {/* Şirkete Katıl Formu */}
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
                                Davet Anahtarı ile Şirkete Katıl
                            </Text>

                            <FormControl isRequired>
                                <FormLabel fontSize="sm" fontWeight="600">
                                    Kişiye Özel Davet Anahtarı (Key)
                                </FormLabel>
                                <Flex gap="8px">
                                    <Input
                                        placeholder="Örn: INV-8F4K-92LM"
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
                                        Doğrula
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
                                                Alt Takım: {verifiedInvite.subTeamName}
                                            </Badge>
                                        )}
                                    </Flex>
                                </Box>
                            )}

                            <SimpleGrid columns={2} spacing="10px">
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="600">
                                        Adınız
                                    </FormLabel>
                                    <Input
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="Ad"
                                        borderRadius="12px"
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="600">
                                        Soyadınız
                                    </FormLabel>
                                    <Input
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Soyad"
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
                                Şirkete Katıl ve Başla
                            </Button>
                        </VStack>
                    </Box>
                )}

                {/* Şirket Aç Formu */}
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
                                Yeni Şirket / Organizasyon Oluştur
                            </Text>

                            <SimpleGrid columns={2} spacing="10px">
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="600">
                                        Adınız
                                    </FormLabel>
                                    <Input
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="Ad"
                                        borderRadius="12px"
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="600">
                                        Soyadınız
                                    </FormLabel>
                                    <Input
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Soyad"
                                        borderRadius="12px"
                                    />
                                </FormControl>
                            </SimpleGrid>

                            <Divider />

                            <FormControl isRequired>
                                <FormLabel fontSize="sm" fontWeight="600">
                                    Şirket / Kurum Adı
                                </FormLabel>
                                <Input
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="Örn: A Şirketi Teknoloji A.Ş."
                                    borderRadius="12px"
                                />
                            </FormControl>

                            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing="10px">
                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="600">
                                        Sistem Alt Başlığı
                                    </FormLabel>
                                    <Input
                                        value={companySubtitle}
                                        onChange={(e) => setCompanySubtitle(e.target.value)}
                                        placeholder="Yönetim Bilişim Sistemi"
                                        borderRadius="12px"
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="600">
                                        Çalışma Alanı Tipi
                                    </FormLabel>
                                    <Input
                                        value={workspaceLabel}
                                        onChange={(e) => setWorkspaceLabel(e.target.value)}
                                        placeholder="Ofis, Atölye, Şube vb."
                                        borderRadius="12px"
                                    />
                                </FormControl>
                            </SimpleGrid>

                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="600">
                                    İlk Alt Takım / Çalışma Alanı (İsteğe Bağlı)
                                </FormLabel>
                                <Input
                                    value={initialSubTeam}
                                    onChange={(e) => setInitialSubTeam(e.target.value)}
                                    placeholder="Örn: Ar-Ge Takımı, Merkez Ofis (Boş bırakılırsa tek şirket çalışır)"
                                    borderRadius="12px"
                                />
                                <Text fontSize="xs" color="gray.400" mt="4px">
                                    Daha sonra panelden istediğiniz kadar alt takım veya çalışma alanı ekleyebilirsiniz.
                                </Text>
                            </FormControl>

                            <Button
                                colorScheme="green"
                                size="lg"
                                borderRadius="14px"
                                onClick={handleCreateCompany}
                                isLoading={loading}
                            >
                                Şirketi Kur ve Yönetim Paneline Geç
                            </Button>
                        </VStack>
                    </Box>
                )}
            </Flex>
        </DefaultAuth>
    );
}

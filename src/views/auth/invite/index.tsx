/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, NavLink } from 'react-router-dom';
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
    Spinner,
    Image,
    Alert,
    AlertIcon,
    AlertDescription,
} from '@chakra-ui/react';
import DefaultAuth from 'layouts/auth/Default';
import illustration from 'assets/img/auth/login_bg.png';
import { FcGoogle } from 'react-icons/fc';
import { MdBusiness, MdCheckCircle } from 'react-icons/md';
import { auth, googleProvider, signInWithPopup, db } from '../../../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from 'contexts/AuthContext';
import { useLanguage } from 'contexts/LanguageContext';
import LanguageSwitcher from 'components/navbar/LanguageSwitcher';
import { getInvitationByKey, markInvitationAccepted, Invitation } from 'services/inviteService';

export default function InviteSignUpView() {
    const [searchParams] = useSearchParams();
    const initialKey = searchParams.get('key') || '';

    const { user, isDemoMode, enableDemoMode, refreshUserProfile } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const toast = useToast();

    const textColor = useColorModeValue('navy.700', 'white');
    const textColorSecondary = 'gray.400';
    const cardBg = useColorModeValue('white', 'navy.800');
    const cardBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
    const infoBoxBg = useColorModeValue('gray.50', 'whiteAlpha.100');

    const [inviteKey, setInviteKey] = useState(initialKey.toUpperCase());
    const [invitation, setInvitation] = useState<Invitation | null>(null);
    const [loadingInvite, setLoadingInvite] = useState(!!initialKey);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    const loadInvite = async (keyToLoad: string) => {
        if (!keyToLoad.trim()) return;
        setLoadingInvite(true);
        setErrorMsg('');
        try {
            const inv = await getInvitationByKey(keyToLoad);
            if (!inv) {
                setInvitation(null);
                setErrorMsg(
                    t(
                        'Bu davet bağlantısına veya anahtarına ait geçerli bir kayıt bulunamadı.',
                        'No valid invitation found for this invitation link or key.'
                    )
                );
            } else if (inv.status !== 'pending') {
                setInvitation(null);
                setErrorMsg(
                    t(
                        'Bu davet bağlantısı daha önce kullanılmış veya yönetici tarafından iptal edilmiş.',
                        'This invitation link has already been used or revoked by an administrator.'
                    )
                );
            } else {
                setInvitation(inv);
                if (inv.invitedName) setFirstName(inv.invitedName);
                if (inv.invitedSurname) setLastName(inv.invitedSurname);
            }
        } catch (err) {
            console.error(err);
            setErrorMsg(t('Davet bilgileri yüklenirken hata oluştu.', 'Failed to load invitation details.'));
        } finally {
            setLoadingInvite(false);
        }
    };

    useEffect(() => {
        if (initialKey) {
            loadInvite(initialKey);
        }
    }, [initialKey]);

    const handleAcceptInvite = async () => {
        if (!invitation) return;
        if (!firstName.trim() || !lastName.trim()) {
            toast({
                title: t('Eksik Bilgi', 'Missing Information'),
                description: t('Lütfen adınızı ve soyadınızı girin.', 'Please enter your first and last name.'),
                status: 'warning',
                duration: 2500,
            });
            return;
        }

        if (isDemoMode || invitation.key === 'INV-NOVA-2026' || invitation.key === 'INV-MRKZ-8492') {
            enableDemoMode('company');
            toast({
                title: t('Hoş Geldiniz!', 'Welcome!'),
                description: `${invitation.companyName}`,
                status: 'success',
                duration: 2500,
            });
            navigate('/admin/default', { replace: true });
            return;
        }

        setSubmitting(true);
        try {
            let activeUser = user;
            if (!activeUser) {
                const result = await signInWithPopup(auth, googleProvider);
                activeUser = result.user;
            }

            if (
                invitation.email &&
                activeUser.email &&
                invitation.email.toLowerCase() !== activeUser.email.toLowerCase()
            ) {
                toast({
                    title: t('E-posta Adresi Uyuşmuyor', 'Email Address Mismatch'),
                    description: t(
                        `Bu davet ${invitation.email} adresine gönderilmiştir. Siz ${activeUser.email} ile giriş yaptınız.`,
                        `This invite was sent to ${invitation.email}, but you signed in as ${activeUser.email}.`
                    ),
                    status: 'error',
                    duration: 5000,
                });
                setSubmitting(false);
                return;
            }

            await setDoc(doc(db, 'approvedUsers', activeUser.uid), {
                uid: activeUser.uid,
                name: firstName.trim(),
                surname: lastName.trim(),
                email: activeUser.email || invitation.email,
                photoURL: activeUser.photoURL || '',
                companyId: invitation.companyId,
                companyName: invitation.companyName,
                subTeamId: invitation.subTeamId || '',
                subTeamName: invitation.subTeamName || '',
                department: invitation.department || 'Genel',
                role: invitation.role || 'Personel',
                isSuperAdmin: !!invitation.isSuperAdmin,
                isManager: !!invitation.isManager,
                approvedAt: serverTimestamp(),
                joinedViaKey: invitation.key,
            });

            await markInvitationAccepted(invitation.key, activeUser.uid);
            await refreshUserProfile();

            toast({
                title: t('Hoş Geldiniz!', 'Welcome!'),
                description: t(
                    `${invitation.companyName} organizasyonuna başarıyla katıldınız.`,
                    `You have successfully joined ${invitation.companyName}.`
                ),
                status: 'success',
                duration: 3000,
            });
            navigate('/admin/default', { replace: true });
        } catch (err: any) {
            console.error('Invite sign up error:', err);
            if (err?.code !== 'auth/popup-closed-by-user') {
                toast({
                    title: t('Hata', 'Error'),
                    description: t('Kayıt tamamlanırken bir hata oluştu.', 'An error occurred while completing registration.'),
                    status: 'error',
                    duration: 3000,
                });
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DefaultAuth illustrationBackground={illustration} image={illustration}>
            <Flex
                maxW={{ base: '100%', md: '480px' }}
                w="100%"
                mx={{ base: 'auto', lg: '0px' }}
                me="auto"
                h="100%"
                alignItems="start"
                justifyContent="center"
                mb={{ base: '30px', md: '60px' }}
                px={{ base: '25px', md: '0px' }}
                mt={{ base: '30px', md: '10vh' }}
                flexDirection="column"
            >
                <Flex w="100%" justify="flex-end" mb="12px">
                    <LanguageSwitcher />
                </Flex>

                {loadingInvite ? (
                    <Flex w="100%" py="60px" justify="center" align="center" direction="column" gap="12px">
                        <Spinner size="xl" color="brand.500" />
                        <Text color={textColorSecondary}>
                            {t('Davet bilgileri doğrulanıyor...', 'Verifying invitation details...')}
                        </Text>
                    </Flex>
                ) : invitation ? (
                    <Box
                        w="100%"
                        p="28px"
                        bg={cardBg}
                        border="1px solid"
                        borderColor={cardBorder}
                        borderRadius="20px"
                        boxShadow="lg"
                    >
                        <VStack spacing="18px" align="stretch">
                            <Flex align="center" gap="12px">
                                {invitation.companyLogoUrl ? (
                                    <Image
                                        src={invitation.companyLogoUrl}
                                        alt={invitation.companyName}
                                        maxH="48px"
                                        maxW="120px"
                                        objectFit="contain"
                                    />
                                ) : (
                                    <Flex
                                        w="48px"
                                        h="48px"
                                        borderRadius="14px"
                                        bg="brand.500"
                                        color="white"
                                        align="center"
                                        justify="center"
                                    >
                                        <Icon as={MdBusiness as any} w="26px" h="26px" />
                                    </Flex>
                                )}
                                <Box>
                                    <Badge colorScheme="green" borderRadius="full" px="8px" mb="2px">
                                        {t('Özel Kurumsal Davet', 'Dedicated Company Invitation')}
                                    </Badge>
                                    <Heading color={textColor} fontSize="22px">
                                        {invitation.companyName}
                                    </Heading>
                                </Box>
                            </Flex>

                            <Box p="14px" bg={infoBoxBg} borderRadius="14px">
                                <Text fontSize="xs" color={textColorSecondary} mb="6px" fontWeight="600">
                                    {t('ATANAN KURUMSAL BİLGİLERİNİZ', 'YOUR ASSIGNED ORGANIZATION DETAILS')}
                                </Text>
                                <Flex gap="8px" flexWrap="wrap" mb="8px">
                                    <Badge colorScheme="purple" px="8px" py="2px" borderRadius="6px">
                                        {t('Rol', 'Role')}: {invitation.role}
                                    </Badge>
                                    <Badge colorScheme="blue" px="8px" py="2px" borderRadius="6px">
                                        {t('Departman', 'Department')}: {invitation.department}
                                    </Badge>
                                    {invitation.subTeamName && (
                                        <Badge colorScheme="teal" px="8px" py="2px" borderRadius="6px">
                                            {t('Alt Takım / Alan', 'Sub-Team / Area')}: {invitation.subTeamName}
                                        </Badge>
                                    )}
                                </Flex>
                                <Text fontSize="xs" color={textColorSecondary}>
                                    {t('Davetli E-posta', 'Invited Email')}: <b>{invitation.email}</b> • Key:{' '}
                                    <code>{invitation.key}</code>
                                </Text>
                            </Box>

                            <SimpleGrid columns={2} spacing="12px">
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="600">
                                        {t('Adınız', 'First Name')}
                                    </FormLabel>
                                    <Input
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder={t('Adınız', 'First Name')}
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
                                        placeholder={t('Soyadınız', 'Last Name')}
                                        borderRadius="12px"
                                    />
                                </FormControl>
                            </SimpleGrid>

                            <Button
                                size="lg"
                                colorScheme="brand"
                                borderRadius="14px"
                                onClick={handleAcceptInvite}
                                isLoading={submitting}
                                leftIcon={!user ? <Icon as={FcGoogle as any} w="20px" h="20px" /> : <Icon as={MdCheckCircle as any} />}
                            >
                                {user
                                    ? t(`${invitation.companyName} Şirketine Katıl`, `Join ${invitation.companyName}`)
                                    : t('Google ile Kaydol ve Şirkete Katıl', 'Register with Google & Join Company')}
                            </Button>
                        </VStack>
                    </Box>
                ) : (
                    <Box
                        w="100%"
                        p="24px"
                        bg={cardBg}
                        border="1px solid"
                        borderColor={cardBorder}
                        borderRadius="20px"
                    >
                        <VStack spacing="16px" align="stretch">
                            <Heading fontSize="22px" color={textColor}>
                                {t('Davet Anahtarı ile Kayıt', 'Register with Invitation Key')}
                            </Heading>
                            {errorMsg && (
                                <Alert status="error" borderRadius="12px">
                                    <AlertIcon />
                                    <AlertDescription fontSize="sm">{errorMsg}</AlertDescription>
                                </Alert>
                            )}
                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="600">
                                    {t('Davet Anahtarınız (Key)', 'Your Invitation Key')}
                                </FormLabel>
                                <Flex gap="8px">
                                    <Input
                                        value={inviteKey}
                                        onChange={(e) => setInviteKey(e.target.value.toUpperCase())}
                                        placeholder="INV-NOVA-2026"
                                        fontFamily="monospace"
                                        borderRadius="12px"
                                    />
                                    <Button
                                        colorScheme="brand"
                                        borderRadius="12px"
                                        onClick={() => loadInvite(inviteKey)}
                                    >
                                        {t('Sorgula', 'Lookup')}
                                    </Button>
                                </Flex>
                            </FormControl>
                            <NavLink to="/auth/sign-in">
                                <Button variant="ghost" w="100%" size="sm">
                                    {t('Giriş Ekranına Dön', 'Back to Sign In')}
                                </Button>
                            </NavLink>
                        </VStack>
                    </Box>
                )}
            </Flex>
        </DefaultAuth>
    );
}

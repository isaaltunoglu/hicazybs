/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  useColorModeValue,
  useToast,
  Icon,
  Image,
  Divider,
  SimpleGrid,
} from '@chakra-ui/react';
import DefaultAuth from 'layouts/auth/Default';
import illustration from 'assets/img/auth/login_bg.png';
import { FcGoogle } from 'react-icons/fc';
import { MdDashboardCustomize, MdVpnKey, MdPlayCircleOutline, MdBusiness } from 'react-icons/md';
import { auth, googleProvider, signInWithPopup, db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from 'contexts/AuthContext';
import { useOrganization } from 'contexts/OrganizationContext';
import { useLanguage } from 'contexts/LanguageContext';
import LanguageSwitcher from 'components/navbar/LanguageSwitcher';

function SignIn() {
  const textColor = useColorModeValue('navy.700', 'white');
  const textColorSecondary = 'gray.400';
  const brandStars = useColorModeValue('brand.500', 'brand.400');
  const googleBg = useColorModeValue('secondaryGray.300', 'whiteAlpha.200');
  const googleText = useColorModeValue('navy.700', 'white');
  const googleHover = useColorModeValue(
    { bg: 'gray.200' },
    { bg: 'whiteAlpha.300' }
  );
  const googleActive = useColorModeValue(
    { bg: 'secondaryGray.300' },
    { bg: 'whiteAlpha.200' }
  );
  const navigate = useNavigate();
  const toast = useToast();
  const { user, isApproved, refreshUserProfile, enableDemoMode } = useAuth();
  const { orgSettings } = useOrganization();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (isApproved) {
        navigate('/admin/default', { replace: true });
      } else {
        checkUserStatus(user.uid);
      }
    }
  }, [user, isApproved]);

  const checkUserStatus = async (uid: string) => {
    try {
      const approvedDoc = await getDoc(doc(db, 'approvedUsers', uid));
      if (approvedDoc.exists()) {
        navigate('/admin/default', { replace: true });
      } else {
        navigate('/auth/onboarding', { replace: true });
      }
    } catch (err) {
      navigate('/auth/onboarding', { replace: true });
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;

      const approvedDoc = await getDoc(doc(db, 'approvedUsers', googleUser.uid));
      if (approvedDoc.exists()) {
        await refreshUserProfile();
        toast({
          title: t('Giriş Başarılı', 'Sign-In Successful'),
          description: t('Yönetim paneline yönlendiriliyorsunuz...', 'Redirecting to dashboard...'),
          status: 'success',
          duration: 2000,
        });
        navigate('/admin/default', { replace: true });
        setLoading(false);
        return;
      }

      navigate('/auth/onboarding', { replace: true });
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({
          title: t('Hata', 'Error'),
          description: t('Giriş yapılırken bir hata oluştu.', 'An error occurred while signing in.'),
          status: 'error',
          duration: 5000,
        });
      }
    }
    setLoading(false);
  };

  return (
    <DefaultAuth illustrationBackground={illustration} image={illustration}>
      <Flex
        maxW={{ base: '100%', md: 'max-content' }}
        w="100%"
        mx={{ base: 'auto', lg: '0px' }}
        me="auto"
        h="100%"
        alignItems="start"
        justifyContent="center"
        mb={{ base: '30px', md: '60px' }}
        px={{ base: '25px', md: '0px' }}
        mt={{ base: '40px', md: '10vh' }}
        flexDirection="column"
      >
        <Flex w="100%" justify="space-between" align="center" mb="20px">
          {orgSettings.logoUrl ? (
            <Image
              src={orgSettings.logoUrl}
              alt={orgSettings.organizationName}
              maxW="180px"
              maxH="64px"
              objectFit="contain"
            />
          ) : (
            <Flex align="center" gap="12px">
              <Flex
                w="44px"
                h="44px"
                borderRadius="14px"
                bg={brandStars}
                align="center"
                justify="center"
                color="white"
              >
                <Icon as={MdDashboardCustomize as any} w="26px" h="26px" />
              </Flex>
              <Box>
                <Text color={textColor} fontWeight="800" fontSize="xl" lineHeight="1.1">
                  {orgSettings.organizationName}
                </Text>
                {orgSettings.organizationSubtitle && (
                  <Text color={textColorSecondary} fontSize="xs" fontWeight="500">
                    {orgSettings.organizationSubtitle}
                  </Text>
                )}
              </Box>
            </Flex>
          )}
          <LanguageSwitcher />
        </Flex>

        <Box me="auto">
          <Heading color={textColor} fontSize="36px" mb="10px">
            {t('Giriş Yap', 'Sign In')}
          </Heading>
          <Text mb="32px" ms="4px" color={textColorSecondary} fontWeight="400" fontSize="md" maxW="420px">
            {t(
              'Şirketinize erişmek, yeni şirket açmak veya davet anahtarıyla katılmak için devam edin',
              'Continue to access your company, create a new company, or join with an invitation key'
            )}
          </Text>
        </Box>
        <Flex
          zIndex="2"
          direction="column"
          w={{ base: '100%', md: '420px' }}
          maxW="100%"
          background="transparent"
          borderRadius="15px"
          mx={{ base: 'auto', lg: 'unset' }}
          me="auto"
          mb={{ base: '20px', md: 'auto' }}
        >
          <Button
            fontSize="sm"
            me="0px"
            mb="14px"
            py="15px"
            h="50px"
            borderRadius="16px"
            bg={googleBg}
            color={googleText}
            fontWeight="600"
            _hover={googleHover}
            _active={googleActive}
            _focus={googleActive}
            onClick={handleGoogleSignIn}
            isLoading={loading}
            loadingText={t('Giriş yapılıyor...', 'Signing in...')}
          >
            <Icon as={FcGoogle as any} w="20px" h="20px" me="10px" />
            {t('Google ile Giriş Yap / Başla', 'Sign In / Start with Google')}
          </Button>

          <NavLink to="/auth/invite">
            <Button
              fontSize="sm"
              variant="outline"
              w="100%"
              h="46px"
              borderRadius="16px"
              mb="20px"
              leftIcon={<Icon as={MdVpnKey as any} />}
            >
              {t('Davet Anahtarı (Key) ile Kaydol', 'Register with Invitation Key')}
            </Button>
          </NavLink>

          <Divider mb="16px" />
          <Text fontSize="xs" color="gray.400" fontWeight="700" mb="10px" textTransform="uppercase">
            {t('Hızlı Önizleme & Demo Modu', 'Quick Preview & Live Demo')}
          </Text>
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing="10px">
            <Button
              size="sm"
              colorScheme="brand"
              variant="solid"
              borderRadius="12px"
              h="40px"
              leftIcon={<Icon as={MdPlayCircleOutline as any} />}
              onClick={() => {
                enableDemoMode('company');
                navigate('/admin/default');
              }}
            >
              {t('Örnek Şirket Paneli', 'Demo Company Panel')}
            </Button>
            <Button
              size="sm"
              colorScheme="purple"
              variant="outline"
              borderRadius="12px"
              h="40px"
              leftIcon={<Icon as={MdBusiness as any} />}
              onClick={() => {
                enableDemoMode('onboarding');
                navigate('/auth/onboarding');
              }}
            >
              {t('Şirket Aç / Katıl Ekranı', 'Create / Join Screen')}
            </Button>
          </SimpleGrid>
        </Flex>
      </Flex>
    </DefaultAuth>
  );
}

export default SignIn;

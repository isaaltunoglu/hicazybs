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
} from '@chakra-ui/react';
import DefaultAuth from 'layouts/auth/Default';
import illustration from 'assets/img/auth/login_bg.png';
import { FcGoogle } from 'react-icons/fc';
import { MdDashboardCustomize, MdVpnKey } from 'react-icons/md';
import { auth, googleProvider, signInWithPopup, db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from 'contexts/AuthContext';
import { useOrganization } from 'contexts/OrganizationContext';

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
  const { user, refreshUserProfile } = useAuth();
  const { orgSettings } = useOrganization();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkUserStatus(user.uid);
    }
  }, [user]);

  const checkUserStatus = async (uid: string) => {
    try {
      const approvedDoc = await getDoc(doc(db, 'approvedUsers', uid));
      if (approvedDoc.exists()) {
        navigate('/admin/default', { replace: true });
      } else {
        // Linksiz giriş yapan ve henüz bir şirkette olmayan kullanıcıya
        // "Şirkete Katıl (Key ile)" veya "Şirket Aç" seçeneklerini göster
        navigate('/auth/onboarding', { replace: true });
      }
    } catch (err) {
      console.error('Approval check error:', err);
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
          title: 'Giriş Başarılı',
          description: 'Yönetim paneline yönlendiriliyorsunuz...',
          status: 'success',
          duration: 2000,
        });
        navigate('/admin/default', { replace: true });
        setLoading(false);
        return;
      }

      // Kullanıcı henüz bir şirkete kayıtlı değilse -> Şirket Aç veya Şirkete Katıl ekranına yönlendir
      navigate('/auth/onboarding', { replace: true });
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({
          title: 'Hata',
          description: 'Giriş yapılırken bir hata oluştu.',
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
        mt={{ base: '40px', md: '14vh' }}
        flexDirection="column"
      >
        <Box me="auto">
          {orgSettings.logoUrl ? (
            <Image
              src={orgSettings.logoUrl}
              alt={orgSettings.organizationName}
              maxW="180px"
              maxH="64px"
              objectFit="contain"
              mb="24px"
            />
          ) : (
            <Flex align="center" gap="12px" mb="24px">
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
          <Heading color={textColor} fontSize="36px" mb="10px">
            Giriş Yap
          </Heading>
          <Text mb="36px" ms="4px" color={textColorSecondary} fontWeight="400" fontSize="md">
            Şirketinize erişmek, yeni şirket açmak veya davet anahtarıyla katılmak için Google ile devam edin
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
            mb="16px"
            py="15px"
            h="50px"
            borderRadius="16px"
            bg={googleBg}
            color={googleText}
            fontWeight="500"
            _hover={googleHover}
            _active={googleActive}
            _focus={googleActive}
            onClick={handleGoogleSignIn}
            isLoading={loading}
            loadingText="Giriş yapılıyor..."
          >
            <Icon as={FcGoogle as any} w="20px" h="20px" me="10px" />
            Google ile Giriş Yap / Başla
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
              Davet Anahtarı (Key) ile Kaydol
            </Button>
          </NavLink>
        </Flex>
      </Flex>
    </DefaultAuth>
  );
}

export default SignIn;

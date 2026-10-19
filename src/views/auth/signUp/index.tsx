/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
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
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Select,
    VStack,
} from '@chakra-ui/react';
import DefaultAuth from 'layouts/auth/Default';
import illustration from 'assets/img/auth/login_bg.png';
import { FcGoogle } from 'react-icons/fc';
import { MdPerson, MdBusiness } from 'react-icons/md';
import { auth, googleProvider, signInWithPopup, db } from '../../../firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useAuth } from 'contexts/AuthContext';
import { useOrganization } from 'contexts/OrganizationContext';

function SignUp() {
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
    const { user } = useAuth();
    const { roles } = useOrganization();

    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [department, setDepartment] = useState('');
    const [departmentsList, setDepartmentsList] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [pendingApproval, setPendingApproval] = useState(false);

    // Fetch Departments
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const q = query(collection(db, 'departments'), orderBy('name'));
                const querySnapshot = await getDocs(q);
                const data: { id: string, name: string }[] = [];
                querySnapshot.forEach((doc) => {
                    data.push({ id: doc.id, ...doc.data() } as { id: string, name: string });
                });
                setDepartmentsList(data);
            } catch (err) {
                console.error('Error fetching departments:', err);
            }
        };
        fetchDepartments();
    }, []);

    // If already logged in AND approved, redirect to admin
    useEffect(() => {
        if (user) {
            checkApproval(user.uid);
        }
    }, [user]);

    const checkApproval = async (uid: string) => {
        try {
            const approvedDoc = await getDoc(doc(db, 'approvedUsers', uid));
            if (approvedDoc.exists()) {
                navigate('/admin/default', { replace: true });
            } else {
                // Check if pending
                const pendingDoc = await getDoc(doc(db, 'pendingUsers', uid));
                if (pendingDoc.exists()) {
                    setPendingApproval(true);
                }
            }
        } catch (err) {
            console.error('Approval check error:', err);
        }
    };

    const handleGoogleSignUp = async () => {
        if (!name.trim() || !surname.trim() || !department.trim()) {
            toast({
                title: 'Eksik Bilgi',
                description: 'Lütfen tüm alanları doldurun',
                status: 'warning',
                duration: 3000,
            });
            return;
        }

        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const googleUser = result.user;

            // Check if already approved
            const approvedDoc = await getDoc(doc(db, 'approvedUsers', googleUser.uid));
            if (approvedDoc.exists()) {
                toast({
                    title: 'Hesap Mevcut',
                    description: 'Zaten bir hesabınız var. Giriş yapılıyor...',
                    status: 'success',
                    duration: 2000,
                });
                navigate('/admin/default', { replace: true });
                setLoading(false);
                return;
            }

            // Check if already pending
            const pendingDoc = await getDoc(doc(db, 'pendingUsers', googleUser.uid));
            if (pendingDoc.exists()) {
                setPendingApproval(true);
                setLoading(false);
                return;
            }

            const defaultRoleName = roles.find((r) => r.isDefault)?.name || 'Personel';

            // Create a pending request
            await setDoc(doc(db, 'pendingUsers', googleUser.uid), {
                name: name.trim(),
                surname: surname.trim(),
                department: department.trim(),
                email: googleUser.email || '',
                photoURL: googleUser.photoURL || '',
                displayName: googleUser.displayName || '',
                uid: googleUser.uid,
                requestedAt: serverTimestamp(),
                status: 'pending',
                role: defaultRoleName,
            });

            setPendingApproval(true);
            toast({
                title: 'İstek Gönderildi',
                description: 'Kayıt isteğiniz yöneticiye iletildi. Onay bekleniyor.',
                status: 'info',
                duration: 5000,
            });
        } catch (error: any) {
            console.error('Google sign-up error:', error);
            if (error.code !== 'auth/popup-closed-by-user') {
                toast({
                    title: 'Hata',
                    description: 'Kayıt olurken bir hata oluştu. Lütfen tekrar deneyin.',
                    status: 'error',
                    duration: 5000,
                });
            }
        }
        setLoading(false);
    };

    const handleSignOut = async () => {
        await auth.signOut();
        setPendingApproval(false);
        setName('');
        setSurname('');
        setDepartment('');
    };

    if (pendingApproval) {
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
                    <Alert
                        status="info"
                        variant="subtle"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        textAlign="center"
                        borderRadius="16px"
                        py="40px"
                        px="30px"
                    >
                        <AlertIcon boxSize="40px" mr={0} mb="16px" />
                        <AlertTitle mt={4} mb={1} fontSize="lg">
                            Onay Bekleniyor
                        </AlertTitle>
                        <AlertDescription maxWidth="sm" mt="8px">
                            Kayıt isteğiniz yöneticiye iletildi. Yönetici onayladıktan
                            sonra sisteme giriş yapabilirsiniz. Lütfen bekleyin.
                        </AlertDescription>
                    </Alert>
                    <Button
                        mt="20px"
                        fontSize="sm"
                        variant="outline"
                        fontWeight="500"
                        w="100%"
                        h="50"
                        onClick={handleSignOut}
                    >
                        Geri Dön
                    </Button>
                    <Button
                        mt="10px"
                        fontSize="sm"
                        variant="brand"
                        fontWeight="500"
                        w="100%"
                        h="50"
                        onClick={() => {
                            if (user) checkApproval(user.uid);
                        }}
                    >
                        Onay Durumunu Kontrol Et
                    </Button>
                </Flex>
            </DefaultAuth>
        );
    }

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
                    <Heading color={textColor} fontSize="36px" mb="10px">
                        Kayıt Ol
                    </Heading>
                    <Text mb="36px" ms="4px" color={textColorSecondary} fontWeight="400" fontSize="md">
                        Bilgilerinizi girin ve Google hesabınızla kayıt olun
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
                    <VStack spacing="16px" mb="24px">
                        <FormControl>
                            <FormLabel
                                display="flex"
                                ms="4px"
                                fontSize="sm"
                                fontWeight="500"
                                color={textColor}
                                mb="8px"
                                alignItems="center"
                            >
                                <Icon as={MdPerson as any} me="8px" />
                                Ad<Text color={brandStars} ms="2px">*</Text>
                            </FormLabel>
                            <Input
                                isRequired
                                variant="auth"
                                fontSize="sm"
                                type="text"
                                placeholder="Adınız"
                                fontWeight="500"
                                size="lg"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel
                                display="flex"
                                ms="4px"
                                fontSize="sm"
                                fontWeight="500"
                                color={textColor}
                                mb="8px"
                                alignItems="center"
                            >
                                <Icon as={MdPerson as any} me="8px" />
                                Soyad<Text color={brandStars} ms="2px">*</Text>
                            </FormLabel>
                            <Input
                                isRequired
                                variant="auth"
                                fontSize="sm"
                                type="text"
                                placeholder="Soyadınız"
                                fontWeight="500"
                                size="lg"
                                value={surname}
                                onChange={(e) => setSurname(e.target.value)}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel
                                display="flex"
                                ms="4px"
                                fontSize="sm"
                                fontWeight="500"
                                color={textColor}
                                mb="8px"
                                alignItems="center"
                            >
                                <Icon as={MdBusiness as any} me="8px" />
                                Departman<Text color={brandStars} ms="2px">*</Text>
                            </FormLabel>
                            <Select
                                isRequired
                                variant="auth"
                                fontSize="sm"
                                placeholder="Departman Seçiniz"
                                fontWeight="500"
                                size="lg"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                            >
                                {departmentsList.map((dept) => (
                                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                                ))}
                            </Select>
                        </FormControl>
                    </VStack>

                    <Button
                        fontSize="sm"
                        me="0px"
                        mb="26px"
                        py="15px"
                        h="50px"
                        borderRadius="16px"
                        bg={googleBg}
                        color={googleText}
                        fontWeight="500"
                        _hover={googleHover}
                        _active={googleActive}
                        _focus={googleActive}
                        onClick={handleGoogleSignUp}
                        isLoading={loading}
                        loadingText="Kayıt olunuyor..."
                    >
                        <Icon as={FcGoogle as any} w="20px" h="20px" me="10px" />
                        Google ile Kayıt Ol
                    </Button>
                    <Flex align='center' mb='25px'>
                        <Text color={textColorSecondary} fontWeight='500' mx='auto'>
                            Zaten hesabınız var mı?{' '}
                            <NavLink to='/auth/sign-in'>
                                <Text color={brandStars} as='span' ms='5px' fontWeight='bold'>
                                    Giriş Yap
                                </Text>
                            </NavLink>
                        </Text>
                    </Flex>
                </Flex>
            </Flex>
        </DefaultAuth>
    );
}

export default SignUp;

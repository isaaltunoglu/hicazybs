/* eslint-disable */
import React, { useEffect, useState, useCallback } from 'react';
import {
    Box,
    Flex,
    Text,
    Icon,
    Button,
    Spinner,
    Badge,
    VStack,
    useColorModeValue,
    useToast,
    CircularProgress,
    CircularProgressLabel,
} from '@chakra-ui/react';
import {
    MdCheckCircle,
    MdExitToApp,
    MdLocationOn,
    MdLocationOff,
    MdAccessTime,
    MdQrCode,
} from 'react-icons/md';
import { useAuth } from 'contexts/AuthContext';
import { useOrganization } from 'contexts/OrganizationContext';
import Card from 'components/card/Card';
import QrScanner from './QrScanner';
import {
    getWorkshopSettings,
    getUserActiveSession,
    checkIn,
    checkOut,
    expireSession,
    getDistanceMetres,
    formatDuration,
    WorkshopSettings,
    WorkshopSession,
} from 'services/workshopService';

type ScanState = 'loading' | 'scanning' | 'locating' | 'checking' | 'checkedIn' | 'checkedOut' | 'error';

export default function WorkshopScan() {
    const { user, userName, userSurname, isApproved } = useAuth();
    const { orgSettings } = useOrganization();
    const toast = useToast();

    const areaLabel = orgSettings.workspaceLabel || 'Çalışma Alanı';

    const [state, setState] = useState<ScanState>('loading');
    const [errorMsg, setErrorMsg] = useState('');
    const [settings, setSettings] = useState<WorkshopSettings | null>(null);
    const [activeSession, setActiveSession] = useState<WorkshopSession | null>(null);
    const [resultMessage, setResultMessage] = useState('');
    const [durationResult, setDurationResult] = useState<number | null>(null);
    const [elapsedMinutes, setElapsedMinutes] = useState(0);

    const textColor = useColorModeValue('secondaryGray.900', 'white');
    const bgColor = useColorModeValue('gray.50', 'navy.900');

    const fullName = `${userName ?? ''} ${userSurname ?? ''}`.trim();

    // Load settings + current session on mount
    useEffect(() => {
        if (!user || !isApproved) return;
        (async () => {
            try {
                const [cfg, session] = await Promise.all([
                    getWorkshopSettings(),
                    getUserActiveSession(user.uid),
                ]);
                setSettings(cfg);
                setActiveSession(session);
                setState('scanning');
            } catch (err) {
                console.error(err);
                setErrorMsg('Ayarlar yüklenemedi. Sayfayı yenileyin.');
                setState('error');
            }
        })();
    }, [user, isApproved]);

    // Elapsed timer for active sessions
    useEffect(() => {
        if (!activeSession) return;
        const calc = () => {
            const checkInDate = activeSession.checkIn.toDate();
            setElapsedMinutes(Math.floor((Date.now() - checkInDate.getTime()) / 60000));
        };
        calc();
        const iv = setInterval(calc, 60000);
        return () => clearInterval(iv);
    }, [activeSession]);

    const handleQrScan = useCallback(async (decodedText: string) => {
        if (!user || !settings) return;

        // QR kodu tam URL içerebilir: extract code param
        let code = decodedText;
        try {
            const url = new URL(decodedText);
            const param = url.searchParams.get('code');
            if (param) code = param;
        } catch (_) {
            // direkt kod
        }

        // QR gizli anahtarını doğrula
        if (code !== settings.qrSecret) {
            setErrorMsg('Geçersiz QR kodu. Lütfen çalışma alanı girişindeki QR kodu okutun.');
            setState('error');
            return;
        }

        setState('locating');

        // Konum servisi desteği kontrolü
        if (!navigator.geolocation) {
            setErrorMsg('Tarayıcınız konum servisini desteklemiyor.');
            setState('error');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const distance = getDistanceMetres(
                    latitude, longitude,
                    settings.workshopLat, settings.workshopLng
                );

                if (distance > settings.workshopRadius) {
                    setErrorMsg(
                        `Çalışma alanına çok uzaksınız (${Math.round(distance)} m). ` +
                        `En fazla ${settings.workshopRadius} m uzaktan kullanılabilir.`
                    );
                    setState('error');
                    return;
                }

                setState('checking');

                try {
                    const session = await getUserActiveSession(user.uid);

                    if (session) {
                        const elapsedHours = (Date.now() - session.checkIn.toDate().getTime()) / 3600000;
                        if (elapsedHours >= settings.maxSessionHours) {
                            await expireSession(session.id);
                            setResultMessage('Oturumunuz süresi dolduğu için sıfırlandı. Yeni oturum başlatılıyor...');
                            await checkIn(user.uid, fullName);
                            setActiveSession(null);
                            setState('checkedIn');
                            toast({ title: 'Oturum sıfırlandı, yeni giriş yapıldı', status: 'warning', duration: 4000 });
                        } else {
                            const duration = await checkOut(session.id, session.checkIn);
                            setDurationResult(duration);
                            setActiveSession(null);
                            setState('checkedOut');
                        }
                    } else {
                        await checkIn(user.uid, fullName);
                        const newSession = await getUserActiveSession(user.uid);
                        setActiveSession(newSession);
                        setState('checkedIn');
                    }
                } catch (err) {
                    console.error(err);
                    setErrorMsg('İşlem sırasında bir hata oluştu. Tekrar deneyin.');
                    setState('error');
                }
            },
            () => {
                setErrorMsg('Konum alınamadı. Lütfen konum iznini etkinleştirin.');
                setState('error');
            },
            { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
        );
    }, [user, settings, fullName, toast]);

    const resetToScan = () => {
        setState('scanning');
        setErrorMsg('');
        setResultMessage('');
        setDurationResult(null);
    };

    const maxPercent = settings
        ? Math.min(100, (elapsedMinutes / (settings.maxSessionHours * 60)) * 100)
        : 0;
    const progressColor = maxPercent > 85 ? 'red' : maxPercent > 60 ? 'orange' : 'green';

    return (
        <Box pt={{ base: '130px', md: '80px', xl: '80px' }} bg={bgColor} minH="100vh">
            <Flex justify="center" align="center" direction="column" gap="20px" maxW="480px" mx="auto" px="20px">

                {/* Başlık */}
                <Text fontSize="2xl" fontWeight="800" color={textColor} textAlign="center">
                    {areaLabel} Giriş/Çıkış
                </Text>

                {/* Kullanıcı bilgisi */}
                {user && isApproved && (
                    <Badge colorScheme="brand" fontSize="md" px="14px" py="6px" borderRadius="full">
                        {fullName}
                    </Badge>
                )}

                {/* Onay bekleyen kullanıcı */}
                {user && !isApproved && (
                    <Card w="100%" p="24px">
                        <VStack spacing="12px">
                            <Icon as={MdLocationOff as any} w="48px" h="48px" color="red.400" />
                            <Text fontWeight="700" color="red.500" textAlign="center">
                                Hesabınız henüz onaylanmadı
                            </Text>
                            <Text fontSize="sm" color="gray.500" textAlign="center">
                                Yönetici onayı bekleniyor.
                            </Text>
                        </VStack>
                    </Card>
                )}

                {/* Aktif oturum bilgisi */}
                {activeSession && state !== 'checkedOut' && (
                    <Card w="100%" p="20px">
                        <Flex direction="column" align="center" gap="12px">
                            <Text fontSize="sm" color="gray.500" fontWeight="600">Aktif Oturum</Text>
                            <CircularProgress
                                value={maxPercent}
                                color={progressColor + '.400'}
                                trackColor="gray.100"
                                size="100px"
                            >
                                <CircularProgressLabel>
                                    <Text fontSize="xs" fontWeight="700" color={progressColor + '.500'}>
                                        {Math.floor(elapsedMinutes / 60)}s {elapsedMinutes % 60}dk
                                    </Text>
                                </CircularProgressLabel>
                            </CircularProgress>
                            <Text fontSize="sm" color="gray.500">
                                Giriş: {activeSession.checkIn.toDate().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                            {settings && (
                                <Text fontSize="xs" color={maxPercent > 85 ? 'red.500' : 'gray.400'}>
                                    Maksimum süre: {settings.maxSessionHours} saat
                                </Text>
                            )}
                        </Flex>
                    </Card>
                )}

                {/* Ana kart */}
                {user && isApproved && (
                    <Card w="100%" p="20px">
                        <VStack spacing="20px">

                            {state === 'loading' && (
                                <>
                                    <Spinner size="xl" color="brand.500" />
                                    <Text color={textColor} fontWeight="600">Yükleniyor...</Text>
                                </>
                            )}

                            {state === 'scanning' && (
                                <>
                                    <Flex align="center" gap="8px">
                                        <Icon as={MdQrCode as any} w="24px" h="24px" color="brand.500" />
                                        <Text fontSize="md" fontWeight="700" color={textColor}>
                                            {activeSession ? 'Çıkış için QR Okutun' : 'Giriş için QR Okutun'}
                                        </Text>
                                    </Flex>
                                    <QrScanner
                                        active={state === 'scanning'}
                                        onScan={handleQrScan}
                                        onError={(err) => {
                                            setErrorMsg(err);
                                            setState('error');
                                        }}
                                    />
                                    <Text fontSize="xs" color="gray.400" textAlign="center">
                                        Kamerayı çalışma alanı girişindeki QR koda doğrultun
                                    </Text>
                                </>
                            )}

                            {state === 'locating' && (
                                <>
                                    <Spinner size="xl" color="brand.500" />
                                    <Flex align="center" gap="8px">
                                        <Icon as={MdLocationOn as any} color="brand.500" />
                                        <Text color={textColor} fontWeight="600">Konumunuz alınıyor...</Text>
                                    </Flex>
                                    <Text fontSize="xs" color="gray.400" textAlign="center">
                                        Konum isteğine izin verin
                                    </Text>
                                </>
                            )}

                            {state === 'checking' && (
                                <>
                                    <Spinner size="xl" color="brand.500" />
                                    <Text color={textColor} fontWeight="600">İşlem yapılıyor...</Text>
                                </>
                            )}

                            {state === 'checkedIn' && (
                                <>
                                    <Icon as={MdCheckCircle as any} w="64px" h="64px" color="green.400" />
                                    <Text fontSize="xl" fontWeight="800" color="green.500" textAlign="center">
                                        Giriş Yapıldı!
                                    </Text>
                                    {resultMessage && (
                                        <Text fontSize="sm" color="orange.500" textAlign="center">
                                            {resultMessage}
                                        </Text>
                                    )}
                                    <Text fontSize="sm" color="gray.500" textAlign="center">
                                        Hoş geldiniz, {fullName}! Oturumunuz başlatıldı.
                                    </Text>
                                    <Button
                                        variant="ghost"
                                        borderRadius="14px"
                                        onClick={resetToScan}
                                    >
                                        Tamam
                                    </Button>
                                </>
                            )}

                            {state === 'checkedOut' && durationResult !== null && (
                                <>
                                    <Icon as={MdAccessTime as any} w="64px" h="64px" color="blue.400" />
                                    <Text fontSize="xl" fontWeight="800" color="blue.500" textAlign="center">
                                        Çıkış Yapıldı!
                                    </Text>
                                    <Text fontSize="lg" fontWeight="700" color={textColor} textAlign="center">
                                        Toplam Süre: {formatDuration(durationResult)}
                                    </Text>
                                    <Text fontSize="sm" color="gray.500" textAlign="center">
                                        Görüşmek üzere, {fullName}!
                                    </Text>
                                    <Button
                                        variant="ghost"
                                        borderRadius="14px"
                                        onClick={resetToScan}
                                    >
                                        Tamam
                                    </Button>
                                </>
                            )}

                            {state === 'error' && (
                                <>
                                    <Icon as={MdLocationOff as any} w="64px" h="64px" color="red.400" />
                                    <Text fontSize="lg" fontWeight="700" color="red.500" textAlign="center">
                                        İşlem Başarısız
                                    </Text>
                                    <Text fontSize="sm" color="gray.500" textAlign="center">
                                        {errorMsg}
                                    </Text>
                                    <Button
                                        colorScheme="red"
                                        variant="outline"
                                        borderRadius="14px"
                                        onClick={resetToScan}
                                    >
                                        Tekrar Tara
                                    </Button>
                                </>
                            )}

                        </VStack>
                    </Card>
                )}

                <Text fontSize="xs" color="gray.400" textAlign="center">
                    {orgSettings.organizationName} • {areaLabel} ve Mesai Takip Sistemi
                </Text>
            </Flex>
        </Box>
    );
}

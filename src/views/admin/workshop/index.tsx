/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Flex,
    Text,
    SimpleGrid,
    Icon,
    Badge,
    Avatar,
    Button,
    Spinner,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Divider,
    useColorModeValue,
    useToast,
    Input,
    FormControl,
    FormLabel,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Tooltip,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    ModalFooter,
    useDisclosure,
    Tag,
} from '@chakra-ui/react';
import { MdPeople, MdAccessTime, MdLeaderboard, MdQrCode, MdSettings, MdRefresh, MdLogin, MdNavigateNext } from 'react-icons/md';
import ReactApexChart from 'react-apexcharts';
import { QRCodeSVG } from 'qrcode.react';
import Card from 'components/card/Card';
import IconBox from 'components/icons/IconBox';
import { useAuth } from 'contexts/AuthContext';
import { useOrganization } from 'contexts/OrganizationContext';
import {
    getActiveSessions,
    getAllCompletedSessions,
    getLast7DaysSessions,
    getWorkshopSettings,
    updateWorkshopSettings,
    expireSession,
    getLeaderboard,
    formatDuration,
    WorkshopSession,
    WorkshopSettings,
} from 'services/workshopService';
import { useNavigate } from 'react-router-dom';

function generateSecret(length = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function WorkshopDashboard() {
    const [activeSessions, setActiveSessions] = useState<WorkshopSession[]>([]);
    const [completedSessions, setCompletedSessions] = useState<WorkshopSession[]>([]);
    const [weekSessions, setWeekSessions] = useState<WorkshopSession[]>([]);
    const [settings, setSettings] = useState<WorkshopSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [localMaxHours, setLocalMaxHours] = useState(8);
    const [localSecret, setLocalSecret] = useState('');
    const [localLat, setLocalLat] = useState(41.0082);
    const [localLng, setLocalLng] = useState(28.9784);
    const [localRadius, setLocalRadius] = useState(200);

    const { isOpen: isQrOpen, onOpen: onQrOpen, onClose: onQrClose } = useDisclosure();
    const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();

    const { isSuperAdmin, isManager, companyId } = useAuth();
    const { orgSettings, activeSubTeam, activeSubTeamId } = useOrganization();
    const toast = useToast();
    const navigate = useNavigate();

    const canManage = isManager || isSuperAdmin;
    const areaLabel = activeSubTeam
        ? `${activeSubTeam.name} (${orgSettings.workspaceLabel || 'Çalışma Alanı'})`
        : orgSettings.workspaceLabel || 'Çalışma Alanı';

    const textColor = useColorModeValue('secondaryGray.900', 'white');
    const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
    const brandColor = useColorModeValue('brand.500', 'white');
    const boxBg = useColorModeValue('secondaryGray.300', 'whiteAlpha.100');

    const qrUrl = `${window.location.origin}/admin/workshop/scan?code=${settings?.qrSecret ?? ''}`;

    const fetchAll = useCallback(async () => {
        setLoading(true);

        // Step 1: Always load settings first (needed for QR code + max hours)
        let cfg: WorkshopSettings;
        try {
            cfg = await getWorkshopSettings();
            setSettings(cfg);
            setLocalMaxHours(cfg.maxSessionHours);
            setLocalSecret(cfg.qrSecret);
            setLocalLat(cfg.workshopLat ?? 41.0082);
            setLocalLng(cfg.workshopLng ?? 28.9784);
            setLocalRadius(cfg.workshopRadius ?? 200);
        } catch (err) {
            console.error('Settings load error:', err);
            toast({ title: 'Ayarlar yüklenemedi', status: 'error', duration: 3000 });
            setLoading(false);
            return;
        }

        // Step 2: Her sorgu bağımsız — biri başarısız olsa diğerleri çalışır
        const now = Date.now();

        try {
            const active = await getActiveSessions();
            // Süresi dolan aktif oturumları expire et
            for (const s of active) {
                const elapsed = (now - s.checkIn.toDate().getTime()) / 3600000;
                if (elapsed >= cfg.maxSessionHours) {
                    await expireSession(s.id);
                }
            }
            const stillActive = active.filter((s) => {
                const elapsed = (now - s.checkIn.toDate().getTime()) / 3600000;
                return elapsed < cfg.maxSessionHours;
            });
            setActiveSessions(stillActive);
        } catch (err: any) {
            console.error('Active sessions error:', err);
        }

        try {
            const completed = await getAllCompletedSessions();
            setCompletedSessions(completed);
        } catch (err: any) {
            console.error('Completed sessions error:', err);
        }

        try {
            const week = await getLast7DaysSessions();
            setWeekSessions(week);
        } catch (err: any) {
            console.error('Week sessions error:', err);
        }

        setLoading(false);
    }, [toast, companyId, activeSubTeamId]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // Refresh active sessions every 60s
    useEffect(() => {
        const iv = setInterval(fetchAll, 60000);
        return () => clearInterval(iv);
    }, [fetchAll]);

    const handleSaveSettings = async () => {
        setSavingSettings(true);
        try {
            await updateWorkshopSettings({
                maxSessionHours: localMaxHours,
                qrSecret: localSecret,
                workshopLat: localLat,
                workshopLng: localLng,
                workshopRadius: localRadius,
            });
            setSettings((prev) => prev ? {
                ...prev,
                maxSessionHours: localMaxHours,
                qrSecret: localSecret,
                workshopLat: localLat,
                workshopLng: localLng,
                workshopRadius: localRadius,
            } : prev);
            toast({ title: 'Ayarlar kaydedildi', status: 'success', duration: 2000 });
            onSettingsClose();
            fetchAll();
        } catch (err) {
            toast({ title: 'Kayıt hatası', status: 'error', duration: 3000 });
        } finally {
            setSavingSettings(false);
        }
    };

    // --- Chart data ---
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
    });

    const chartData = last7Days.map((date) => {
        const daySum = weekSessions
            .filter((s) => s.date === date)
            .reduce((sum, s) => sum + (s.duration ?? 0), 0);
        return Math.round(daySum / 60 * 10) / 10; // hours
    });

    const chartLabels = last7Days.map((d) => {
        const date = new Date(d + 'T00:00:00');
        return date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' });
    });

    const chartOptions: ApexCharts.ApexOptions = {
        chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
        plotOptions: { bar: { borderRadius: 6, columnWidth: '50%' } },
        dataLabels: { enabled: false },
        xaxis: {
            categories: chartLabels,
            labels: { style: { colors: Array(7).fill('#A0AEC0'), fontSize: '12px' } },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: {
                style: { colors: ['#A0AEC0'], fontSize: '12px' },
                formatter: (v) => `${v}s`,
            },
        },
        grid: { borderColor: '#EDF2F7', strokeDashArray: 3 },
        fill: { type: 'gradient', gradient: { shade: 'light', type: 'vertical', gradientToColors: ['#7551FF'], stops: [0, 100] } },
        colors: ['#4318FF'],
        tooltip: { y: { formatter: (v) => `${v} saat` } },
        theme: { mode: 'light' },
    };

    // --- Leaderboard ---
    const leaderboard = getLeaderboard(completedSessions);

    const medalColors = ['gold', 'silver', '#cd7f32'];

    return (
        <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
            {/* Header */}
            <Flex mb="24px" justify="space-between" align="center" flexWrap="wrap" gap="12px">
                <Text fontSize="2xl" fontWeight="700" color={textColor}>
                    {areaLabel} / Mesai Takibi
                </Text>
                <Flex gap="10px">
                    <Button
                        leftIcon={<Icon as={MdLogin as any} />}
                        colorScheme="green"
                        borderRadius="14px"
                        onClick={() => navigate('/admin/workshop/scan')}
                        size="md"
                    >
                        Giriş/Çıkış
                    </Button>
                    {canManage && (
                        <>
                            <Button
                                leftIcon={<Icon as={MdQrCode as any} />}
                                colorScheme="brand"
                                variant="outline"
                                borderRadius="14px"
                                onClick={onQrOpen}
                                size="md"
                            >
                                QR Kodu
                            </Button>
                            <Button
                                leftIcon={<Icon as={MdSettings as any} />}
                                variant="ghost"
                                borderRadius="14px"
                                onClick={onSettingsOpen}
                                size="md"
                            >
                                Ayarlar
                            </Button>
                        </>
                    )}
                    <Tooltip label="Yenile">
                        <Button
                            leftIcon={<Icon as={MdRefresh as any} />}
                            variant="ghost"
                            borderRadius="14px"
                            onClick={fetchAll}
                            isLoading={loading}
                            size="md"
                        >
                            Yenile
                        </Button>
                    </Tooltip>
                </Flex>
            </Flex>

            {loading ? (
                <Flex justify="center" py="60px">
                    <Spinner size="xl" color="brand.500" />
                </Flex>
            ) : (
                <>
                    {/* Stats row */}
                    <SimpleGrid columns={{ base: 1, md: 3 }} gap="20px" mb="24px">
                        <Card py="20px" px="20px">
                            <Flex align="center" gap="14px">
                                <IconBox w="56px" h="56px" bg={boxBg}
                                    icon={<Icon w="28px" h="28px" as={MdPeople as any} color={brandColor} />}
                                />
                                <Box>
                                    <Text fontSize="28px" fontWeight="800" color={textColor}>
                                        {activeSessions.length}
                                    </Text>
                                    <Text fontSize="sm" color="gray.400" fontWeight="500">
                                        Şu An Aktif ({areaLabel})
                                    </Text>
                                </Box>
                            </Flex>
                        </Card>
                        <Card py="20px" px="20px">
                            <Flex align="center" gap="14px">
                                <IconBox w="56px" h="56px" bg={boxBg}
                                    icon={<Icon w="28px" h="28px" as={MdAccessTime as any} color="green.400" />}
                                />
                                <Box>
                                    <Text fontSize="28px" fontWeight="800" color={textColor}>
                                        {formatDuration(weekSessions.reduce((s, x) => s + (x.duration ?? 0), 0))}
                                    </Text>
                                    <Text fontSize="sm" color="gray.400" fontWeight="500">
                                        Bu Hafta Toplam
                                    </Text>
                                </Box>
                            </Flex>
                        </Card>
                        <Card py="20px" px="20px">
                            <Flex align="center" gap="14px">
                                <IconBox w="56px" h="56px" bg={boxBg}
                                    icon={<Icon w="28px" h="28px" as={MdLeaderboard as any} color="orange.400" />}
                                />
                                <Box>
                                    <Text fontSize="28px" fontWeight="800" color={textColor}>
                                        {leaderboard.length}
                                    </Text>
                                    <Text fontSize="sm" color="gray.400" fontWeight="500">
                                        Toplam Katılımcı
                                    </Text>
                                </Box>
                            </Flex>
                        </Card>
                    </SimpleGrid>

                    {/* Active users + Chart */}
                    <SimpleGrid columns={{ base: 1, xl: 2 }} gap="20px" mb="24px">
                        {/* Active Users */}
                        <Card p="0" overflow="hidden">
                            <Flex px="24px" pt="20px" pb="14px" justify="space-between" align="center">
                                <Flex align="center" gap="8px">
                                    <Box w="10px" h="10px" borderRadius="full" bg="green.400" />
                                    <Text fontSize="lg" fontWeight="700" color={textColor}>
                                        Şu An Aktif Olanlar
                                    </Text>
                                </Flex>
                                <Badge colorScheme="green" borderRadius="full" px="10px">
                                    {activeSessions.length} kişi
                                </Badge>
                            </Flex>
                            <Divider />
                            {activeSessions.length === 0 ? (
                                <Flex justify="center" py="32px">
                                    <Text color="gray.400">Şu an aktif kimse yok</Text>
                                </Flex>
                            ) : (
                                <Box px="24px" py="12px">
                                    {activeSessions.map((s) => {
                                        const elapsed = Math.floor((Date.now() - s.checkIn.toDate().getTime()) / 60000);
                                        const hours = Math.floor(elapsed / 60);
                                        const mins = elapsed % 60;
                                        return (
                                            <Flex key={s.id} align="center" justify="space-between" py="10px">
                                                <Flex align="center" gap="10px">
                                                    <Avatar name={s.userName} size="sm" />
                                                    <Text fontWeight="600" color={textColor} fontSize="sm">
                                                        {s.userName}
                                                    </Text>
                                                </Flex>
                                                <Tag colorScheme="green" borderRadius="full" size="sm">
                                                    {hours > 0 ? `${hours}s ${mins}dk` : `${mins} dk`}
                                                </Tag>
                                            </Flex>
                                        );
                                    })}
                                </Box>
                            )}
                        </Card>

                        {/* Weekly Chart */}
                        <Card p="0">
                            <Flex px="24px" pt="20px" pb="14px" align="center" gap="8px">
                                <Text fontSize="lg" fontWeight="700" color={textColor}>
                                    Haftalık Katılım
                                </Text>
                                <Text fontSize="xs" color="gray.400">(saat)</Text>
                            </Flex>
                            <Divider />
                            <Box px="10px" pb="10px" pt="4px">
                                <ReactApexChart
                                    type="bar"
                                    series={[{ name: 'Çalışma Saati', data: chartData }]}
                                    options={chartOptions}
                                    height={220}
                                />
                            </Box>
                        </Card>
                    </SimpleGrid>

                    {/* Leaderboard */}
                    <Card p="0" overflow="hidden">
                        <Flex px="24px" pt="20px" pb="14px" align="center" gap="8px">
                            <Icon as={MdLeaderboard as any} h="22px" w="22px" color="orange.400" />
                            <Text fontSize="lg" fontWeight="700" color={textColor}>
                                Katılım Sıralaması
                            </Text>
                            <Text fontSize="xs" color="gray.400">– toplam çalışma süresi</Text>
                        </Flex>
                        <Divider />
                        {leaderboard.length === 0 ? (
                            <Flex justify="center" py="32px">
                                <Text color="gray.400">Henüz kayıt yok</Text>
                            </Flex>
                        ) : (
                            <Table variant="simple" color="gray.500">
                                <Thead>
                                    <Tr>
                                        <Th borderColor={borderColor} w="60px">#</Th>
                                        <Th borderColor={borderColor}>Kullanıcı</Th>
                                        <Th borderColor={borderColor} textAlign="right">Toplam Süre</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {leaderboard.map((entry, idx) => (
                                        <Tr key={entry.uid}>
                                            <Td borderColor={borderColor} fontWeight="700">
                                                {idx < 3 ? (
                                                    <Text fontSize="lg" style={{ color: medalColors[idx] }}>
                                                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                                                    </Text>
                                                ) : (
                                                    <Text color="gray.400" fontSize="sm">{idx + 1}</Text>
                                                )}
                                            </Td>
                                            <Td borderColor={borderColor}>
                                                <Flex align="center" gap="10px">
                                                    <Avatar name={entry.userName} size="sm" />
                                                    <Text color={textColor} fontWeight="600" fontSize="sm">
                                                        {entry.userName}
                                                    </Text>
                                                </Flex>
                                            </Td>
                                            <Td borderColor={borderColor} textAlign="right">
                                                <Badge
                                                    colorScheme={idx === 0 ? 'yellow' : idx === 1 ? 'gray' : 'orange'}
                                                    borderRadius="full"
                                                    px="10px"
                                                    py="4px"
                                                    fontSize="sm"
                                                >
                                                    {formatDuration(entry.totalMinutes)}
                                                </Badge>
                                            </Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        )}
                    </Card>
                </>
            )}

            {/* QR Code Modal */}
            <Modal isOpen={isQrOpen} onClose={onQrClose} size="sm" isCentered>
                <ModalOverlay />
                <ModalContent borderRadius="20px">
                    <ModalHeader textAlign="center">{areaLabel} QR Kodu</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Flex direction="column" align="center" gap="16px" py="10px">
                            {settings && (
                                <>
                                    <Box p="16px" bg="white" borderRadius="16px" boxShadow="md">
                                        <QRCodeSVG value={qrUrl} size={200} />
                                    </Box>
                                    <Text fontSize="xs" color="gray.500" textAlign="center" wordBreak="break-all">
                                        {qrUrl}
                                    </Text>
                                    <Text fontSize="xs" color="gray.400" textAlign="center">
                                        Bu QR kodu yazdırarak çalışma alanı girişine asabilirsiniz.
                                    </Text>
                                </>
                            )}
                        </Flex>
                    </ModalBody>
                    <ModalFooter>
                        <Button w="100%" borderRadius="14px" colorScheme="brand" onClick={onQrClose}>
                            Kapat
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Settings Modal — only for canManage */}
            {canManage && (
                <Modal isOpen={isSettingsOpen} onClose={onSettingsClose} size="md">
                    <ModalOverlay />
                    <ModalContent borderRadius="20px">
                        <ModalHeader>{areaLabel} ve Mesai Ayarları</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <Flex direction="column" gap="20px">
                                <FormControl>
                                    <FormLabel fontWeight="600">Maksimum Oturum Süresi (saat)</FormLabel>
                                    <NumberInput
                                        min={1}
                                        max={24}
                                        value={localMaxHours}
                                        onChange={(_, v) => setLocalMaxHours(v)}
                                        borderRadius="10px"
                                    >
                                        <NumberInputField borderRadius="10px" />
                                        <NumberInputStepper>
                                            <NumberIncrementStepper />
                                            <NumberDecrementStepper />
                                        </NumberInputStepper>
                                    </NumberInput>
                                </FormControl>
                                <FormControl>
                                    <FormLabel fontWeight="600">QR Kod Gizli Anahtarı</FormLabel>
                                    <Flex gap="8px">
                                        <Input
                                            value={localSecret}
                                            onChange={(e) => setLocalSecret(e.target.value)}
                                            borderRadius="10px"
                                            fontFamily="monospace"
                                        />
                                        <Tooltip label="Yeni anahtar oluştur">
                                            <Button
                                                borderRadius="10px"
                                                onClick={() => setLocalSecret(generateSecret())}
                                                colorScheme="gray"
                                                px="12px"
                                            >
                                                <Icon as={MdRefresh as any} />
                                            </Button>
                                        </Tooltip>
                                    </Flex>
                                    <Text fontSize="xs" color="gray.400" mt="4px">
                                        Anahtarı değiştirirseniz yeni QR kodu yazdırmanız gerekir.
                                    </Text>
                                </FormControl>
                                <FormControl>
                                    <FormLabel fontWeight="600">Çalışma Alanı Konumu (Enlem)</FormLabel>
                                    <Input
                                        value={localLat}
                                        onChange={(e) => setLocalLat(Number(e.target.value))}
                                        borderRadius="10px"
                                        type="number"
                                        step="0.000001"
                                        placeholder="41.008200"
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel fontWeight="600">Çalışma Alanı Konumu (Boylam)</FormLabel>
                                    <Input
                                        value={localLng}
                                        onChange={(e) => setLocalLng(Number(e.target.value))}
                                        borderRadius="10px"
                                        type="number"
                                        step="0.000001"
                                        placeholder="28.978400"
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel fontWeight="600">Konum Yarıçapı (metre)</FormLabel>
                                    <NumberInput
                                        min={10}
                                        max={1000}
                                        value={localRadius}
                                        onChange={(_, v) => setLocalRadius(v)}
                                        borderRadius="10px"
                                    >
                                        <NumberInputField borderRadius="10px" />
                                        <NumberInputStepper>
                                            <NumberIncrementStepper />
                                            <NumberDecrementStepper />
                                        </NumberInputStepper>
                                    </NumberInput>
                                    <Text fontSize="xs" color="gray.400" mt="4px">
                                        Kullanıcının çalışma alanına kaç metre yakın olması gerektiğini belirler.
                                    </Text>
                                </FormControl>
                            </Flex>
                        </ModalBody>
                        <ModalFooter gap="8px">
                            <Button variant="ghost" onClick={onSettingsClose} borderRadius="14px">İptal</Button>
                            <Button
                                colorScheme="brand"
                                borderRadius="14px"
                                isLoading={savingSettings}
                                onClick={handleSaveSettings}
                            >
                                Kaydet
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
        </Box>
    );
}

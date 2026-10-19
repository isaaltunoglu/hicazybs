import {
    Box,
    Icon,
    SimpleGrid,
    useColorModeValue,
    Text,
    Flex,
    Image,
    Badge,
    Button,
    Spinner,
} from '@chakra-ui/react';
import MiniStatistics from 'components/card/MiniStatistics';
import IconBox from 'components/icons/IconBox';
import { MdInventory, MdCategory, MdLocationOn, MdTrendingUp, MdAnnouncement } from 'react-icons/md';
import { useEffect, useState, useCallback } from 'react';
import { getAllItems } from 'services/inventoryService';
import { getAllCategories } from 'services/categoryService';
import { getLatestAnnouncements, Announcement } from 'services/announcementService';
import { InventoryItem, Category } from 'types/inventory';
import Card from 'components/card/Card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';
import { useOrganization } from 'contexts/OrganizationContext';

export default function Dashboard() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loadingAnn, setLoadingAnn] = useState(true);

    const { companyId } = useAuth();
    const { activeSubTeamId } = useOrganization();

    const brandColor = useColorModeValue('brand.500', 'white');
    const boxBg = useColorModeValue('secondaryGray.300', 'whiteAlpha.100');
    const textColor = useColorModeValue('secondaryGray.900', 'white');
    const cardBg = useColorModeValue('white', 'navy.700');
    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        try {
            const [fetchedItems, fetchedCategories, fetchedAnn] = await Promise.all([
                getAllItems(),
                getAllCategories(),
                getLatestAnnouncements(4),
            ]);
            setItems(fetchedItems);
            setCategories(fetchedCategories);
            setAnnouncements(fetchedAnn);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoadingAnn(false);
        }
    }, [companyId, activeSubTeamId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const totalItems = items.length;
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    const totalCategories = categories.length;
    const uniqueLocations = new Set(items.map((i) => i.location)).size;

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="20px" mb="20px">
                <MiniStatistics
                    startContent={
                        <IconBox
                            w="56px"
                            h="56px"
                            bg={boxBg}
                            icon={<Icon w="32px" h="32px" as={MdInventory as any} color={brandColor} />}
                        />
                    }
                    name="Toplam Öğe"
                    value={String(totalItems)}
                />
                <MiniStatistics
                    startContent={
                        <IconBox
                            w="56px"
                            h="56px"
                            bg={boxBg}
                            icon={<Icon w="32px" h="32px" as={MdTrendingUp as any} color={brandColor} />}
                        />
                    }
                    name="Toplam Miktar"
                    value={String(totalAmount)}
                />
                <MiniStatistics
                    startContent={
                        <IconBox
                            w="56px"
                            h="56px"
                            bg={boxBg}
                            icon={<Icon w="32px" h="32px" as={MdCategory as any} color={brandColor} />}
                        />
                    }
                    name="Kategoriler"
                    value={String(totalCategories)}
                />
                <MiniStatistics
                    startContent={
                        <IconBox
                            w="56px"
                            h="56px"
                            bg={boxBg}
                            icon={<Icon w="32px" h="32px" as={MdLocationOn as any} color={brandColor} />}
                        />
                    }
                    name="Konumlar"
                    value={String(uniqueLocations)}
                />
            </SimpleGrid>

            {/* Announcements Section */}
            <Box mb="20px">
                <Flex justify="space-between" align="center" mb="16px">
                    <Flex align="center" gap="8px">
                        <Icon as={MdAnnouncement as any} w="24px" h="24px" color={brandColor} />
                        <Text fontSize="xl" fontWeight="700" color={textColor}>
                            Son Duyurular
                        </Text>
                    </Flex>
                    <Button
                        variant="ghost"
                        colorScheme="brand"
                        size="sm"
                        onClick={() => navigate('/admin/announcements')}
                        borderRadius="10px"
                    >
                        Tümünü Gör
                    </Button>
                </Flex>

                {loadingAnn ? (
                    <Flex justify="center" py="20px">
                        <Spinner color="brand.500" />
                    </Flex>
                ) : announcements.length === 0 ? (
                    <Card p="24px">
                        <Text color="gray.400" textAlign="center" fontSize="sm">
                            Henüz duyuru bulunmamaktadır.
                        </Text>
                    </Card>
                ) : (
                    <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap="16px">
                        {announcements.map((ann) => (
                            <Card key={ann.id} p="0" overflow="hidden" bg={cardBg} cursor="pointer"
                                onClick={() => navigate('/admin/announcements')}
                                _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
                                transition="all 0.2s"
                            >
                                {ann.imageUrl && (
                                    <Image
                                        src={ann.imageUrl}
                                        alt={ann.title}
                                        w="100%"
                                        h="120px"
                                        objectFit="cover"
                                        fallback={<Box w="100%" h="120px" bg="gray.100" />}
                                    />
                                )}
                                <Box p="14px">
                                    <Text
                                        fontSize="sm"
                                        fontWeight="700"
                                        color={textColor}
                                        noOfLines={2}
                                        mb="6px"
                                    >
                                        {ann.title}
                                    </Text>
                                    {ann.content && (
                                        <Text fontSize="xs" color="gray.500" noOfLines={2} mb="8px">
                                            {ann.content}
                                        </Text>
                                    )}
                                    <Flex justify="space-between" align="center">
                                        <Badge colorScheme="brand" fontSize="xs" borderRadius="full" px="6px">
                                            {ann.createdBy}
                                        </Badge>
                                        <Text fontSize="xs" color="gray.400">
                                            {formatDate(ann.createdAt)}
                                        </Text>
                                    </Flex>
                                </Box>
                            </Card>
                        ))}
                    </SimpleGrid>
                )}
            </Box>
        </Box>
    );
}

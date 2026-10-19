/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Button,
    Flex,
    Text,
    Icon,
    useColorModeValue,
    useToast,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    SimpleGrid,
    Image,
    IconButton,
    Tooltip,
    Spinner,
    Badge,
} from '@chakra-ui/react';
import { MdAdd, MdDelete, MdAnnouncement } from 'react-icons/md';
import Card from 'components/card/Card';
import { useAuth } from 'contexts/AuthContext';
import { useOrganization } from 'contexts/OrganizationContext';
import {
    getAllAnnouncements,
    createAnnouncement,
    deleteAnnouncement,
    Announcement,
} from 'services/announcementService';

export default function Announcements() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [title, setTitle] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [content, setContent] = useState('');

    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();
    const { isManager, isSuperAdmin, userName, userSurname, user, companyId } = useAuth();
    const { activeSubTeamId } = useOrganization();
    const textColor = useColorModeValue('secondaryGray.900', 'white');
    const cardBg = useColorModeValue('white', 'navy.700');

    const canPublish = isManager || isSuperAdmin;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAllAnnouncements();
            setAnnouncements(data);
        } catch (err) {
            toast({ title: 'Duyurular yüklenemedi', status: 'error', duration: 3000 });
        } finally {
            setLoading(false);
        }
    }, [toast, companyId, activeSubTeamId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleClose = () => {
        setTitle('');
        setImageUrl('');
        setContent('');
        onClose();
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast({ title: 'Başlık zorunludur', status: 'warning', duration: 2000 });
            return;
        }
        setSubmitting(true);
        try {
            await createAnnouncement(
                { title: title.trim(), imageUrl: imageUrl.trim(), content: content.trim() },
                `${userName} ${userSurname}`,
                user?.uid || ''
            );
            toast({ title: 'Duyuru yayınlandı', status: 'success', duration: 2000 });
            handleClose();
            fetchData();
        } catch (err) {
            toast({ title: 'Duyuru eklenemedi', status: 'error', duration: 3000 });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (announcement: Announcement) => {
        const canDelete = isSuperAdmin || announcement.createdByUid === user?.uid;
        if (!canDelete) {
            toast({ title: 'Bu duyuruyu silme yetkiniz yok', status: 'warning', duration: 2000 });
            return;
        }
        if (!window.confirm('Duyuru silinsin mi?')) return;
        try {
            await deleteAnnouncement(announcement.id);
            toast({ title: 'Duyuru silindi', status: 'info', duration: 2000 });
            fetchData();
        } catch (err) {
            toast({ title: 'Silme işlemi başarısız', status: 'error', duration: 3000 });
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
            <Flex mb="24px" justifyContent="space-between" alignItems="center">
                <Text fontSize="2xl" fontWeight="700" color={textColor}>
                    Duyurular
                </Text>
                {canPublish && (
                    <Button
                        leftIcon={<Icon as={MdAdd as any} />}
                        colorScheme="brand"
                        borderRadius="14px"
                        fontWeight="600"
                        onClick={onOpen}
                        size="md"
                    >
                        Duyuru Ekle
                    </Button>
                )}
            </Flex>

            {loading ? (
                <Flex justify="center" py="40px">
                    <Spinner size="xl" color="brand.500" />
                </Flex>
            ) : announcements.length === 0 ? (
                <Card p="40px">
                    <Flex direction="column" align="center" gap="12px">
                        <Icon as={MdAnnouncement as any} w="48px" h="48px" color="gray.300" />
                        <Text fontSize="lg" color="gray.500" textAlign="center">
                            Henüz duyuru bulunmamaktadır.
                        </Text>
                    </Flex>
                </Card>
            ) : (
                <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="20px">
                    {announcements.map((ann) => {
                        const canDelete = isSuperAdmin || ann.createdByUid === user?.uid;
                        return (
                            <Card key={ann.id} p="0" overflow="hidden" bg={cardBg}>
                                {ann.imageUrl && (
                                    <Image
                                        src={ann.imageUrl}
                                        alt={ann.title}
                                        w="100%"
                                        h="180px"
                                        objectFit="cover"
                                        fallback={
                                            <Box w="100%" h="180px" bg="gray.100" />
                                        }
                                    />
                                )}
                                <Box p="20px">
                                    <Flex justify="space-between" align="flex-start" mb="8px">
                                        <Text
                                            fontSize="lg"
                                            fontWeight="700"
                                            color={textColor}
                                            flex="1"
                                            mr="8px"
                                        >
                                            {ann.title}
                                        </Text>
                                        {canDelete && (
                                            <Tooltip label="Sil">
                                                <IconButton
                                                    aria-label="Delete"
                                                    icon={<Icon as={MdDelete as any} />}
                                                    size="xs"
                                                    colorScheme="red"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(ann)}
                                                />
                                            </Tooltip>
                                        )}
                                    </Flex>
                                    {ann.content && (
                                        <Text fontSize="sm" color="gray.500" mb="12px" noOfLines={3}>
                                            {ann.content}
                                        </Text>
                                    )}
                                    <Flex justify="space-between" align="center">
                                        <Badge colorScheme="brand" borderRadius="full" px="8px" fontSize="xs">
                                            {ann.createdBy}
                                        </Badge>
                                        <Text fontSize="xs" color="gray.400">
                                            {formatDate(ann.createdAt)}
                                        </Text>
                                    </Flex>
                                </Box>
                            </Card>
                        );
                    })}
                </SimpleGrid>
            )}

            {/* Add Announcement Modal */}
            <Modal isOpen={isOpen} onClose={handleClose} size="lg">
                <ModalOverlay />
                <ModalContent borderRadius="20px">
                    <ModalHeader>Yeni Duyuru Ekle</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Flex direction="column" gap="16px">
                            <FormControl isRequired>
                                <FormLabel fontWeight="600">Başlık</FormLabel>
                                <Input
                                    placeholder="Duyuru başlığı..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    borderRadius="10px"
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel fontWeight="600">Görsel URL (İsteğe Bağlı)</FormLabel>
                                <Input
                                    placeholder="https://..."
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    borderRadius="10px"
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel fontWeight="600">İçerik (İsteğe Bağlı)</FormLabel>
                                <Textarea
                                    placeholder="Duyuru içeriği..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    borderRadius="10px"
                                    rows={4}
                                />
                            </FormControl>
                        </Flex>
                    </ModalBody>
                    <ModalFooter gap="8px">
                        <Button variant="ghost" onClick={handleClose}>
                            İptal
                        </Button>
                        <Button
                            colorScheme="brand"
                            onClick={handleSubmit}
                            isLoading={submitting}
                            isDisabled={!title.trim()}
                            borderRadius="14px"
                        >
                            Yayınla
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}

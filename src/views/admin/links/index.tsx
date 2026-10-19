/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Flex,
    Text,
    Icon,
    Button,
    Spinner,
    SimpleGrid,
    Badge,
    IconButton,
    Input,
    Textarea,
    FormControl,
    FormLabel,
    useColorModeValue,
    useToast,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    ModalFooter,
    Divider,
    Link,
    Tooltip,
} from '@chakra-ui/react';
import { MdAdd, MdDelete, MdLink, MdOpenInNew, MdLabel } from 'react-icons/md';
import Card from 'components/card/Card';
import { useAuth } from 'contexts/AuthContext';
import { useOrganization } from 'contexts/OrganizationContext';
import {
    getAllLinks,
    createLink,
    deleteLink,
    TeamLink,
    TeamLinkFormData,
} from 'services/linkService';

const EMPTY_FORM: TeamLinkFormData = { title: '', url: '', description: '', category: '' };

export default function LinksPage() {
    const { isManager, isSuperAdmin, user, userName, userSurname, companyId } = useAuth();
    const { activeSubTeamId } = useOrganization();
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [links, setLinks] = useState<TeamLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [form, setForm] = useState<TeamLinkFormData>(EMPTY_FORM);

    const textColor = useColorModeValue('secondaryGray.900', 'white');
    const cardBg = useColorModeValue('white', 'navy.700');
    const subColor = useColorModeValue('gray.500', 'gray.400');
    const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');

    const canManage = isManager || isSuperAdmin;
    const fullName = `${userName ?? ''} ${userSurname ?? ''}`.trim();

    const fetchLinks = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAllLinks();
            setLinks(data);
        } catch (err) {
            console.error(err);
            toast({ title: 'Bağlantılar yüklenemedi', status: 'error', duration: 3000 });
        } finally {
            setLoading(false);
        }
    }, [toast, companyId, activeSubTeamId]);

    useEffect(() => {
        fetchLinks();
    }, [fetchLinks]);

    const handleOpen = () => {
        setForm(EMPTY_FORM);
        onOpen();
    };

    const handleClose = () => {
        setForm(EMPTY_FORM);
        onClose();
    };

    const handleSave = async () => {
        if (!form.title.trim()) {
            toast({ title: 'Başlık zorunludur', status: 'warning', duration: 2000 });
            return;
        }
        if (!form.url.trim()) {
            toast({ title: 'URL zorunludur', status: 'warning', duration: 2000 });
            return;
        }

        // Basit URL doğrulama
        let url = form.url.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        setSaving(true);
        try {
            await createLink(
                { ...form, url },
                fullName,
                user?.uid ?? ''
            );
            toast({ title: 'Bağlantı eklendi', status: 'success', duration: 2000 });
            handleClose();
            fetchLinks();
        } catch (err) {
            console.error(err);
            toast({ title: 'Kayıt hatası', status: 'error', duration: 3000 });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeleting(id);
        try {
            await deleteLink(id);
            toast({ title: 'Bağlantı silindi', status: 'success', duration: 2000 });
            setLinks((prev) => prev.filter((l) => l.id !== id));
        } catch (err) {
            console.error(err);
            toast({ title: 'Silme hatası', status: 'error', duration: 3000 });
        } finally {
            setDeleting(null);
        }
    };

    // Kategoriye göre grupla
    const grouped: Record<string, TeamLink[]> = {};
    const uncategorized: TeamLink[] = [];
    for (const link of links) {
        if (link.category?.trim()) {
            const cat = link.category.trim();
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(link);
        } else {
            uncategorized.push(link);
        }
    }
    const categoryKeys = Object.keys(grouped).sort();
    if (uncategorized.length > 0) categoryKeys.push('__other__');

    return (
        <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
            {/* Başlık */}
            <Flex mb="24px" justify="space-between" align="center" flexWrap="wrap" gap="12px">
                <Flex align="center" gap="10px">
                    <Icon as={MdLink as any} w="28px" h="28px" color="brand.500" />
                    <Text fontSize="2xl" fontWeight="700" color={textColor}>
                        Kurumsal Bağlantılar
                    </Text>
                </Flex>
                {canManage && (
                    <Button
                        leftIcon={<Icon as={MdAdd as any} />}
                        colorScheme="brand"
                        borderRadius="14px"
                        onClick={handleOpen}
                        size="md"
                    >
                        Bağlantı Ekle
                    </Button>
                )}
            </Flex>

            {loading ? (
                <Flex justify="center" py="60px">
                    <Spinner size="xl" color="brand.500" />
                </Flex>
            ) : links.length === 0 ? (
                <Card p="40px">
                    <Flex direction="column" align="center" gap="12px">
                        <Icon as={MdLink as any} w="48px" h="48px" color="gray.300" />
                        <Text color="gray.400" fontWeight="600">Henüz bağlantı eklenmedi</Text>
                        {canManage && (
                            <Text fontSize="sm" color="gray.400">
                                "Bağlantı Ekle" butonuyla ilk bağlantıyı ekleyebilirsiniz.
                            </Text>
                        )}
                    </Flex>
                </Card>
            ) : (
                <Flex direction="column" gap="32px">
                    {categoryKeys.map((cat) => {
                        const catLinks = cat === '__other__' ? uncategorized : grouped[cat];
                        return (
                            <Box key={cat}>
                                {/* Kategori başlığı */}
                                <Flex align="center" gap="8px" mb="14px">
                                    <Icon as={MdLabel as any} w="18px" h="18px" color="brand.400" />
                                    <Text
                                        fontSize="md"
                                        fontWeight="700"
                                        color={textColor}
                                        textTransform="uppercase"
                                        letterSpacing="0.05em"
                                    >
                                        {cat === '__other__' ? 'Diğer' : cat}
                                    </Text>
                                    <Divider flex="1" borderColor={borderColor} />
                                    <Badge colorScheme="brand" borderRadius="full" px="8px">
                                        {catLinks.length}
                                    </Badge>
                                </Flex>

                                <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="16px">
                                    {catLinks.map((link) => (
                                        <Card
                                            key={link.id}
                                            p="20px"
                                            bg={cardBg}
                                            borderRadius="16px"
                                            position="relative"
                                            _hover={{ shadow: 'md', transform: 'translateY(-1px)', transition: 'all 0.15s' }}
                                        >
                                            {/* Sil butonu */}
                                            {canManage && (
                                                <Tooltip label="Bağlantıyı sil">
                                                    <IconButton
                                                        aria-label="sil"
                                                        icon={<Icon as={MdDelete as any} />}
                                                        size="xs"
                                                        colorScheme="red"
                                                        variant="ghost"
                                                        position="absolute"
                                                        top="12px"
                                                        right="12px"
                                                        isLoading={deleting === link.id}
                                                        onClick={() => handleDelete(link.id)}
                                                    />
                                                </Tooltip>
                                            )}

                                            <Flex direction="column" gap="8px" pr="24px">
                                                {/* Başlık */}
                                                <Text
                                                    fontWeight="700"
                                                    fontSize="md"
                                                    color={textColor}
                                                    noOfLines={2}
                                                >
                                                    {link.title}
                                                </Text>

                                                {/* Açıklama */}
                                                {link.description?.trim() && (
                                                    <Text
                                                        fontSize="sm"
                                                        color={subColor}
                                                        noOfLines={2}
                                                    >
                                                        {link.description}
                                                    </Text>
                                                )}

                                                {/* URL */}
                                                <Link
                                                    href={link.url}
                                                    isExternal
                                                    color="brand.500"
                                                    fontSize="sm"
                                                    fontWeight="500"
                                                    display="flex"
                                                    alignItems="center"
                                                    gap="4px"
                                                    noOfLines={1}
                                                    _hover={{ textDecoration: 'underline' }}
                                                >
                                                    <Icon as={MdOpenInNew as any} w="14px" h="14px" />
                                                    {link.url.replace(/^https?:\/\//, '')}
                                                </Link>

                                                {/* Alt bilgi */}
                                                <Divider borderColor={borderColor} />
                                                <Text fontSize="xs" color="gray.400">
                                                    {link.createdBy}
                                                    {link.createdAt && (
                                                        <> · {link.createdAt.toDate().toLocaleDateString('tr-TR')}</>
                                                    )}
                                                </Text>
                                            </Flex>
                                        </Card>
                                    ))}
                                </SimpleGrid>
                            </Box>
                        );
                    })}
                </Flex>
            )}

            {/* Bağlantı Ekleme Modalı */}
            <Modal isOpen={isOpen} onClose={handleClose} size="md" isCentered>
                <ModalOverlay />
                <ModalContent borderRadius="20px">
                    <ModalHeader>Yeni Bağlantı Ekle</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Flex direction="column" gap="16px">
                            <FormControl isRequired>
                                <FormLabel fontWeight="600" fontSize="sm">Başlık</FormLabel>
                                <Input
                                    placeholder="Örn: Tasarım Dosyaları"
                                    borderRadius="10px"
                                    value={form.title}
                                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                />
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel fontWeight="600" fontSize="sm">URL</FormLabel>
                                <Input
                                    placeholder="https://..."
                                    borderRadius="10px"
                                    value={form.url}
                                    onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel fontWeight="600" fontSize="sm">Kategori <Text as="span" color="gray.400" fontWeight="400">(isteğe bağlı)</Text></FormLabel>
                                <Input
                                    placeholder="Örn: Dokümanlar, Araçlar, Sosyal Medya..."
                                    borderRadius="10px"
                                    value={form.category}
                                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel fontWeight="600" fontSize="sm">Açıklama <Text as="span" color="gray.400" fontWeight="400">(isteğe bağlı)</Text></FormLabel>
                                <Textarea
                                    placeholder="Bu bağlantı hakkında kısa bir açıklama..."
                                    borderRadius="10px"
                                    rows={3}
                                    value={form.description}
                                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                    resize="none"
                                />
                            </FormControl>
                        </Flex>
                    </ModalBody>
                    <ModalFooter gap="8px">
                        <Button variant="ghost" borderRadius="14px" onClick={handleClose}>
                            İptal
                        </Button>
                        <Button
                            colorScheme="brand"
                            borderRadius="14px"
                            isLoading={saving}
                            onClick={handleSave}
                        >
                            Kaydet
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}

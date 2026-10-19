import {
    Box,
    Button,
    Flex,
    FormControl,
    FormLabel,
    Icon,
    IconButton,
    Input,
    Select,
    SimpleGrid,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tooltip,
    Tr,
    useColorModeValue,
    useToast,
    VStack,
    Badge,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    useDisclosure,
} from '@chakra-ui/react';
import Card from 'components/card/Card';
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import { useEffect, useState, useCallback } from 'react';
import { Category, CategoryFormData } from 'types/inventory';
import {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} from 'services/categoryService';
import { useAuth } from 'contexts/AuthContext';
import { useOrganization } from 'contexts/OrganizationContext';

const COLORS = [
    { value: 'purple', label: 'Mor' },
    { value: 'blue', label: 'Mavi' },
    { value: 'green', label: 'Yeşil' },
    { value: 'red', label: 'Kırmızı' },
    { value: 'orange', label: 'Turuncu' },
    { value: 'yellow', label: 'Sarı' },
    { value: 'pink', label: 'Pembe' },
    { value: 'teal', label: 'Turkuaz' },
    { value: 'cyan', label: 'Camgöbeği' },
    { value: 'gray', label: 'Gri' },
];

export default function Categories() {
    const [categories, setCategories] = useState<Category[]>([]);

    const [editCat, setEditCat] = useState<Category | null>(null);
    const [name, setName] = useState('');
    const [color, setColor] = useState('purple');
    const [formLoading, setFormLoading] = useState(false);

    const { companyId } = useAuth();
    const { activeSubTeamId } = useOrganization();

    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();

    const textColor = useColorModeValue('secondaryGray.900', 'white');
    const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
    const bgColor = useColorModeValue('white', 'navy.800');

    const fetchCategories = useCallback(async () => {
        try {
            const data = await getAllCategories();
            setCategories(data);
        } catch (err) {
            console.error('Error fetching categories:', err);
            toast({ title: 'Kategoriler yüklenemedi', status: 'error', duration: 3000, isClosable: true });
        }
    }, [toast, companyId, activeSubTeamId]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleAddClick = () => {
        setEditCat(null);
        setName('');
        setColor('purple');
        onOpen();
    };

    const handleEditClick = (cat: Category) => {
        setEditCat(cat);
        setName(cat.name);
        setColor(cat.color);
        onOpen();
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteCategory(id);
            toast({ title: 'Kategori silindi', status: 'info', duration: 2000, isClosable: true });
            await fetchCategories();
        } catch (err) {
            console.error('Error deleting category:', err);
            toast({ title: 'Hata oluştu', status: 'error', duration: 3000, isClosable: true });
        }
    };

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setFormLoading(true);
        try {
            const data: CategoryFormData = { name: name.trim(), color };
            if (editCat) {
                await updateCategory(editCat.id, data);
                toast({ title: 'Kategori güncellendi', status: 'success', duration: 2000, isClosable: true });
            } else {
                await createCategory(data);
                toast({ title: 'Kategori eklendi', status: 'success', duration: 2000, isClosable: true });
            }
            onClose();
            await fetchCategories();
        } catch (err) {
            console.error('Error saving category:', err);
            toast({ title: 'Hata oluştu', status: 'error', duration: 3000, isClosable: true });
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
            <Flex mb="20px" justifyContent="flex-end">
                <Button
                    leftIcon={<Icon as={MdAdd as any} />}
                    colorScheme="brand"
                    borderRadius="14px"
                    fontWeight="600"
                    onClick={handleAddClick}
                    size="md"
                >
                    Yeni Kategori
                </Button>
            </Flex>

            <SimpleGrid columns={{ sm: 1 }} spacing="20px">
                <Card flexDirection="column" w="100%" px="0px" overflowX={{ sm: 'scroll', lg: 'hidden' }}>
                    <Flex px="25px" mb="8px" justifyContent="space-between" align="center">
                        <Text color={textColor} fontSize="22px" fontWeight="700" lineHeight="100%">
                            Kategoriler
                        </Text>
                    </Flex>
                    <Box>
                        <Table variant="simple" color="gray.500" mb="24px" mt="12px">
                            <Thead>
                                <Tr>
                                    <Th pe="10px" borderColor={borderColor}>
                                        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
                                            AD
                                        </Text>
                                    </Th>
                                    <Th pe="10px" borderColor={borderColor}>
                                        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
                                            RENK
                                        </Text>
                                    </Th>
                                    <Th pe="10px" borderColor={borderColor}>
                                        <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
                                            İŞLEMLER
                                        </Text>
                                    </Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {categories.length === 0 ? (
                                    <Tr>
                                        <Td colSpan={3} textAlign="center" py="40px">
                                            <Text color="gray.400" fontSize="md">
                                                Henüz kategori eklenmemiş.
                                            </Text>
                                        </Td>
                                    </Tr>
                                ) : (
                                    categories.map((cat) => (
                                        <Tr key={cat.id}>
                                            <Td borderColor="transparent">
                                                <Text color={textColor} fontSize="sm" fontWeight="700">
                                                    {cat.name}
                                                </Text>
                                            </Td>
                                            <Td borderColor="transparent">
                                                <Badge colorScheme={cat.color} borderRadius="8px" px="10px" py="4px">
                                                    {COLORS.find((c) => c.value === cat.color)?.label || cat.color}
                                                </Badge>
                                            </Td>
                                            <Td borderColor="transparent">
                                                <Flex gap="2">
                                                    <Tooltip label="Düzenle">
                                                        <IconButton
                                                            aria-label="Düzenle"
                                                            icon={<Icon as={MdEdit as any} />}
                                                            size="sm"
                                                            variant="ghost"
                                                            colorScheme="brand"
                                                            onClick={() => handleEditClick(cat)}
                                                        />
                                                    </Tooltip>
                                                    <Tooltip label="Sil">
                                                        <IconButton
                                                            aria-label="Sil"
                                                            icon={<Icon as={MdDelete as any} />}
                                                            size="sm"
                                                            variant="ghost"
                                                            colorScheme="red"
                                                            onClick={() => handleDelete(cat.id)}
                                                        />
                                                    </Tooltip>
                                                </Flex>
                                            </Td>
                                        </Tr>
                                    ))
                                )}
                            </Tbody>
                        </Table>
                    </Box>
                </Card>
            </SimpleGrid>

            {/* Category Form Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
                <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(6px)" />
                <ModalContent bg={bgColor} borderRadius="20px">
                    <ModalHeader fontSize="xl" fontWeight="700">
                        {editCat ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel fontWeight="600">Ad</FormLabel>
                                <Input
                                    placeholder="Örn: Elektronik"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    borderRadius="14px"
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel fontWeight="600">Renk</FormLabel>
                                <Select
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    borderRadius="14px"
                                >
                                    {COLORS.map((c) => (
                                        <option key={c.value} value={c.value}>
                                            {c.label}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose} borderRadius="14px">
                            İptal
                        </Button>
                        <Button
                            colorScheme="brand"
                            onClick={handleSubmit}
                            isLoading={formLoading}
                            borderRadius="14px"
                            isDisabled={!name.trim()}
                        >
                            {editCat ? 'Güncelle' : 'Ekle'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}

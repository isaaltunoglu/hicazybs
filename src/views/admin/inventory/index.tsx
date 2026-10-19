import { 
    Box, 
    Button, 
    Flex, 
    useDisclosure, 
    useToast, 
    Icon, 
    Text, 
    useColorModeValue,
    Select
} from '@chakra-ui/react';
import { MdAdd } from 'react-icons/md';
import { useEffect, useState, useCallback } from 'react';
import InventoryTable from './components/InventoryTable';
import ItemFormModal from './components/ItemFormModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import { InventoryItem, InventoryItemFormData } from 'types/inventory';
import { Category } from 'types/inventory';
import { getAllItems, createItem, updateItem, deleteItem } from 'services/inventoryService';
import { getAllCategories } from 'services/categoryService';
import { useAuth } from 'contexts/AuthContext';
import { useOrganization } from 'contexts/OrganizationContext';

export default function Inventory() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    const [editItem, setEditItem] = useState<InventoryItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);

    const { companyId } = useAuth();
    const { activeSubTeamId } = useOrganization();

    const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
    const toast = useToast();

    const textColor = useColorModeValue('secondaryGray.900', 'white');

    const fetchData = useCallback(async () => {
        try {
            const [fetchedItems, fetchedCategories] = await Promise.all([
                getAllItems(),
                getAllCategories(),
            ]);
            setItems(fetchedItems);
            setCategories(fetchedCategories);
        } catch (err) {
            console.error('Error fetching data:', err);
            toast({
                title: 'Veri yüklenirken hata oluştu',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    }, [toast, companyId, activeSubTeamId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddClick = () => {
        setEditItem(null);
        onFormOpen();
    };

    const handleEditClick = (item: InventoryItem) => {
        setEditItem(item);
        onFormOpen();
    };

    const handleDeleteClick = (item: InventoryItem) => {
        setDeleteTarget(item);
        onDeleteOpen();
    };

    const handleFormSubmit = async (data: InventoryItemFormData) => {
        if (editItem) {
            await updateItem(editItem.id, data);
            toast({ title: 'Öğe güncellendi', status: 'success', duration: 2000, isClosable: true });
        } else {
            await createItem(data);
            toast({ title: 'Öğe eklendi', status: 'success', duration: 2000, isClosable: true });
        }
        await fetchData();
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        await deleteItem(deleteTarget.id);
        toast({ title: 'Öğe silindi', status: 'info', duration: 2000, isClosable: true });
        setDeleteTarget(null);
        await fetchData();
    };

    const filteredItems = selectedCategory
        ? items.filter((item) => item.category === selectedCategory.id)
        : items;

    const selectBg = useColorModeValue('white', 'navy.800');

    return (
        <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
            <Flex mb="20px" justifyContent="space-between" alignItems="center" flexDirection={{ base: 'column', md: 'row' }} gap="4">
                <Text fontSize="22px" fontWeight="700" color={textColor}>
                    Envanter Listesi
                </Text>
                <Flex gap="2" w={{ base: '100%', md: 'auto' }}>
                    <Select
                        placeholder="Tüm Kategoriler"
                        value={selectedCategory?.id || ''}
                        onChange={(e) => {
                            const cat = categories.find(c => c.id === e.target.value);
                            setSelectedCategory(cat || null);
                        }}
                        borderRadius="14px"
                        bg={selectBg}
                        w={{ base: '100%', md: '200px' }}
                    >
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </Select>
                    <Button
                        leftIcon={<Icon as={MdAdd as any} />}
                        colorScheme="brand"
                        borderRadius="14px"
                        fontWeight="600"
                        onClick={handleAddClick}
                        size="md"
                        minW="150px"
                    >
                        Yeni Öğe Ekle
                    </Button>
                </Flex>
            </Flex>

            <InventoryTable 
                items={filteredItems} 
                categories={categories}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
            />

            <ItemFormModal
                isOpen={isFormOpen}
                onClose={onFormClose}
                onSubmit={handleFormSubmit}
                categories={categories}
                editItem={editItem}
            />

            <DeleteConfirmModal
                isOpen={isDeleteOpen}
                onClose={onDeleteClose}
                onConfirm={handleDeleteConfirm}
                item={deleteTarget}
            />
        </Box>
    );
}

import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    Button,
    FormControl,
    FormLabel,
    Input,
    Select,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    VStack,
    useColorModeValue,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { InventoryItem, InventoryItemFormData, Category } from 'types/inventory';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: InventoryItemFormData) => Promise<void>;
    categories: Category[];
    editItem?: InventoryItem | null;
};

export default function ItemFormModal({ isOpen, onClose, onSubmit, categories, editItem }: Props) {
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState(1);
    const [loading, setLoading] = useState(false);

    const bgColor = useColorModeValue('white', 'navy.800');

    useEffect(() => {
        if (editItem) {
            setName(editItem.name);
            setLocation(editItem.location);
            setCategory(editItem.category);
            setAmount(editItem.amount);
        } else {
            setName('');
            setLocation('');
            setCategory(categories.length > 0 ? categories[0].id : '');
            setAmount(1);
        }
    }, [editItem, isOpen, categories]);

    const handleSubmit = async () => {
        if (!name.trim() || !location.trim() || !category) return;
        setLoading(true);
        try {
            await onSubmit({ name: name.trim(), location: location.trim(), category, amount });
            onClose();
        } catch (err) {
            console.error('Error saving item:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
            <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(6px)" />
            <ModalContent bg={bgColor} borderRadius="20px">
                <ModalHeader fontSize="xl" fontWeight="700">
                    {editItem ? 'Öğeyi Düzenle' : 'Yeni Öğe Ekle'}
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4}>
                        <FormControl isRequired>
                            <FormLabel fontWeight="600">Ad</FormLabel>
                            <Input
                                placeholder="Örn: M5 Civata"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                borderRadius="14px"
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel fontWeight="600">Konum</FormLabel>
                            <Input
                                placeholder="Örn: Depo A - Raf 3"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                borderRadius="14px"
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel fontWeight="600">Kategori</FormLabel>
                            <Select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                borderRadius="14px"
                            >
                                {categories.length === 0 && <option value="">Önce kategori ekleyin</option>}
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel fontWeight="600">Miktar</FormLabel>
                            <NumberInput
                                min={0}
                                value={amount}
                                onChange={(_, val) => setAmount(val || 0)}
                                borderRadius="14px"
                            >
                                <NumberInputField borderRadius="14px" />
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
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
                        isLoading={loading}
                        borderRadius="14px"
                        isDisabled={!name.trim() || !location.trim() || !category}
                    >
                        {editItem ? 'Güncelle' : 'Ekle'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    Button,
    Text,
    useColorModeValue,
} from '@chakra-ui/react';
import { useState } from 'react';
import { InventoryItem } from 'types/inventory';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    item: InventoryItem | null;
};

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, item }: Props) {
    const [loading, setLoading] = useState(false);
    const bgColor = useColorModeValue('white', 'navy.800');

    const handleDelete = async () => {
        setLoading(true);
        try {
            await onConfirm();
            onClose();
        } catch (err) {
            console.error('Error deleting item:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm" isCentered>
            <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(6px)" />
            <ModalContent bg={bgColor} borderRadius="20px">
                <ModalHeader fontSize="xl" fontWeight="700">
                    Silme Onayı
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Text fontSize="md">
                        <Text as="span" fontWeight="700">
                            "{item?.name}"
                        </Text>{' '}
                        öğesini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                    </Text>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose} borderRadius="14px">
                        İptal
                    </Button>
                    <Button
                        colorScheme="red"
                        onClick={handleDelete}
                        isLoading={loading}
                        borderRadius="14px"
                    >
                        Sil
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

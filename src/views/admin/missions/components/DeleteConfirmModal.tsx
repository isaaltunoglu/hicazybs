import {
    Button,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
} from '@chakra-ui/react';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm }: Props) {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent borderRadius="20px">
                <ModalHeader>Görevi Sil</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Text>Bu görevi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</Text>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose} borderRadius="14px">
                        İptal
                    </Button>
                    <Button colorScheme="red" onClick={onConfirm} borderRadius="14px">
                        Sil
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

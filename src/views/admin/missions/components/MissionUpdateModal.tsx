import {
    Button,
    FormControl,
    FormLabel,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    VStack,
    Textarea,
    Text,
    Box,
    Divider,
    useColorModeValue,
    Flex,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { Mission, MissionStatus } from 'types/mission';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    mission: Mission | null;
    onUpdate: (status: MissionStatus, message: string) => void;
};

export default function MissionUpdateModal({ isOpen, onClose, mission, onUpdate }: Props) {
    const [status, setStatus] = useState<MissionStatus>(mission?.status || 'Not Started');
    const [message, setMessage] = useState('');
    const historyBg = useColorModeValue('gray.50', 'navy.800');

    React.useEffect(() => {
        if (mission) {
            setStatus(mission.status);
            setMessage('');
        }
    }, [mission, isOpen]);

    const handleSubmit = () => {
        onUpdate(status, message);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent borderRadius="20px">
                <ModalHeader>Durum Güncelle / Süreç Bilgisi</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <Box>
                            <Text fontWeight="700" mb="2">Görev:</Text>
                            <Text fontSize="sm" color="gray.600">{mission?.description}</Text>
                        </Box>
                        
                        <Divider />

                        <FormControl isRequired>
                            <FormLabel>Yeni Durum</FormLabel>
                            <Select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as MissionStatus)}
                                borderRadius="14px"
                            >
                                <option value="Not Started">Henüz Başlamadı</option>
                                <option value="Working">Çalışılıyor</option>
                                <option value="Completed">Tamamlandı</option>
                            </Select>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Süreç Bilgisi / Not (Opsiyonel)</FormLabel>
                            <Textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Yapılan çalışmalar hakkında bilgi verin..."
                                borderRadius="14px"
                            />
                        </FormControl>

                        {mission?.processUpdates && mission.processUpdates.length > 0 && (
                            <Box mt="4">
                                <Text fontWeight="700" mb="2">Süreç Geçmişi:</Text>
                                <VStack align="stretch" spacing={2} maxH="200px" overflowY="auto" p="2">
                                    {mission.processUpdates.slice().reverse().map((update, idx) => (
                                        <Box key={idx} p="2" bg={historyBg} borderRadius="10px">
                                            <Flex justify="space-between" mb="1">
                                                <Text fontWeight="600" fontSize="xs">{update.user}</Text>
                                                <Text fontSize="xs" color="gray.500">
                                                    {new Date(update.timestamp).toLocaleString('tr-TR')}
                                                </Text>
                                            </Flex>
                                            <Text fontSize="sm">{update.message}</Text>
                                        </Box>
                                    ))}
                                </VStack>
                            </Box>
                        )}
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose} borderRadius="14px">
                        İptal
                    </Button>
                    <Button colorScheme="brand" onClick={handleSubmit} borderRadius="14px">
                        Güncelle
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

import { Box, Flex, useToast, Text, Badge, useDisclosure } from '@chakra-ui/react';
import React, { useEffect, useState, useCallback } from 'react';
import MissionTable from '../missions/components/MissionTable';
import MissionUpdateModal from '../missions/components/MissionUpdateModal';
import { Mission, MissionStatus } from 'types/mission';
import { getAllMissions, updateMissionStatus, addMissionUpdate } from 'services/missionService';
import { useAuth } from 'contexts/AuthContext';
import Card from 'components/card/Card';

export default function MyMissions() {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();
    const { userName, userSurname } = useAuth();

    const fetchData = useCallback(async () => {
        try {
            const fetchedMissions = await getAllMissions();
            const fullName = `${userName} ${userSurname}`;
            const filtered = fetchedMissions.filter(m => 
                m.assessmentPersons.includes(fullName)
            );
            setMissions(filtered);
        } catch (err) {
            console.error('Error fetching data:', err);
            toast({
                title: 'Veri yüklenirken hata oluştu',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    }, [toast, userName, userSurname]);

    useEffect(() => {
        if (userName) {
            fetchData();
        }
    }, [fetchData, userName]);

    const handleUpdateClick = (mission: Mission) => {
        setSelectedMission(mission);
        onOpen();
    };

    const handleUpdateSubmit = async (status: MissionStatus, message: string) => {
        if (!selectedMission) return;

        try {
            if (status !== selectedMission.status) {
                await updateMissionStatus(selectedMission.id, status);
            }

            if (message.trim()) {
                await addMissionUpdate(selectedMission.id, {
                    user: `${userName} ${userSurname}`,
                    message: message.trim(),
                    timestamp: new Date()
                });
            }

            toast({ title: 'Görev güncellendi', status: 'success', duration: 2000 });
            fetchData();
        } catch (err) {
            console.error('Error updating mission:', err);
            toast({ title: 'Güncelleme hatası', status: 'error', duration: 3000 });
        }
    };

    return (
        <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
            <Flex mb="20px" justifyContent="space-between" alignItems="center">
                <Flex align="center">
                    <Text fontSize="2xl" fontWeight="700" color="secondaryGray.900" mr="4">
                        Görevlerim
                    </Text>
                    {missions.length > 0 && (
                        <Badge colorScheme="red" borderRadius="full" px="2">
                            {missions.length} Yeni Değerlendirme
                        </Badge>
                    )}
                </Flex>
            </Flex>

            {missions.length === 0 ? (
                <Card p="20px">
                    <Text textAlign="center" fontSize="lg" color="gray.500">
                        Henüz değerlendirmeniz gereken bir görev bulunmamaktadır.
                    </Text>
                </Card>
            ) : (
                <MissionTable
                    missions={missions}
                    onEdit={() => {}} 
                    onDelete={() => {}} 
                    onUpdateStatus={handleUpdateClick}
                    canEdit={false} 
                />
            )}

            <MissionUpdateModal
                isOpen={isOpen}
                onClose={onClose}
                mission={selectedMission}
                onUpdate={handleUpdateSubmit}
            />
        </Box>
    );
}

import { Box, Button, Flex, useDisclosure, useToast, Text, Icon, Switch, FormControl, FormLabel, Badge } from '@chakra-ui/react';
import { MdAdd } from 'react-icons/md';
import React, { useEffect, useState, useCallback } from 'react';
import MissionTable from './components/MissionTable';
import MissionFormModal from './components/MissionFormModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import MissionUpdateModal from './components/MissionUpdateModal';
import { Mission, MissionFormData, MissionStatus } from 'types/mission';
import { getAllMissions, createMission, updateMission, deleteMission, updateMissionStatus, addMissionUpdate } from 'services/missionService';
import { getAllApprovedUsers, UserProfile } from 'services/userService';
import { useAuth } from 'contexts/AuthContext';
import { useOrganization } from 'contexts/OrganizationContext';
import { useLanguage } from 'contexts/LanguageContext';

export default function Missions() {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [editMission, setEditMission] = useState<Mission | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Mission | null>(null);
    const [updateTarget, setUpdateTarget] = useState<Mission | null>(null);
    const [showMyMissions, setShowMyMissions] = useState(true);

    const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
    const { isOpen: isUpdateOpen, onOpen: onUpdateOpen, onClose: onUpdateClose } = useDisclosure();
    const toast = useToast();
    const { isManager, isSuperAdmin, userName, userSurname, companyId } = useAuth();
    const { activeSubTeamId } = useOrganization();
    const { t } = useLanguage();

    const canManage = isManager || isSuperAdmin;

    const fullName = `${userName} ${userSurname}`;

    const fetchData = useCallback(async () => {
        try {
            const [fetchedMissions, fetchedUsers] = await Promise.all([
                getAllMissions(),
                getAllApprovedUsers(),
            ]);
            setMissions(fetchedMissions);
            setUsers(fetchedUsers);
        } catch (err) {
            console.error('Error fetching data:', err);
            toast({
                title: t('Veri yüklenirken hata oluştu', 'Error loading data'),
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    }, [toast, companyId, activeSubTeamId, t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const myMissions = missions.filter(m => m.assessmentPersons.includes(fullName));
    const displayedMissions = showMyMissions ? myMissions : missions;

    // In "my missions" view: regular users can update status; managers can always update
    // In "all missions" view: only managers can update status
    const canUpdateStatus = (mission: Mission) => {
        if (canManage) return true;
        if (showMyMissions) return mission.assessmentPersons.includes(fullName);
        return false;
    };

    const handleAddClick = () => {
        setEditMission(null);
        onFormOpen();
    };

    const handleEditClick = (mission: Mission) => {
        setEditMission(mission);
        onFormOpen();
    };

    const handleDeleteClick = (mission: Mission) => {
        setDeleteTarget(mission);
        onDeleteOpen();
    };

    const handleUpdateClick = (mission: Mission) => {
        setUpdateTarget(mission);
        onUpdateOpen();
    };

    const handleUpdateSubmit = async (status: MissionStatus, message: string) => {
        if (!updateTarget) return;

        try {
            if (status !== updateTarget.status) {
                await updateMissionStatus(updateTarget.id, status);
            }

            if (message.trim()) {
                const userLabel = canManage
                    ? `${fullName} (${t('Yönetici', 'Manager')})`
                    : fullName;
                await addMissionUpdate(updateTarget.id, {
                    user: userLabel,
                    message: message.trim(),
                    timestamp: new Date()
                });
            }

            toast({ title: t('Görev güncellendi', 'Task updated'), status: 'success', duration: 2000 });
            fetchData();
        } catch (err) {
            console.error('Error updating mission:', err);
            toast({ title: t('Güncelleme hatası', 'Update error'), status: 'error', duration: 3000 });
        }
    };

    const handleFormSubmit = async (data: MissionFormData) => {
        try {
            if (editMission) {
                await updateMission(editMission.id, data);
                toast({ title: t('Görev güncellendi', 'Task updated'), status: 'success', duration: 2000, isClosable: true });
            } else {
                await createMission(data);
                toast({ title: t('Görev eklendi', 'Task added'), status: 'success', duration: 2000, isClosable: true });
            }
            await fetchData();
        } catch (error) {
            toast({ title: t('İşlem başarısız', 'Operation failed'), status: 'error', duration: 3000, isClosable: true });
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMission(deleteTarget.id);
            toast({ title: t('Görev silindi', 'Task deleted'), status: 'info', duration: 2000, isClosable: true });
            setDeleteTarget(null);
            await fetchData();
        } catch (error) {
            toast({ title: t('Silme işlemi başarısız', 'Delete failed'), status: 'error', duration: 3000, isClosable: true });
        } finally {
            onDeleteClose();
        }
    };

    return (
        <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
            <Flex mb="20px" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="12px">
                <Flex align="center" gap="16px">
                    <Text fontSize="2xl" fontWeight="700" color="secondaryGray.900">
                        {showMyMissions ? t('Görevlerim', 'My Tasks') : t('Tüm Görevler', 'All Tasks')}
                    </Text>
                    {showMyMissions && myMissions.length > 0 && (
                        <Badge colorScheme="red" borderRadius="full" px="2">
                            {myMissions.filter(m => m.status !== 'Completed').length} {t('Bekliyor', 'Pending')}
                        </Badge>
                    )}
                </Flex>

                <Flex align="center" gap="20px">
                    <FormControl display="flex" alignItems="center" gap="8px" w="auto">
                        <FormLabel mb="0" fontWeight="600" fontSize="sm" color="secondaryGray.700">
                            {t('Görevlerim', 'My Tasks')}
                        </FormLabel>
                        <Switch
                            isChecked={!showMyMissions}
                            onChange={(e) => setShowMyMissions(!e.target.checked)}
                            colorScheme="brand"
                            size="md"
                        />
                        <FormLabel mb="0" fontWeight="600" fontSize="sm" color="secondaryGray.700">
                            {t('Tüm Görevler', 'All Tasks')}
                        </FormLabel>
                    </FormControl>

                    {canManage && (
                        <Button
                            leftIcon={<Icon as={MdAdd as any} />}
                            colorScheme="brand"
                            borderRadius="14px"
                            fontWeight="600"
                            onClick={handleAddClick}
                            size="md"
                        >
                            {t('Yeni Görev Ekle', 'Add New Task')}
                        </Button>
                    )}
                </Flex>
            </Flex>

            <MissionTable
                missions={displayedMissions}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onUpdateStatus={handleUpdateClick}
                canEdit={!!canManage}
                canUpdateStatus={canUpdateStatus}
            />

            <MissionFormModal
                isOpen={isFormOpen}
                onClose={onFormClose}
                onSubmit={handleFormSubmit}
                editData={editMission}
                users={users}
            />

            <MissionUpdateModal
                isOpen={isUpdateOpen}
                onClose={onUpdateClose}
                mission={updateTarget}
                onUpdate={handleUpdateSubmit}
            />

            <DeleteConfirmModal
                isOpen={isDeleteOpen}
                onClose={onDeleteClose}
                onConfirm={handleDeleteConfirm}
            />
        </Box>
    );
}

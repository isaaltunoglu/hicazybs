/* eslint-disable */
import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Flex,
    FormControl,
    FormLabel,
    Input,
    SimpleGrid,
    Text,
    useColorModeValue,
    useToast,
    Switch,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    Icon,
    IconButton,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    useDisclosure,
    Select,
    VStack,
    Divider,
    Image,
    Tooltip,
} from '@chakra-ui/react';
import { MdAdd, MdEdit, MdDelete, MdBusiness, MdSecurity, MdSave, MdGroups } from 'react-icons/md';
import Card from 'components/card/Card';
import { useAuth } from 'contexts/AuthContext';
import { useOrganization } from 'contexts/OrganizationContext';
import { useLanguage } from 'contexts/LanguageContext';
import { updateOrganizationSettings, OrganizationSettings } from 'services/organizationService';
import {
    RoleDefinition,
    RoleFormData,
    createRole,
    updateRole,
    deleteRole,
} from 'services/roleService';
import {
    createSubTeam,
    deleteSubTeam,
} from 'services/companyService';

const ROLE_COLORS = [
    { value: 'purple', label: 'Mor / Purple' },
    { value: 'blue', label: 'Mavi / Blue' },
    { value: 'teal', label: 'Turkuaz / Teal' },
    { value: 'green', label: 'Yeşil / Green' },
    { value: 'orange', label: 'Turuncu / Orange' },
    { value: 'red', label: 'Kırmızı / Red' },
    { value: 'gray', label: 'Gri / Gray' },
];

export default function OrganizationSettingsView() {
    const { isSuperAdmin, companyId } = useAuth();
    const {
        orgSettings,
        roles,
        subTeams,
        activeSubTeamId,
        setActiveSubTeamId,
        refreshOrganization,
        refreshRoles,
        refreshSubTeams,
    } = useOrganization();
    const { t } = useLanguage();
    const toast = useToast();

    const textColor = useColorModeValue('secondaryGray.900', 'white');
    const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
    const modalBg = useColorModeValue('white', 'navy.800');

    // Organization form state
    const [orgForm, setOrgForm] = useState<OrganizationSettings>(orgSettings);
    const [savingOrg, setSavingOrg] = useState(false);

    // Sub-Team state
    const [newSubTeamName, setNewSubTeamName] = useState('');
    const [newSubTeamDesc, setNewSubTeamDesc] = useState('');
    const [addingSubTeam, setAddingSubTeam] = useState(false);

    // Role modal state
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
    const [roleName, setRoleName] = useState('');
    const [roleColor, setRoleColor] = useState('blue');
    const [roleIsSuperAdmin, setRoleIsSuperAdmin] = useState(false);
    const [roleIsManager, setRoleIsManager] = useState(false);
    const [roleIsDefault, setRoleIsDefault] = useState(false);
    const [savingRole, setSavingRole] = useState(false);

    useEffect(() => {
        setOrgForm(orgSettings);
    }, [orgSettings]);

    if (!isSuperAdmin) {
        return (
            <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
                <Card>
                    <Text color={textColor} fontSize="xl" fontWeight="700">
                        {t('Yetkisiz Erişim', 'Unauthorized Access')}
                    </Text>
                    <Text mt="2">{t('Bu sayfayı görüntüleme yetkiniz yok.', 'You do not have permission to view this page.')}</Text>
                </Card>
            </Box>
        );
    }

    const handleSaveOrganization = async () => {
        if (!orgForm.organizationName.trim()) {
            toast({ title: t('Kurum adı zorunludur', 'Company name is required'), status: 'warning', duration: 2500 });
            return;
        }
        setSavingOrg(true);
        try {
            await updateOrganizationSettings(
                {
                    organizationName: orgForm.organizationName.trim(),
                    organizationSubtitle: orgForm.organizationSubtitle.trim(),
                    logoUrl: orgForm.logoUrl.trim(),
                    workspaceLabel: orgForm.workspaceLabel.trim() || 'Çalışma Alanı',
                    footerText: orgForm.footerText.trim() || orgForm.organizationName.trim(),
                    supportEmail: orgForm.supportEmail.trim(),
                },
                companyId
            );
            await refreshOrganization();
            toast({ title: t('Kurum ayarları kaydedildi', 'Company settings saved'), status: 'success', duration: 2500 });
        } catch (err) {
            console.error('Error saving organization settings:', err);
            toast({ title: t('Kayıt sırasında hata oluştu', 'Error saving settings'), status: 'error', duration: 3000 });
        } finally {
            setSavingOrg(false);
        }
    };

    const handleAddSubTeam = async () => {
        if (!newSubTeamName.trim() || !companyId) return;
        setAddingSubTeam(true);
        try {
            await createSubTeam({
                companyId,
                name: newSubTeamName.trim(),
                description: newSubTeamDesc.trim(),
            });
            setNewSubTeamName('');
            setNewSubTeamDesc('');
            await refreshSubTeams();
            toast({ title: t('Alt takım / çalışma alanı eklendi', 'Sub-team / workspace added'), status: 'success', duration: 2000 });
        } catch (err) {
            console.error(err);
            toast({ title: t('Alt takım eklenemedi', 'Failed to add sub-team'), status: 'error', duration: 3000 });
        } finally {
            setAddingSubTeam(false);
        }
    };

    const handleDeleteSubTeam = async (id: string, name: string) => {
        if (!window.confirm(t(`"${name}" alt takımını / çalışma alanını silmek istediğinize emin misiniz?`, `Are you sure you want to delete "${name}"?`))) return;
        try {
            await deleteSubTeam(id);
            if (activeSubTeamId === id) {
                setActiveSubTeamId('all');
            }
            await refreshSubTeams();
            toast({ title: t('Alt takım silindi', 'Sub-team deleted'), status: 'info', duration: 2000 });
        } catch (err) {
            console.error(err);
            toast({ title: t('Silme hatası', 'Delete error'), status: 'error', duration: 3000 });
        }
    };

    const openAddRoleModal = () => {
        setEditingRole(null);
        setRoleName('');
        setRoleColor('blue');
        setRoleIsSuperAdmin(false);
        setRoleIsManager(false);
        setRoleIsDefault(false);
        onOpen();
    };

    const openEditRoleModal = (role: RoleDefinition) => {
        setEditingRole(role);
        setRoleName(role.name);
        setRoleColor(role.color || 'blue');
        setRoleIsSuperAdmin(role.isSuperAdmin);
        setRoleIsManager(role.isManager || role.isSuperAdmin);
        setRoleIsDefault(!!role.isDefault);
        onOpen();
    };

    const handleSaveRole = async () => {
        if (!roleName.trim()) {
            toast({ title: t('Rol adı zorunludur', 'Role name is required'), status: 'warning', duration: 2000 });
            return;
        }
        setSavingRole(true);
        try {
            const payload: RoleFormData = {
                companyId: companyId || 'default-company',
                name: roleName.trim(),
                color: roleColor,
                isSuperAdmin: roleIsSuperAdmin,
                isManager: roleIsSuperAdmin ? true : roleIsManager,
                isDefault: roleIsDefault,
            };

            if (editingRole && !editingRole.id.startsWith('default-')) {
                await updateRole(editingRole.id, payload);
                toast({ title: t('Rol güncellendi', 'Role updated'), status: 'success', duration: 2000 });
            } else if (editingRole && editingRole.id.startsWith('default-')) {
                for (const r of roles) {
                    if (r.id === editingRole.id) {
                        await createRole(payload);
                    } else if (r.id.startsWith('default-')) {
                        await createRole({
                            companyId: companyId || 'default-company',
                            name: r.name,
                            color: r.color || 'blue',
                            isSuperAdmin: r.isSuperAdmin,
                            isManager: r.isManager,
                            isDefault: !!r.isDefault,
                        });
                    }
                }
                toast({ title: t('Rol güncellendi', 'Role updated'), status: 'success', duration: 2000 });
            } else {
                const hasOnlyDefaults = roles.every((r) => r.id.startsWith('default-'));
                if (hasOnlyDefaults) {
                    for (const r of roles) {
                        await createRole({
                            companyId: companyId || 'default-company',
                            name: r.name,
                            color: r.color || 'blue',
                            isSuperAdmin: r.isSuperAdmin,
                            isManager: r.isManager,
                            isDefault: payload.isDefault ? false : !!r.isDefault,
                        });
                    }
                }
                await createRole(payload);
                toast({ title: t('Yeni rol eklendi', 'New role added'), status: 'success', duration: 2000 });
            }

            await refreshRoles();
            onClose();
        } catch (err) {
            console.error('Error saving role:', err);
            toast({ title: t('Rol kaydedilemedi', 'Failed to save role'), status: 'error', duration: 3000 });
        } finally {
            setSavingRole(false);
        }
    };

    const handleDeleteRole = async (role: RoleDefinition) => {
        if (role.id.startsWith('default-')) {
            toast({
                title: t('Varsayılan rol', 'Default role'),
                description: t('Önce yeni bir özel rol ekleyerek veya düzenleyerek veritabanı rollerini etkinleştirin.', 'Add or edit a custom role first to persist custom roles.'),
                status: 'info',
                duration: 3000,
            });
            return;
        }
        if (!window.confirm(t(`"${role.name}" rolünü silmek istediğinize emin misiniz?`, `Are you sure you want to delete "${role.name}"?`))) return;
        try {
            await deleteRole(role.id);
            await refreshRoles();
            toast({ title: t('Rol silindi', 'Role deleted'), status: 'info', duration: 2000 });
        } catch (err) {
            console.error('Error deleting role:', err);
            toast({ title: t('Silme hatası', 'Delete error'), status: 'error', duration: 3000 });
        }
    };

    return (
        <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
            {/* Alt Takımlar / Çalışma Alanları Yönetimi */}
            <Card p="24px" mb="20px">
                <Flex align="center" gap="10px" mb="16px">
                    <Icon as={MdGroups as any} w="28px" h="28px" color="brand.500" />
                    <Box>
                        <Text color={textColor} fontSize="xl" fontWeight="700">
                            {t('Alt Takımlar ve Çalışma Alanları', 'Sub-Teams & Workspaces')}
                        </Text>
                        <Text fontSize="xs" color="gray.400">
                            {t(
                                'Şirketiniz altında birden fazla alt takım veya çalışma alanı (şube, ofis, atölye, birim) açıp süreçleri ayırabilir veya tek şirket olarak kullanabilirsiniz.',
                                'Create multiple sub-teams or workspaces (branches, offices, labs, units) under your company to isolate operations, or operate as a single unified company.'
                            )}
                        </Text>
                    </Box>
                </Flex>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing="12px" mb="20px">
                    <FormControl>
                        <FormLabel fontSize="xs" fontWeight="600">
                            {t('Yeni Alt Takım / Çalışma Alanı Adı', 'New Sub-Team / Workspace Name')}
                        </FormLabel>
                        <Input
                            value={newSubTeamName}
                            onChange={(e) => setNewSubTeamName(e.target.value)}
                            placeholder={t('Örn: Ar-Ge Takımı, Merkez Ofis, Üretim Alanı...', 'e.g. R&D Team, Main Office, Production Area...')}
                            borderRadius="12px"
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel fontSize="xs" fontWeight="600">
                            {t('Açıklama (İsteğe Bağlı)', 'Description (Optional)')}
                        </FormLabel>
                        <Input
                            value={newSubTeamDesc}
                            onChange={(e) => setNewSubTeamDesc(e.target.value)}
                            placeholder={t('Kısa açıklama...', 'Short description...')}
                            borderRadius="12px"
                        />
                    </FormControl>
                    <Flex align="flex-end">
                        <Button
                            leftIcon={<Icon as={MdAdd as any} />}
                            colorScheme="brand"
                            borderRadius="12px"
                            w="100%"
                            onClick={handleAddSubTeam}
                            isLoading={addingSubTeam}
                            isDisabled={!newSubTeamName.trim()}
                        >
                            {t('Alt Takım / Alan Ekle', 'Add Sub-Team / Area')}
                        </Button>
                    </Flex>
                </SimpleGrid>

                {subTeams.length === 0 ? (
                    <Box p="16px" borderRadius="12px" border="1px dashed" borderColor={borderColor}>
                        <Text fontSize="sm" color="gray.400" textAlign="center">
                            {t(
                                'Henüz alt takım tanımlanmadı. Şirketiniz şu an Tekil / Genel Şirket yapısında çalışıyor. İsterseniz yukarıdan alt takımlar ekleyebilirsiniz.',
                                'No sub-teams defined yet. Your company is currently operating in Single / General Company mode. You can add sub-teams above.'
                            )}
                        </Text>
                    </Box>
                ) : (
                    <Table variant="simple" size="sm">
                        <Thead>
                            <Tr>
                                <Th borderColor={borderColor}>{t('Alt Takım / Alan Adı', 'Sub-Team / Area Name')}</Th>
                                <Th borderColor={borderColor}>{t('Açıklama', 'Description')}</Th>
                                <Th borderColor={borderColor}>{t('QR Kodu Anahtarı', 'QR Code Secret')}</Th>
                                <Th borderColor={borderColor} textAlign="right">{t('İşlem', 'Actions')}</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {subTeams.map((team) => (
                                <Tr key={team.id}>
                                    <Td borderColor={borderColor} fontWeight="700" color={textColor}>
                                        {team.name}
                                        {activeSubTeamId === team.id && (
                                            <Badge ml="8px" colorScheme="green">{t('Seçili', 'Active')}</Badge>
                                        )}
                                    </Td>
                                    <Td borderColor={borderColor}>{team.description || '-'}</Td>
                                    <Td borderColor={borderColor}>
                                        <Badge fontFamily="monospace">{team.qrSecret}</Badge>
                                    </Td>
                                    <Td borderColor={borderColor} textAlign="right">
                                        <Flex justify="flex-end" gap="8px">
                                            <Button
                                                size="xs"
                                                variant="outline"
                                                colorScheme="brand"
                                                onClick={() => setActiveSubTeamId(team.id)}
                                            >
                                                {t('Bu Alana Geç', 'Switch to Area')}
                                            </Button>
                                            <IconButton
                                                aria-label="Delete"
                                                icon={<Icon as={MdDelete as any} />}
                                                size="xs"
                                                colorScheme="red"
                                                variant="ghost"
                                                onClick={() => handleDeleteSubTeam(team.id, team.name)}
                                            />
                                        </Flex>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                )}
            </Card>

            <SimpleGrid columns={{ base: 1, xl: 2 }} spacing="20px">
                {/* Kurum Kimliği (White-Label) Ayarları */}
                <Card p="24px">
                    <Flex align="center" gap="10px" mb="20px">
                        <Icon as={MdBusiness as any} w="26px" h="26px" color="brand.500" />
                        <Box>
                            <Text color={textColor} fontSize="xl" fontWeight="700">
                                {t('Şirket ve Platform Kimliği', 'Company & Platform Identity')}
                            </Text>
                            <Text fontSize="xs" color="gray.400">
                                {t('Şirket adı, logo, çalışma alanı adı ve altbilgi yapılandırması', 'Company name, logo, workspace label, and footer configuration')}
                            </Text>
                        </Box>
                    </Flex>

                    <VStack spacing="16px" align="stretch">
                        <FormControl isRequired>
                            <FormLabel fontWeight="600" fontSize="sm">
                                {t('Şirket / Kurum Adı', 'Company / Organization Name')}
                            </FormLabel>
                            <Input
                                value={orgForm.organizationName}
                                onChange={(e) =>
                                    setOrgForm((prev) => ({ ...prev, organizationName: e.target.value }))
                                }
                                placeholder={t('Örn: Acme Teknoloji A.Ş.', 'e.g., Acme Technologies Inc.')}
                                borderRadius="12px"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontWeight="600" fontSize="sm">
                                {t('Sistem Alt Başlığı', 'System Subtitle')}
                            </FormLabel>
                            <Input
                                value={orgForm.organizationSubtitle}
                                onChange={(e) =>
                                    setOrgForm((prev) => ({ ...prev, organizationSubtitle: e.target.value }))
                                }
                                placeholder={t('Örn: Yönetim Bilişim Sistemi', 'e.g., Management Information System')}
                                borderRadius="12px"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontWeight="600" fontSize="sm">
                                {t('Kurum Logo URL (İsteğe Bağlı)', 'Organization Logo URL (Optional)')}
                            </FormLabel>
                            <Input
                                value={orgForm.logoUrl}
                                onChange={(e) =>
                                    setOrgForm((prev) => ({ ...prev, logoUrl: e.target.value }))
                                }
                                placeholder="https://.../logo.png veya .svg"
                                borderRadius="12px"
                            />
                            {orgForm.logoUrl && (
                                <Flex mt="10px" p="10px" border="1px dashed" borderColor={borderColor} borderRadius="10px" justify="center">
                                    <Image
                                        src={orgForm.logoUrl}
                                        alt="Logo Preview"
                                        maxH="48px"
                                        objectFit="contain"
                                    />
                                </Flex>
                            )}
                        </FormControl>

                        <FormControl>
                            <FormLabel fontWeight="600" fontSize="sm">
                                {t('Giriş/Çıkış Alanı Etiketi', 'Check-in / Workspace Label')}
                            </FormLabel>
                            <Input
                                value={orgForm.workspaceLabel}
                                onChange={(e) =>
                                    setOrgForm((prev) => ({ ...prev, workspaceLabel: e.target.value }))
                                }
                                placeholder={t('Örn: Çalışma Alanı, Ofis, Şube, Kampüs', 'e.g., Workspace, Office, Branch, Campus')}
                                borderRadius="12px"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontWeight="600" fontSize="sm">
                                {t('Altbilgi (Footer) Kurum Metni', 'Footer Organization Text')}
                            </FormLabel>
                            <Input
                                value={orgForm.footerText}
                                onChange={(e) =>
                                    setOrgForm((prev) => ({ ...prev, footerText: e.target.value }))
                                }
                                placeholder={t('Örn: Acme Teknoloji A.Ş. • Tüm Hakları Saklıdır', 'e.g., Acme Technologies Inc. • All Rights Reserved')}
                                borderRadius="12px"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontWeight="600" fontSize="sm">
                                {t('Destek E-posta Adresi (İsteğe Bağlı)', 'Support Email Address (Optional)')}
                            </FormLabel>
                            <Input
                                value={orgForm.supportEmail}
                                onChange={(e) =>
                                    setOrgForm((prev) => ({ ...prev, supportEmail: e.target.value }))
                                }
                                placeholder="support@company.com"
                                borderRadius="12px"
                            />
                        </FormControl>

                        <Button
                            leftIcon={<Icon as={MdSave as any} />}
                            colorScheme="brand"
                            borderRadius="14px"
                            onClick={handleSaveOrganization}
                            isLoading={savingOrg}
                            mt="8px"
                        >
                            {t('Şirket Ayarlarını Kaydet', 'Save Company Settings')}
                        </Button>
                    </VStack>
                </Card>

                {/* Dinamik Rol ve Yetki Yönetimi */}
                <Card p="24px">
                    <Flex justify="space-between" align="center" mb="20px" flexWrap="wrap" gap="10px">
                        <Flex align="center" gap="10px">
                            <Icon as={MdSecurity as any} w="26px" h="26px" color="brand.500" />
                            <Box>
                                <Text color={textColor} fontSize="xl" fontWeight="700">
                                    {t('Dinamik Rol ve Yetkiler', 'Dynamic Roles & Permissions')}
                                </Text>
                                <Text fontSize="xs" color="gray.400">
                                    {t('Şirketinize özel ünvan, rol ve yetki seviyeleri tanımlayın', 'Define custom titles, roles, and permission levels for your company')}
                                </Text>
                            </Box>
                        </Flex>
                        <Button
                            leftIcon={<Icon as={MdAdd as any} />}
                            colorScheme="brand"
                            size="sm"
                            borderRadius="12px"
                            onClick={openAddRoleModal}
                        >
                            {t('Yeni Rol Ekle', 'Add New Role')}
                        </Button>
                    </Flex>

                    <Box overflowX="auto">
                        <Table variant="simple" size="sm">
                            <Thead>
                                <Tr>
                                    <Th borderColor={borderColor}>{t('Rol Adı', 'Role Name')}</Th>
                                    <Th borderColor={borderColor}>{t('Yetki Seviyesi', 'Access Level')}</Th>
                                    <Th borderColor={borderColor} textAlign="right">
                                        {t('İşlem', 'Actions')}
                                    </Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {roles.map((r) => (
                                    <Tr key={r.id}>
                                        <Td borderColor={borderColor}>
                                            <Flex align="center" gap="8px">
                                                <Badge colorScheme={r.color || 'blue'} borderRadius="8px" px="8px" py="2px">
                                                    {r.name}
                                                </Badge>
                                                {r.isDefault && (
                                                    <Badge colorScheme="green" variant="outline" fontSize="10px">
                                                        {t('Varsayılan', 'Default')}
                                                    </Badge>
                                                )}
                                            </Flex>
                                        </Td>
                                        <Td borderColor={borderColor}>
                                            {r.isSuperAdmin ? (
                                                <Badge colorScheme="purple">{t('Süper Yönetici (Tam Yetki)', 'Super Admin (Full Access)')}</Badge>
                                            ) : r.isManager ? (
                                                <Badge colorScheme="blue">{t('Yönetici / Birim Yetkilisi', 'Manager / Team Lead')}</Badge>
                                            ) : (
                                                <Badge colorScheme="gray">{t('Standart Kullanıcı', 'Standard Member')}</Badge>
                                            )}
                                        </Td>
                                        <Td borderColor={borderColor} textAlign="right">
                                            <Flex justify="flex-end" gap="4px">
                                                <Tooltip label={t('Düzenle', 'Edit')}>
                                                    <IconButton
                                                        aria-label="Edit Role"
                                                        icon={<Icon as={MdEdit as any} />}
                                                        size="xs"
                                                        variant="ghost"
                                                        onClick={() => openEditRoleModal(r)}
                                                    />
                                                </Tooltip>
                                                <Tooltip label={t('Sil', 'Delete')}>
                                                    <IconButton
                                                        aria-label="Delete Role"
                                                        icon={<Icon as={MdDelete as any} />}
                                                        size="xs"
                                                        colorScheme="red"
                                                        variant="ghost"
                                                        onClick={() => handleDeleteRole(r)}
                                                    />
                                                </Tooltip>
                                            </Flex>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </Box>
                </Card>
            </SimpleGrid>

            {/* Rol Ekle / Düzenle Modalı */}
            <Modal isOpen={isOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent bg={modalBg} borderRadius="20px">
                    <ModalHeader>
                        {editingRole ? t('Rolü Düzenle', 'Edit Role') : t('Yeni Rol Tanımla', 'Define New Role')}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing="16px" align="stretch">
                            <FormControl isRequired>
                                <FormLabel fontWeight="600" fontSize="sm">
                                    {t('Rol / Ünvan Adı', 'Role / Title Name')}
                                </FormLabel>
                                <Input
                                    value={roleName}
                                    onChange={(e) => setRoleName(e.target.value)}
                                    placeholder={t('Örn: Proje Yöneticisi, İK Uzmanı, Teknisyen...', 'e.g., Project Manager, HR Specialist, Technician...')}
                                    borderRadius="12px"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel fontWeight="600" fontSize="sm">
                                    {t('Rozet Rengi', 'Badge Color')}
                                </FormLabel>
                                <Select
                                    value={roleColor}
                                    onChange={(e) => setRoleColor(e.target.value)}
                                    borderRadius="12px"
                                >
                                    {ROLE_COLORS.map((c) => (
                                        <option key={c.value} value={c.value}>
                                            {c.label}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            <Divider />

                            <FormControl display="flex" alignItems="center" justifyContent="space-between">
                                <Box pr="12px">
                                    <FormLabel mb="0" fontWeight="600" fontSize="sm">
                                        {t('Süper Yönetici Yetkisi', 'Super Admin Access')}
                                    </FormLabel>
                                    <Text fontSize="xs" color="gray.400">
                                        {t('Kullanıcı davetleri, departmanlar, alt takımlar ve şirket ayarlarına tam erişim', 'Full access to user invitations, departments, sub-teams, and company settings')}
                                    </Text>
                                </Box>
                                <Switch
                                    colorScheme="purple"
                                    isChecked={roleIsSuperAdmin}
                                    onChange={(e) => {
                                        setRoleIsSuperAdmin(e.target.checked);
                                        if (e.target.checked) setRoleIsManager(true);
                                    }}
                                />
                            </FormControl>

                            <FormControl display="flex" alignItems="center" justifyContent="space-between">
                                <Box pr="12px">
                                    <FormLabel mb="0" fontWeight="600" fontSize="sm">
                                        {t('Yönetim Yetkisi (Birim / Operasyon)', 'Management Access (Team / Operations)')}
                                    </FormLabel>
                                    <Text fontSize="xs" color="gray.400">
                                        {t('Görev atama, envanter/kategori yönetimi, duyuru, bağlantı ve mesai ayarları', 'Task assignment, inventory/category management, announcements, links, and attendance settings')}
                                    </Text>
                                </Box>
                                <Switch
                                    colorScheme="brand"
                                    isChecked={roleIsSuperAdmin || roleIsManager}
                                    isDisabled={roleIsSuperAdmin}
                                    onChange={(e) => setRoleIsManager(e.target.checked)}
                                />
                            </FormControl>

                            <FormControl display="flex" alignItems="center" justifyContent="space-between">
                                <Box pr="12px">
                                    <FormLabel mb="0" fontWeight="600" fontSize="sm">
                                        {t('Varsayılan Yeni Üye Rolü', 'Default New Member Role')}
                                    </FormLabel>
                                    <Text fontSize="xs" color="gray.400">
                                        {t('Davet ve onay ekranında yeni çalışanlar için varsayılan olarak seçilir', 'Selected by default for new employees in the invitation & approval screen')}
                                    </Text>
                                </Box>
                                <Switch
                                    colorScheme="green"
                                    isChecked={roleIsDefault}
                                    onChange={(e) => setRoleIsDefault(e.target.checked)}
                                />
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter gap="8px">
                        <Button variant="ghost" onClick={onClose} borderRadius="12px">
                            {t('İptal', 'Cancel')}
                        </Button>
                        <Button
                            colorScheme="brand"
                            onClick={handleSaveRole}
                            isLoading={savingRole}
                            borderRadius="12px"
                        >
                            {t('Kaydet', 'Save')}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}

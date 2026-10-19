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
    { value: 'purple', label: 'Mor' },
    { value: 'blue', label: 'Mavi' },
    { value: 'teal', label: 'Turkuaz' },
    { value: 'green', label: 'Yeşil' },
    { value: 'orange', label: 'Turuncu' },
    { value: 'red', label: 'Kırmızı' },
    { value: 'gray', label: 'Gri' },
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
                        Yetkisiz Erişim
                    </Text>
                    <Text mt="2">Bu sayfayı görüntüleme yetkiniz yok.</Text>
                </Card>
            </Box>
        );
    }

    const handleSaveOrganization = async () => {
        if (!orgForm.organizationName.trim()) {
            toast({ title: 'Kurum adı zorunludur', status: 'warning', duration: 2500 });
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
            toast({ title: 'Kurum ayarları kaydedildi', status: 'success', duration: 2500 });
        } catch (err) {
            console.error('Error saving organization settings:', err);
            toast({ title: 'Kayıt sırasında hata oluştu', status: 'error', duration: 3000 });
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
            toast({ title: 'Alt takım / çalışma alanı eklendi', status: 'success', duration: 2000 });
        } catch (err) {
            console.error(err);
            toast({ title: 'Alt takım eklenemedi', status: 'error', duration: 3000 });
        } finally {
            setAddingSubTeam(false);
        }
    };

    const handleDeleteSubTeam = async (id: string, name: string) => {
        if (!window.confirm(`"${name}" alt takımını / çalışma alanını silmek istediğinize emin misiniz?`)) return;
        try {
            await deleteSubTeam(id);
            if (activeSubTeamId === id) {
                setActiveSubTeamId('all');
            }
            await refreshSubTeams();
            toast({ title: 'Alt takım silindi', status: 'info', duration: 2000 });
        } catch (err) {
            console.error(err);
            toast({ title: 'Silme hatası', status: 'error', duration: 3000 });
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
            toast({ title: 'Rol adı zorunludur', status: 'warning', duration: 2000 });
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
                toast({ title: 'Rol güncellendi', status: 'success', duration: 2000 });
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
                toast({ title: 'Rol güncellendi', status: 'success', duration: 2000 });
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
                toast({ title: 'Yeni rol eklendi', status: 'success', duration: 2000 });
            }

            await refreshRoles();
            onClose();
        } catch (err) {
            console.error('Error saving role:', err);
            toast({ title: 'Rol kaydedilemedi', status: 'error', duration: 3000 });
        } finally {
            setSavingRole(false);
        }
    };

    const handleDeleteRole = async (role: RoleDefinition) => {
        if (role.id.startsWith('default-')) {
            toast({
                title: 'Varsayılan rol',
                description: 'Önce yeni bir özel rol ekleyerek veya düzenleyerek veritabanı rollerini etkinleştirin.',
                status: 'info',
                duration: 3000,
            });
            return;
        }
        if (!window.confirm(`"${role.name}" rolünü silmek istediğinize emin misiniz?`)) return;
        try {
            await deleteRole(role.id);
            await refreshRoles();
            toast({ title: 'Rol silindi', status: 'info', duration: 2000 });
        } catch (err) {
            console.error('Error deleting role:', err);
            toast({ title: 'Silme hatası', status: 'error', duration: 3000 });
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
                            Alt Takımlar ve Çalışma Alanları
                        </Text>
                        <Text fontSize="xs" color="gray.400">
                            Şirketiniz altında birden fazla alt takım veya çalışma alanı (şube, ofis, atölye, birim) açıp süreçleri ayırabilir veya tek şirket olarak kullanabilirsiniz.
                        </Text>
                    </Box>
                </Flex>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing="12px" mb="20px">
                    <FormControl>
                        <FormLabel fontSize="xs" fontWeight="600">
                            Yeni Alt Takım / Çalışma Alanı Adı
                        </FormLabel>
                        <Input
                            value={newSubTeamName}
                            onChange={(e) => setNewSubTeamName(e.target.value)}
                            placeholder="Örn: Ar-Ge Takımı, Merkez Ofis, Üretim Alanı..."
                            borderRadius="12px"
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel fontSize="xs" fontWeight="600">
                            Açıklama (İsteğe Bağlı)
                        </FormLabel>
                        <Input
                            value={newSubTeamDesc}
                            onChange={(e) => setNewSubTeamDesc(e.target.value)}
                            placeholder="Kısa açıklama..."
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
                            Alt Takım / Alan Ekle
                        </Button>
                    </Flex>
                </SimpleGrid>

                {subTeams.length === 0 ? (
                    <Box p="16px" borderRadius="12px" border="1px dashed" borderColor={borderColor}>
                        <Text fontSize="sm" color="gray.400" textAlign="center">
                            Henüz alt takım tanımlanmadı. Şirketiniz şu an <b>Tekil / Genel Şirket</b> yapısında çalışıyor. İsterseniz yukarıdan alt takımlar ekleyebilirsiniz.
                        </Text>
                    </Box>
                ) : (
                    <Table variant="simple" size="sm">
                        <Thead>
                            <Tr>
                                <Th borderColor={borderColor}>Alt Takım / Alan Adı</Th>
                                <Th borderColor={borderColor}>Açıklama</Th>
                                <Th borderColor={borderColor}>QR Kodu Anahtarı</Th>
                                <Th borderColor={borderColor} textAlign="right">İşlem</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {subTeams.map((team) => (
                                <Tr key={team.id}>
                                    <Td borderColor={borderColor} fontWeight="700" color={textColor}>
                                        {team.name}
                                        {activeSubTeamId === team.id && (
                                            <Badge ml="8px" colorScheme="green">Seçili</Badge>
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
                                                Bu Alana Geç
                                            </Button>
                                            <IconButton
                                                aria-label="Sil"
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
                                Şirket ve Platform Kimliği
                            </Text>
                            <Text fontSize="xs" color="gray.400">
                                Şirket adı, logo, çalışma alanı adı ve altbilgi yapılandırması
                            </Text>
                        </Box>
                    </Flex>

                    <VStack spacing="16px" align="stretch">
                        <FormControl isRequired>
                            <FormLabel fontWeight="600" fontSize="sm">
                                Şirket / Kurum Adı
                            </FormLabel>
                            <Input
                                value={orgForm.organizationName}
                                onChange={(e) =>
                                    setOrgForm((prev) => ({ ...prev, organizationName: e.target.value }))
                                }
                                placeholder="Örn: Acme Teknoloji A.Ş."
                                borderRadius="12px"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontWeight="600" fontSize="sm">
                                Sistem Alt Başlığı
                            </FormLabel>
                            <Input
                                value={orgForm.organizationSubtitle}
                                onChange={(e) =>
                                    setOrgForm((prev) => ({ ...prev, organizationSubtitle: e.target.value }))
                                }
                                placeholder="Örn: Yönetim Bilişim Sistemi"
                                borderRadius="12px"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontWeight="600" fontSize="sm">
                                Kurum Logo URL (İsteğe Bağlı)
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
                                        alt="Logo Önizleme"
                                        maxH="48px"
                                        objectFit="contain"
                                    />
                                </Flex>
                            )}
                        </FormControl>

                        <FormControl>
                            <FormLabel fontWeight="600" fontSize="sm">
                                Giriş/Çıkış Alanı Etiketi
                            </FormLabel>
                            <Input
                                value={orgForm.workspaceLabel}
                                onChange={(e) =>
                                    setOrgForm((prev) => ({ ...prev, workspaceLabel: e.target.value }))
                                }
                                placeholder="Örn: Çalışma Alanı, Ofis, Şube, Kampüs"
                                borderRadius="12px"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontWeight="600" fontSize="sm">
                                Altbilgi (Footer) Kurum Metni
                            </FormLabel>
                            <Input
                                value={orgForm.footerText}
                                onChange={(e) =>
                                    setOrgForm((prev) => ({ ...prev, footerText: e.target.value }))
                                }
                                placeholder="Örn: Acme Teknoloji A.Ş. • Tüm Hakları Saklıdır"
                                borderRadius="12px"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontWeight="600" fontSize="sm">
                                Destek E-posta Adresi (İsteğe Bağlı)
                            </FormLabel>
                            <Input
                                value={orgForm.supportEmail}
                                onChange={(e) =>
                                    setOrgForm((prev) => ({ ...prev, supportEmail: e.target.value }))
                                }
                                placeholder="destek@sirketiniz.com"
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
                            Şirket Ayarlarını Kaydet
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
                                    Dinamik Rol ve Yetkiler
                                </Text>
                                <Text fontSize="xs" color="gray.400">
                                    Şirketinize özel ünvan, rol ve yetki seviyeleri tanımlayın
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
                            Yeni Rol Ekle
                        </Button>
                    </Flex>

                    <Box overflowX="auto">
                        <Table variant="simple" size="sm">
                            <Thead>
                                <Tr>
                                    <Th borderColor={borderColor}>Rol Adı</Th>
                                    <Th borderColor={borderColor}>Yetki Seviyesi</Th>
                                    <Th borderColor={borderColor} textAlign="right">
                                        İşlem
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
                                                        Varsayılan
                                                    </Badge>
                                                )}
                                            </Flex>
                                        </Td>
                                        <Td borderColor={borderColor}>
                                            {r.isSuperAdmin ? (
                                                <Badge colorScheme="purple">Süper Yönetici (Tam Yetki)</Badge>
                                            ) : r.isManager ? (
                                                <Badge colorScheme="blue">Yönetici / Birim Yetkilisi</Badge>
                                            ) : (
                                                <Badge colorScheme="gray">Standart Kullanıcı</Badge>
                                            )}
                                        </Td>
                                        <Td borderColor={borderColor} textAlign="right">
                                            <Flex justify="flex-end" gap="4px">
                                                <Tooltip label="Düzenle">
                                                    <IconButton
                                                        aria-label="Edit Role"
                                                        icon={<Icon as={MdEdit as any} />}
                                                        size="xs"
                                                        variant="ghost"
                                                        onClick={() => openEditRoleModal(r)}
                                                    />
                                                </Tooltip>
                                                <Tooltip label="Sil">
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
                        {editingRole ? 'Rolü Düzenle' : 'Yeni Rol Tanımla'}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing="16px" align="stretch">
                            <FormControl isRequired>
                                <FormLabel fontWeight="600" fontSize="sm">
                                    Rol / Ünvan Adı
                                </FormLabel>
                                <Input
                                    value={roleName}
                                    onChange={(e) => setRoleName(e.target.value)}
                                    placeholder="Örn: Proje Yöneticisi, İK Uzmanı, Teknisyen..."
                                    borderRadius="12px"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel fontWeight="600" fontSize="sm">
                                    Rozet Rengi
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
                                        Süper Yönetici Yetkisi
                                    </FormLabel>
                                    <Text fontSize="xs" color="gray.400">
                                        Kullanıcı davetleri, departmanlar, alt takımlar ve şirket ayarlarına tam erişim
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
                                        Yönetim Yetkisi (Birim / Operasyon)
                                    </FormLabel>
                                    <Text fontSize="xs" color="gray.400">
                                        Görev atama, envanter/kategori yönetimi, duyuru, bağlantı ve mesai ayarları
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
                                        Varsayılan Yeni Üye Rolü
                                    </FormLabel>
                                    <Text fontSize="xs" color="gray.400">
                                        Davet ve onay ekranında yeni çalışanlar için varsayılan olarak seçilir
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
                            İptal
                        </Button>
                        <Button
                            colorScheme="brand"
                            onClick={handleSaveRole}
                            isLoading={savingRole}
                            borderRadius="12px"
                        >
                            Kaydet
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}

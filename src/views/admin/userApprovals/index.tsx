/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Button,
    Flex,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Text,
    useColorModeValue,
    useToast,
    Avatar,
    Badge,
    Icon,
    Spinner,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    IconButton,
    Tooltip,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Select,
    FormControl,
    FormLabel,
    Input,
    SimpleGrid,
    VStack,
} from '@chakra-ui/react';
import Card from 'components/card/Card';
import {
    MdCheck,
    MdClose,
    MdDelete,
    MdEdit,
    MdPersonAdd,
    MdEmail,
    MdContentCopy,
    MdVpnKey,
    MdLink,
} from 'react-icons/md';
import {
    collection,
    getDocs,
    setDoc,
    deleteDoc,
    doc,
    updateDoc,
    serverTimestamp,
    query,
    where,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from 'contexts/AuthContext';
import { useOrganization } from 'contexts/OrganizationContext';
import { useLanguage } from 'contexts/LanguageContext';
import { resolveRolePermissions } from 'services/roleService';
import { DEMO_DEPARTMENTS, DEMO_USERS, isDemoModeActive } from 'services/demoData';
import {
    Invitation,
    createInvitation,
    getCompanyInvitations,
    deleteInvitation,
    buildInviteUrl,
    buildInviteMailtoUrl,
} from 'services/inviteService';

interface UserRequest {
    uid: string;
    name: string;
    surname: string;
    department: string;
    email: string;
    photoURL: string;
    companyId?: string;
    requestedAt: any;
}

interface ApprovedUser {
    uid: string;
    name: string;
    surname: string;
    department: string;
    email: string;
    photoURL: string;
    approvedAt: any;
    role: string;
    companyId?: string;
    subTeamId?: string;
    subTeamName?: string;
    isSuperAdmin?: boolean;
    isManager?: boolean;
}

export default function UserApprovals() {
    const textColor = useColorModeValue('secondaryGray.900', 'white');
    const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
    const toast = useToast();

    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
    const {
        isOpen: isInviteOpen,
        onOpen: onInviteOpen,
        onClose: onInviteClose,
    } = useDisclosure();

    const { isSuperAdmin, isManager, companyId, user, userName, userSurname } = useAuth();
    const { orgSettings, roles, subTeams } = useOrganization();
    const { t } = useLanguage();

    const defaultRoleName =
        roles.find((r) => r.isDefault)?.name || roles[0]?.name || 'Personel';

    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [pendingUsers, setPendingUsers] = useState<UserRequest[]>([]);
    const [approvedUsers, setApprovedUsers] = useState<ApprovedUser[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Davet oluşturma state
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviteSurname, setInviteSurname] = useState('');
    const [inviteDepartment, setInviteDepartment] = useState('Genel');
    const [inviteRole, setInviteRole] = useState(defaultRoleName);
    const [inviteSubTeamId, setInviteSubTeamId] = useState('');
    const [createdInvite, setCreatedInvite] = useState<Invitation | null>(null);

    // Düzenleme / Onay state
    const [selectedUser, setSelectedUser] = useState<UserRequest | null>(null);
    const [editingUser, setEditingUser] = useState<ApprovedUser | null>(null);
    const [selectedRole, setSelectedRole] = useState(defaultRoleName);
    const [selectedSubTeamId, setSelectedSubTeamId] = useState('');
    const [selectedDept, setSelectedDept] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const targetCompanyId = companyId || 'default-company';

            // Davetler
            const invList = await getCompanyInvitations(targetCompanyId);
            setInvitations(invList);

            if (isDemoModeActive()) {
                setDepartments(DEMO_DEPARTMENTS.map((d) => d.name));
                setApprovedUsers(
                    DEMO_USERS.map((u) => ({
                        uid: u.uid,
                        name: u.name,
                        surname: u.surname,
                        department: u.department,
                        email: u.email,
                        photoURL: '',
                        approvedAt: null,
                        role: u.role,
                        companyId: u.companyId,
                        subTeamId: u.subTeamId,
                        subTeamName: u.subTeamName,
                        isSuperAdmin: u.isSuperAdmin,
                        isManager: u.isManager,
                    }))
                );
                setPendingUsers([]);
                setLoading(false);
                return;
            }

            // Departmanlar
            const deptSnap = await getDocs(collection(db, 'departments'));
            const deptNames: string[] = [];
            deptSnap.forEach((d) => {
                const data = d.data();
                if (!data.companyId || data.companyId === targetCompanyId) {
                    deptNames.push(data.name);
                }
            });
            setDepartments(deptNames.length > 0 ? deptNames : ['Yönetim', 'Genel']);

            // Onaylı Çalışanlar
            const approvedSnap = await getDocs(collection(db, 'approvedUsers'));
            const approvedData: ApprovedUser[] = [];
            approvedSnap.forEach((d) => {
                const data = d.data() as ApprovedUser;
                const docCompany = data.companyId || 'default-company';
                if (docCompany === targetCompanyId) {
                    approvedData.push({ ...data, uid: d.id });
                }
            });
            setApprovedUsers(approvedData);

            // Bekleyen İstekler
            const pendingSnap = await getDocs(collection(db, 'pendingUsers'));
            const pendingData: UserRequest[] = [];
            pendingSnap.forEach((d) => {
                const data = d.data() as UserRequest;
                const docCompany = data.companyId || 'default-company';
                if (docCompany === targetCompanyId) {
                    pendingData.push({ ...data, uid: d.id });
                }
            });
            setPendingUsers(pendingData);
        } catch (err) {
            console.error('Fetch error:', err);
            toast({
                title: t('Hata', 'Error'),
                description: t('Veriler yüklenirken hata oluştu', 'Error loading data'),
                status: 'error',
                duration: 3000,
            });
        }
        setLoading(false);
    }, [companyId, toast, t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenInviteModal = () => {
        setInviteEmail('');
        setInviteName('');
        setInviteSurname('');
        setInviteDepartment(departments[0] || 'Genel');
        setInviteRole(defaultRoleName);
        setInviteSubTeamId('');
        setCreatedInvite(null);
        onInviteOpen();
    };

    const handleCreateInvitation = async () => {
        if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
            toast({
                title: 'Geçerli bir e-posta adresi girin',
                status: 'warning',
                duration: 2500,
            });
            return;
        }
        setActionLoading(true);
        try {
            const perms = resolveRolePermissions(inviteRole, roles);
            const chosenSubTeam = subTeams.find((t) => t.id === inviteSubTeamId);
            const fullName = `${userName ?? ''} ${userSurname ?? ''}`.trim() || 'Yönetici';

            const inv = await createInvitation({
                companyId: companyId || 'default-company',
                companyName: orgSettings.organizationName,
                companyLogoUrl: orgSettings.logoUrl,
                subTeamId: chosenSubTeam?.id || '',
                subTeamName: chosenSubTeam?.name || '',
                email: inviteEmail.trim(),
                invitedName: inviteName.trim(),
                invitedSurname: inviteSurname.trim(),
                department: inviteDepartment.trim() || 'Genel',
                role: inviteRole,
                isSuperAdmin: perms.isSuperAdmin,
                isManager: perms.isManager,
                createdBy: fullName,
                createdByUid: user?.uid || '',
            });

            setCreatedInvite(inv);
            await fetchData();
            toast({
                title: 'Kişiye Özel Davet Anahtarı Oluşturuldu',
                status: 'success',
                duration: 2500,
            });
        } catch (err) {
            console.error('Create invite error:', err);
            toast({ title: 'Davet oluşturulamadı', status: 'error', duration: 3000 });
        } finally {
            setActionLoading(false);
        }
    };

    const copyText = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: `${label} kopyalandı`, status: 'info', duration: 2000 });
    };

    const handleDeleteInvite = async (key: string) => {
        if (!window.confirm(`${key} davet anahtarını iptal etmek istediğinize emin misiniz?`)) return;
        try {
            await deleteInvitation(key);
            toast({ title: 'Davet silindi', status: 'info', duration: 2000 });
            fetchData();
        } catch (err) {
            toast({ title: 'Silme hatası', status: 'error', duration: 3000 });
        }
    };

    const openApproveModal = (reqUser: UserRequest) => {
        setSelectedUser(reqUser);
        setSelectedRole(defaultRoleName);
        setSelectedSubTeamId('');
        onOpen();
    };

    const confirmApprove = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            const perms = resolveRolePermissions(selectedRole, roles);
            const chosenSubTeam = subTeams.find((t) => t.id === selectedSubTeamId);
            await setDoc(doc(db, 'approvedUsers', selectedUser.uid), {
                ...selectedUser,
                companyId: companyId || 'default-company',
                companyName: orgSettings.organizationName,
                subTeamId: chosenSubTeam?.id || '',
                subTeamName: chosenSubTeam?.name || '',
                role: selectedRole,
                isSuperAdmin: perms.isSuperAdmin,
                isManager: perms.isManager,
                approvedAt: serverTimestamp(),
            });
            await deleteDoc(doc(db, 'pendingUsers', selectedUser.uid));

            toast({ title: 'Onaylandı', status: 'success', duration: 2000 });
            onClose();
            fetchData();
        } catch (err) {
            console.error('Approve error:', err);
            toast({ title: 'Hata', status: 'error', duration: 3000 });
        }
        setActionLoading(false);
    };

    const openEditModal = (emp: ApprovedUser) => {
        setEditingUser(emp);
        setSelectedRole(emp.role || defaultRoleName);
        setSelectedSubTeamId(emp.subTeamId || '');
        setSelectedDept(emp.department || 'Genel');
        onEditOpen();
    };

    const confirmEditRole = async () => {
        if (!editingUser) return;
        setActionLoading(true);
        try {
            const perms = resolveRolePermissions(selectedRole, roles);
            const chosenSubTeam = subTeams.find((t) => t.id === selectedSubTeamId);
            await updateDoc(doc(db, 'approvedUsers', editingUser.uid), {
                role: selectedRole,
                department: selectedDept || editingUser.department,
                subTeamId: chosenSubTeam?.id || '',
                subTeamName: chosenSubTeam?.name || '',
                isSuperAdmin: perms.isSuperAdmin,
                isManager: perms.isManager,
            });
            toast({ title: 'Çalışan Bilgileri Güncellendi', status: 'success', duration: 2000 });
            onEditClose();
            fetchData();
        } catch (err) {
            console.error('Update error:', err);
            toast({ title: 'Hata', status: 'error', duration: 3000 });
        }
        setActionLoading(false);
    };

    const handleReject = async (reqUser: UserRequest) => {
        if (!window.confirm(`${reqUser.name} ${reqUser.surname} reddedilsin mi?`)) return;
        try {
            await deleteDoc(doc(db, 'pendingUsers', reqUser.uid));
            toast({ title: 'Reddedildi', status: 'info', duration: 2000 });
            fetchData();
        } catch (err) {
            toast({ title: 'Hata', status: 'error', duration: 3000 });
        }
    };

    const handleRevoke = async (emp: ApprovedUser) => {
        if (!window.confirm(`Şirket erişimi kaldırılsın mı: ${emp.name} ${emp.surname}?`)) return;
        try {
            await deleteDoc(doc(db, 'approvedUsers', emp.uid));
            toast({ title: 'Yetki Kaldırıldı', status: 'warning', duration: 2000 });
            fetchData();
        } catch (err) {
            toast({ title: 'Hata', status: 'error', duration: 3000 });
        }
    };

    if (!isSuperAdmin && !isManager) {
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

    return (
        <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
            <Card flexDirection="column" w="100%" px="0px">
                <Tabs variant="soft-rounded" colorScheme="brand">
                    <Flex
                        px="25px"
                        mb="20px"
                        justify="space-between"
                        align="center"
                        flexWrap="wrap"
                        gap="12px"
                    >
                        <Box>
                            <Text color={textColor} fontSize="22px" fontWeight="700">
                                {t('Çalışan ve Davet Yönetimi', 'Employee & Invitation Management')}
                            </Text>
                            <Text fontSize="xs" color="gray.400">
                                {orgSettings.organizationName} •{' '}
                                {t(
                                    'E-posta ve kişiye özel anahtar (Key) ile çalışan davet edin',
                                    'Invite employees with personal invitation keys and dedicated registration links'
                                )}
                            </Text>
                        </Box>

                        <Flex align="center" gap="12px" flexWrap="wrap">
                            <Button
                                leftIcon={<Icon as={MdPersonAdd as any} />}
                                colorScheme="brand"
                                borderRadius="14px"
                                onClick={handleOpenInviteModal}
                            >
                                {t('Çalışan Davet Et (Key Oluştur)', 'Invite Employee (Generate Key)')}
                            </Button>
                            <TabList>
                                <Tab>
                                    {t('Şirket Çalışanları', 'Company Employees')} ({approvedUsers.length})
                                </Tab>
                                <Tab>
                                    {t('Davet Anahtarları', 'Invitation Keys')} ({invitations.length})
                                </Tab>
                                {pendingUsers.length > 0 && (
                                    <Tab>
                                        {t('Bekleyenler', 'Pending')} ({pendingUsers.length})
                                    </Tab>
                                )}
                            </TabList>
                        </Flex>
                    </Flex>

                    <TabPanels>
                        {/* TAB 1: Şirket Çalışanları */}
                        <TabPanel>
                            {loading ? (
                                <Flex justify="center" py="30px">
                                    <Spinner />
                                </Flex>
                            ) : approvedUsers.length === 0 ? (
                                <Text textAlign="center" color="gray.400" py="20px">
                                    {t('Henüz onaylı çalışan yok.', 'No approved employees yet.')}
                                </Text>
                            ) : (
                                <Table variant="simple" color="gray.500">
                                    <Thead>
                                        <Tr>
                                            <Th borderColor={borderColor}>{t('Çalışan', 'Employee')}</Th>
                                            <Th borderColor={borderColor}>{t('Departman', 'Department')}</Th>
                                            <Th borderColor={borderColor}>{t('Alt Takım / Alan', 'Sub-Team / Area')}</Th>
                                            <Th borderColor={borderColor}>{t('Rol', 'Role')}</Th>
                                            <Th borderColor={borderColor} textAlign="center">
                                                {t('İşlem', 'Actions')}
                                            </Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {approvedUsers.map((emp) => (
                                            <Tr key={emp.uid}>
                                                <Td borderColor={borderColor}>
                                                    <Flex align="center">
                                                        <Avatar
                                                            src={emp.photoURL}
                                                            name={`${emp.name} ${emp.surname}`}
                                                            size="sm"
                                                            me="10px"
                                                        />
                                                        <Flex direction="column">
                                                            <Text
                                                                color={textColor}
                                                                fontWeight="700"
                                                                fontSize="sm"
                                                            >
                                                                {emp.name} {emp.surname}
                                                            </Text>
                                                            <Text fontSize="xs">{emp.email}</Text>
                                                        </Flex>
                                                    </Flex>
                                                </Td>
                                                <Td borderColor={borderColor}>
                                                    <Badge colorScheme="green">
                                                        {emp.department || 'Genel'}
                                                    </Badge>
                                                </Td>
                                                <Td borderColor={borderColor}>
                                                    {emp.subTeamName ? (
                                                        <Badge colorScheme="teal">
                                                            {emp.subTeamName}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline">
                                                            {t('Tüm Şirket', 'All Company')}
                                                        </Badge>
                                                    )}
                                                </Td>
                                                <Td borderColor={borderColor}>
                                                    <Badge colorScheme="blue">
                                                        {emp.role || 'Personel'}
                                                    </Badge>
                                                </Td>
                                                <Td borderColor={borderColor} textAlign="center">
                                                    <Flex justify="center" gap="10px">
                                                        <Tooltip label={t('Rol / Alt Takım Düzenle', 'Edit Role / Sub-Team')}>
                                                            <IconButton
                                                                aria-label="Edit Role"
                                                                icon={<Icon as={MdEdit as any} />}
                                                                size="sm"
                                                                onClick={() => openEditModal(emp)}
                                                            />
                                                        </Tooltip>
                                                        {isSuperAdmin && (
                                                            <Tooltip label={t('Erişimi Kaldır', 'Revoke Access')}>
                                                                <IconButton
                                                                    aria-label="Revoke"
                                                                    icon={<Icon as={MdDelete as any} />}
                                                                    colorScheme="red"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleRevoke(emp)}
                                                                />
                                                            </Tooltip>
                                                        )}
                                                    </Flex>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            )}
                        </TabPanel>

                        {/* TAB 2: Davet Anahtarları ve Özel Linkler */}
                        <TabPanel>
                            {loading ? (
                                <Flex justify="center" py="30px">
                                    <Spinner />
                                </Flex>
                            ) : invitations.length === 0 ? (
                                <Flex direction="column" align="center" py="30px" gap="10px">
                                    <Text color="gray.400">
                                        {t(
                                            'Henüz oluşturulmuş bir çalışan daveti bulunmuyor.',
                                            'No employee invitations have been created yet.'
                                        )}
                                    </Text>
                                    <Button
                                        size="sm"
                                        colorScheme="brand"
                                        onClick={handleOpenInviteModal}
                                    >
                                        {t('İlk Çalışan Davetini Oluştur', 'Create First Employee Invitation')}
                                    </Button>
                                </Flex>
                            ) : (
                                <Table variant="simple" color="gray.500">
                                    <Thead>
                                        <Tr>
                                            <Th borderColor={borderColor}>{t('Davetli E-posta', 'Invited Email')}</Th>
                                            <Th borderColor={borderColor}>{t('Özel Key', 'Invite Key')}</Th>
                                            <Th borderColor={borderColor}>{t('Rol & Alt Takım', 'Role & Sub-Team')}</Th>
                                            <Th borderColor={borderColor}>{t('Durum', 'Status')}</Th>
                                            <Th borderColor={borderColor} textAlign="right">
                                                {t('Davet İşlemleri', 'Actions')}
                                            </Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {invitations.map((inv) => (
                                            <Tr key={inv.key}>
                                                <Td borderColor={borderColor}>
                                                    <Text
                                                        color={textColor}
                                                        fontWeight="700"
                                                        fontSize="sm"
                                                    >
                                                        {inv.email}
                                                    </Text>
                                                    {(inv.invitedName || inv.invitedSurname) && (
                                                        <Text fontSize="xs" color="gray.400">
                                                            {inv.invitedName} {inv.invitedSurname}
                                                        </Text>
                                                    )}
                                                </Td>
                                                <Td borderColor={borderColor}>
                                                    <Badge
                                                        colorScheme="purple"
                                                        fontFamily="monospace"
                                                        fontSize="sm"
                                                        px="8px"
                                                        py="2px"
                                                    >
                                                        {inv.key}
                                                    </Badge>
                                                </Td>
                                                <Td borderColor={borderColor}>
                                                    <Flex gap="6px" flexWrap="wrap">
                                                        <Badge colorScheme="blue">{inv.role}</Badge>
                                                        <Badge colorScheme="green">
                                                            {inv.department}
                                                        </Badge>
                                                        {inv.subTeamName && (
                                                            <Badge colorScheme="teal">
                                                                {inv.subTeamName}
                                                            </Badge>
                                                        )}
                                                    </Flex>
                                                </Td>
                                                <Td borderColor={borderColor}>
                                                    <Badge
                                                        colorScheme={
                                                            inv.status === 'accepted'
                                                                ? 'green'
                                                                : 'orange'
                                                        }
                                                    >
                                                        {inv.status === 'accepted'
                                                            ? t('Katıldı', 'Joined')
                                                            : t('Bekliyor', 'Pending')}
                                                    </Badge>
                                                </Td>
                                                <Td borderColor={borderColor} textAlign="right">
                                                    <Flex justify="flex-end" gap="6px">
                                                        <Tooltip label={t('Davet E-postası Gönder', 'Send Invitation Email')}>
                                                            <IconButton
                                                                aria-label="Send Email"
                                                                icon={<Icon as={MdEmail as any} />}
                                                                size="sm"
                                                                colorScheme="brand"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    window.location.href =
                                                                        buildInviteMailtoUrl(inv);
                                                                }}
                                                            />
                                                        </Tooltip>
                                                        <Tooltip label={t('Özel Kayıt Linkini Kopyala', 'Copy Dedicated Registration Link')}>
                                                            <IconButton
                                                                aria-label="Copy Invite Link"
                                                                icon={<Icon as={MdLink as any} />}
                                                                size="sm"
                                                                onClick={() =>
                                                                    copyText(
                                                                        buildInviteUrl(inv.key),
                                                                        t('Özel kayıt bağlantısı', 'Registration link')
                                                                    )
                                                                }
                                                            />
                                                        </Tooltip>
                                                        <Tooltip label={t('Davet Anahtarını (Key) Kopyala', 'Copy Invite Key')}>
                                                            <IconButton
                                                                aria-label="Copy Key"
                                                                icon={<Icon as={MdVpnKey as any} />}
                                                                size="sm"
                                                                onClick={() =>
                                                                    copyText(inv.key, t('Davet anahtarı', 'Invite key'))
                                                                }
                                                            />
                                                        </Tooltip>
                                                        <Tooltip label={t('Daveti Sil / İptal Et', 'Delete / Revoke Invitation')}>
                                                            <IconButton
                                                                aria-label="Delete Invite"
                                                                icon={<Icon as={MdDelete as any} />}
                                                                size="sm"
                                                                colorScheme="red"
                                                                variant="ghost"
                                                                onClick={() =>
                                                                    handleDeleteInvite(inv.key)
                                                                }
                                                            />
                                                        </Tooltip>
                                                    </Flex>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            )}
                        </TabPanel>

                        {/* TAB 3: Bekleyen İstekler */}
                        {pendingUsers.length > 0 && (
                            <TabPanel>
                                <Table variant="simple" color="gray.500">
                                    <Thead>
                                        <Tr>
                                            <Th borderColor={borderColor}>{t('Kullanıcı', 'User')}</Th>
                                            <Th borderColor={borderColor}>{t('Departman', 'Department')}</Th>
                                            <Th borderColor={borderColor} textAlign="center">
                                                {t('İşlem', 'Actions')}
                                            </Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {pendingUsers.map((reqUser) => (
                                            <Tr key={reqUser.uid}>
                                                <Td borderColor={borderColor}>
                                                    <Flex align="center">
                                                        <Avatar
                                                            src={reqUser.photoURL}
                                                            size="sm"
                                                            me="10px"
                                                        />
                                                        <Flex direction="column">
                                                            <Text
                                                                color={textColor}
                                                                fontWeight="700"
                                                                fontSize="sm"
                                                            >
                                                                {reqUser.name} {reqUser.surname}
                                                            </Text>
                                                            <Text fontSize="xs">
                                                                {reqUser.email}
                                                            </Text>
                                                        </Flex>
                                                    </Flex>
                                                </Td>
                                                <Td borderColor={borderColor}>
                                                    <Badge colorScheme="orange">
                                                        {reqUser.department}
                                                    </Badge>
                                                </Td>
                                                <Td borderColor={borderColor} textAlign="center">
                                                    <Flex justify="center" gap="10px">
                                                        <IconButton
                                                            aria-label="Approve"
                                                            icon={<Icon as={MdCheck as any} />}
                                                            colorScheme="green"
                                                            size="sm"
                                                            onClick={() =>
                                                                openApproveModal(reqUser)
                                                            }
                                                        />
                                                        <IconButton
                                                            aria-label="Reject"
                                                            icon={<Icon as={MdClose as any} />}
                                                            colorScheme="red"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleReject(reqUser)}
                                                        />
                                                    </Flex>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </TabPanel>
                        )}
                    </TabPanels>
                </Tabs>
            </Card>

            {/* Çalışan Davet Et (E-posta & Özel Key) Modalı */}
            <Modal isOpen={isInviteOpen} onClose={onInviteClose} size="lg" isCentered>
                <ModalOverlay />
                <ModalContent borderRadius="20px">
                    <ModalHeader>
                        {t('Çalışan Davet Et', 'Invite Employee')} ({orgSettings.organizationName})
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {!createdInvite ? (
                            <VStack spacing="14px" align="stretch">
                                <Text fontSize="xs" color="gray.500">
                                    {t(
                                        'Çalışanın e-posta adresini girin. Sistem o kişiye özel bir Davet Anahtarı (Key) ve Özel Kayıt Bağlantısı oluşturacaktır.',
                                        'Enter the employee email address. The system will generate a personal Invitation Key and a Dedicated Registration Link.'
                                    )}
                                </Text>

                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="600">
                                        {t('Çalışan E-posta Adresi', 'Employee Email Address')}
                                    </FormLabel>
                                    <Input
                                        type="email"
                                        placeholder="employee@company.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        borderRadius="12px"
                                    />
                                </FormControl>

                                <SimpleGrid columns={2} spacing="10px">
                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="600">
                                            {t('Ad (İsteğe Bağlı)', 'First Name (Optional)')}
                                        </FormLabel>
                                        <Input
                                            placeholder={t('Ad', 'First Name')}
                                            value={inviteName}
                                            onChange={(e) => setInviteName(e.target.value)}
                                            borderRadius="12px"
                                        />
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="600">
                                            {t('Soyad (İsteğe Bağlı)', 'Last Name (Optional)')}
                                        </FormLabel>
                                        <Input
                                            placeholder={t('Soyad', 'Last Name')}
                                            value={inviteSurname}
                                            onChange={(e) => setInviteSurname(e.target.value)}
                                            borderRadius="12px"
                                        />
                                    </FormControl>
                                </SimpleGrid>

                                <SimpleGrid columns={2} spacing="10px">
                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="600">
                                            {t('Atanacak Rol', 'Assigned Role')}
                                        </FormLabel>
                                        <Select
                                            value={inviteRole}
                                            onChange={(e) => setInviteRole(e.target.value)}
                                            borderRadius="12px"
                                        >
                                            {roles.map((r) => (
                                                <option key={r.id} value={r.name}>
                                                    {r.name}
                                                </option>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="600">
                                            {t('Departman', 'Department')}
                                        </FormLabel>
                                        <Input
                                            placeholder={t('Örn: Yazılım, İK, Üretim...', 'e.g. Engineering, HR, Operations...')}
                                            value={inviteDepartment}
                                            onChange={(e) => setInviteDepartment(e.target.value)}
                                            borderRadius="12px"
                                            list="dept-options"
                                        />
                                        <datalist id="dept-options">
                                            {departments.map((d) => (
                                                <option key={d} value={d} />
                                            ))}
                                        </datalist>
                                    </FormControl>
                                </SimpleGrid>

                                {subTeams.length > 0 && (
                                    <FormControl>
                                        <FormLabel fontSize="sm" fontWeight="600">
                                            {t('Alt Takım / Çalışma Alanı', 'Sub-Team / Workspace')}
                                        </FormLabel>
                                        <Select
                                            value={inviteSubTeamId}
                                            onChange={(e) => setInviteSubTeamId(e.target.value)}
                                            borderRadius="12px"
                                        >
                                            <option value="">{t('Tüm Şirket (Genel)', 'All Company (General)')}</option>
                                            {subTeams.map((team) => (
                                                <option key={team.id} value={team.id}>
                                                    {team.name}
                                                </option>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                            </VStack>
                        ) : (
                            <VStack spacing="16px" align="stretch" py="8px">
                                <Box
                                    p="16px"
                                    bg="green.50"
                                    border="1px solid"
                                    borderColor="green.200"
                                    borderRadius="16px"
                                >
                                    <Text fontWeight="700" color="green.800" mb="4px">
                                        {t('Davet Anahtarı ve Özel Bağlantı Hazır!', 'Invitation Key & Dedicated Link Ready!')}
                                    </Text>
                                    <Text fontSize="xs" color="green.700">
                                        {t('Alıcı', 'Recipient')}: <b>{createdInvite.email}</b> • {t('Rol', 'Role')}: <b>{createdInvite.role}</b>
                                        {createdInvite.subTeamName ? ` • ${t('Alt Takım', 'Sub-Team')}: ${createdInvite.subTeamName}` : ''}
                                    </Text>
                                </Box>

                                <FormControl>
                                    <FormLabel fontSize="xs" fontWeight="700" color="gray.500">
                                        {t('KİŞİYE ÖZEL DAVET ANAHTARI (KEY)', 'PERSONAL INVITATION KEY')}
                                    </FormLabel>
                                    <Flex gap="8px">
                                        <Input
                                            value={createdInvite.key}
                                            isReadOnly
                                            fontFamily="monospace"
                                            fontWeight="800"
                                            fontSize="lg"
                                            borderRadius="12px"
                                        />
                                        <Button
                                            leftIcon={<Icon as={MdContentCopy as any} />}
                                            onClick={() =>
                                                copyText(createdInvite.key, t('Davet anahtarı', 'Invitation key'))
                                            }
                                            borderRadius="12px"
                                        >
                                            {t('Kopyala', 'Copy')}
                                        </Button>
                                    </Flex>
                                </FormControl>

                                <FormControl>
                                    <FormLabel fontSize="xs" fontWeight="700" color="gray.500">
                                        {t('ÖZEL KAYIT PANELİ BAĞLANTISI', 'DEDICATED REGISTRATION LINK')}
                                    </FormLabel>
                                    <Flex gap="8px">
                                        <Input
                                            value={buildInviteUrl(createdInvite.key)}
                                            isReadOnly
                                            fontSize="xs"
                                            borderRadius="12px"
                                        />
                                        <Button
                                            leftIcon={<Icon as={MdContentCopy as any} />}
                                            onClick={() =>
                                                copyText(
                                                    buildInviteUrl(createdInvite.key),
                                                    t('Özel kayıt linki', 'Registration link')
                                                )
                                            }
                                            borderRadius="12px"
                                        >
                                            {t('Linki Kopyala', 'Copy Link')}
                                        </Button>
                                    </Flex>
                                </FormControl>

                                <Button
                                    leftIcon={<Icon as={MdEmail as any} />}
                                    colorScheme="brand"
                                    size="lg"
                                    borderRadius="14px"
                                    onClick={() => {
                                        window.location.href = buildInviteMailtoUrl(createdInvite);
                                    }}
                                >
                                    {t('E-posta İstemcisi ile Davet Maili Gönder', 'Send Invitation Email via Mail Client')}
                                </Button>
                            </VStack>
                        )}
                    </ModalBody>
                    <ModalFooter gap="8px">
                        <Button variant="ghost" onClick={onInviteClose} borderRadius="12px">
                            {t('Kapat', 'Close')}
                        </Button>
                        {!createdInvite && (
                            <Button
                                colorScheme="brand"
                                borderRadius="12px"
                                onClick={handleCreateInvitation}
                                isLoading={actionLoading}
                            >
                                {t('Key ve Özel Link Oluştur', 'Generate Key & Dedicated Link')}
                            </Button>
                        )}
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Approve Modal */}
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Kullanıcıyı Onayla</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing="14px" align="stretch">
                            <Text>
                                <b>
                                    {selectedUser?.name} {selectedUser?.surname}
                                </b>{' '}
                                kullanıcısına atanacak rol ve alt takımı seçin:
                            </Text>
                            <FormControl>
                                <FormLabel>Rol</FormLabel>
                                <Select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                >
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.name}>
                                            {r.name}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>
                            {subTeams.length > 0 && (
                                <FormControl>
                                    <FormLabel>Alt Takım / Çalışma Alanı</FormLabel>
                                    <Select
                                        value={selectedSubTeamId}
                                        onChange={(e) => setSelectedSubTeamId(e.target.value)}
                                    >
                                        <option value="">Tüm Şirket (Genel)</option>
                                        {subTeams.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>
                            İptal
                        </Button>
                        <Button
                            colorScheme="green"
                            onClick={confirmApprove}
                            isLoading={actionLoading}
                        >
                            Onayla ve Kaydet
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Edit Role & SubTeam Modal */}
            <Modal isOpen={isEditOpen} onClose={onEditClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Çalışan Bilgilerini Düzenle</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing="14px" align="stretch">
                            <FormControl>
                                <FormLabel>Rol</FormLabel>
                                <Select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                >
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.name}>
                                            {r.name}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Departman</FormLabel>
                                <Input
                                    value={selectedDept}
                                    onChange={(e) => setSelectedDept(e.target.value)}
                                    placeholder="Departman"
                                />
                            </FormControl>
                            {subTeams.length > 0 && (
                                <FormControl>
                                    <FormLabel>Alt Takım / Çalışma Alanı</FormLabel>
                                    <Select
                                        value={selectedSubTeamId}
                                        onChange={(e) => setSelectedSubTeamId(e.target.value)}
                                    >
                                        <option value="">Tüm Şirket (Genel)</option>
                                        {subTeams.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onEditClose}>
                            İptal
                        </Button>
                        <Button
                            colorScheme="blue"
                            onClick={confirmEditRole}
                            isLoading={actionLoading}
                        >
                            Güncelle
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}

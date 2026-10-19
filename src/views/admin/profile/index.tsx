/* eslint-disable */
import React, { useState, useEffect } from 'react';
import {
	Box,
	Flex,
	Text,
	useColorModeValue,
	Avatar,
	SimpleGrid,
	Badge,
	Button,
	useToast,
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalCloseButton,
	ModalBody,
	ModalFooter,
	FormControl,
	FormLabel,
	Input,
	Select,
	useDisclosure,
	Spinner,
	Icon,
	IconButton,
} from '@chakra-ui/react';
import Card from 'components/card/Card';
import { useAuth } from 'contexts/AuthContext';
import { useOrganization } from 'contexts/OrganizationContext';
import { resolveRolePermissions } from 'services/roleService';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { MdEdit } from 'react-icons/md';

interface UserData {
	name: string;
	surname: string;
	email: string;
	department: string;
	role: string;
	photoURL: string;
}

export default function Profile() {
	const textColor = useColorModeValue('secondaryGray.900', 'white');
	const textColorSecondary = 'gray.400';
	const bgColor = useColorModeValue('white', 'navy.700');
	const toast = useToast();
	const { user, isSuperAdmin } = useAuth();
	const { roles } = useOrganization();

	const defaultRoleName = roles.find((r) => r.isDefault)?.name || roles[0]?.name || 'Personel';

	// State for user data
	const [userData, setUserData] = useState<UserData | null>(null);
	const [loading, setLoading] = useState(true);
	const [departmentsList, setDepartmentsList] = useState<{ id: string, name: string }[]>([]);

	// Edit Modal State
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [editRole, setEditRole] = useState('');
	const [editDepartment, setEditDepartment] = useState('');
	const [saving, setSaving] = useState(false);

	const fetchUserData = async () => {
		if (!user) return;
		setLoading(true);
		try {
			const userDoc = await getDoc(doc(db, 'approvedUsers', user.uid));
			if (userDoc.exists()) {
				setUserData(userDoc.data() as UserData);
				setEditRole(userDoc.data().role || defaultRoleName);
				setEditDepartment(userDoc.data().department || '');
			}
		} catch (err) {
			console.error("Error fetching user data:", err);
			toast({ title: "Veri yüklenemedi", status: "error" });
		}
		setLoading(false);
	};

	const fetchDepartments = async () => {
		try {
			const querySnapshot = await getDocs(collection(db, 'departments'));
			const depts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as { id: string, name: string }));
			setDepartmentsList(depts);
		} catch (error) {
			console.error("Error fetching departments:", error);
		}
	};

	useEffect(() => {
		if (user) {
			fetchUserData();
			fetchDepartments();
		}
	}, [user]);

	const handleSave = async () => {
		if (!user) return;
		setSaving(true);
		try {
			const perms = resolveRolePermissions(editRole, roles);
			await updateDoc(doc(db, 'approvedUsers', user.uid), {
				role: editRole,
				isSuperAdmin: perms.isSuperAdmin,
				isManager: perms.isManager,
				department: editDepartment
			});
			toast({ title: "Profil güncellendi", status: "success" });
			fetchUserData(); // Refresh data
			onClose();
		} catch (err) {
			console.error("Error updating profile:", err);
			toast({ title: "Güncelleme hatası", status: "error" });
		}
		setSaving(false);
	};

	if (loading) {
		return (
			<Box pt={{ base: '130px', md: '80px', xl: '80px' }} display="flex" justifyContent="center">
				<Spinner size="xl" />
			</Box>
		);
	}

	if (!userData) {
		return (
			<Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
				<Text>Kullanıcı verisi bulunamadı.</Text>
			</Box>
		);
	}

	return (
		<Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
			<SimpleGrid columns={{ base: 1, md: 1, xl: 1 }} gap='20px' mb='20px'>
				<Card mb={{ base: '0px', lg: '20px' }} alignItems='center'>
					<Box
						bgGradient='linear(to-b, brand.500, brand.400)'
						w='100%'
						h='100px'
						borderRadius='20px'
					/>
					<Avatar
						mx='auto'
						src={userData.photoURL || user?.photoURL || ''}
						h='87px'
						w='87px'
						mt='-43px'
						mb='15px'
						border='4px solid'
						borderColor={bgColor}
					/>
					<Text color={textColor} fontSize='2xl' fontWeight='700'>
						{userData.name} {userData.surname}
					</Text>
					<Text color={textColorSecondary} fontSize='md'>
						{userData.email}
					</Text>

					<Flex justify='center' mt='10px' gap='10px' align="center">
						<Badge colorScheme='purple' fontSize='md' p='5px 10px' borderRadius='8px'>
							{userData.role || 'Role Yok'}
						</Badge>
						<Badge colorScheme='green' fontSize='md' p='5px 10px' borderRadius='8px'>
							{userData.department || 'Departman Yok'}
						</Badge>

						{isSuperAdmin && (
							<IconButton
								aria-label="Edit Profile"
								icon={<Icon as={MdEdit as any} />}
								size="sm"
								colorScheme="brand"
								onClick={onOpen}
								ml="2"
							/>
						)}
					</Flex>
				</Card>
			</SimpleGrid>

			{/* Edit Modal for Super Admins */}
			<Modal isOpen={isOpen} onClose={onClose}>
				<ModalOverlay />
				<ModalContent>
					<ModalHeader>Profili Düzenle (Admin)</ModalHeader>
					<ModalCloseButton />
					<ModalBody>
						<FormControl mb="4">
							<FormLabel>Departman</FormLabel>
							<Select value={editDepartment} onChange={(e) => setEditDepartment(e.target.value)}>
								{departmentsList.map(dept => (
									<option key={dept.id} value={dept.name}>{dept.name}</option>
								))}
							</Select>
						</FormControl>
						<FormControl>
							<FormLabel>Rol</FormLabel>
							<Select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
								{roles.map(r => (
									<option key={r.id} value={r.name}>{r.name}</option>
								))}
							</Select>
						</FormControl>
					</ModalBody>
					<ModalFooter>
						<Button variant="ghost" mr={3} onClick={onClose}>İptal</Button>
						<Button colorScheme="blue" onClick={handleSave} isLoading={saving}>
							Kaydet
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</Box>
	);
}

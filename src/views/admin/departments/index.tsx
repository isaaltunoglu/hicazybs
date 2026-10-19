/* eslint-disable */
import React, { useState, useEffect } from 'react';
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
    Input,
    Icon,
    IconButton,
    Spinner,
    FormControl,
    FormLabel,
} from '@chakra-ui/react';
import Card from 'components/card/Card';
import { MdDelete, MdAdd } from 'react-icons/md';
import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    query,
    orderBy,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from 'contexts/AuthContext';

interface Department {
    id: string;
    name: string;
    createdAt: any;
}

export default function Departments() {
    const textColor = useColorModeValue('secondaryGray.900', 'white');
    const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
    const toast = useToast();
    const { isSuperAdmin, companyId } = useAuth();

    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [newDeptName, setNewDeptName] = useState('');
    const [adding, setAdding] = useState(false);

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const targetCompany = companyId || 'default-company';
            const q = query(collection(db, 'departments'), orderBy('name'));
            const querySnapshot = await getDocs(q);
            const data: Department[] = [];
            querySnapshot.forEach((d) => {
                const docData = d.data();
                if ((docData.companyId || 'default-company') === targetCompany) {
                    data.push({ id: d.id, ...docData } as Department);
                }
            });
            setDepartments(data);
        } catch (err) {
            console.error('Error fetching departments:', err);
            toast({
                title: 'Hata',
                description: 'Departmanlar yüklenirken hata oluştu',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isSuperAdmin) {
            fetchDepartments();
        }
    }, [isSuperAdmin, companyId]);

    const handleAdd = async () => {
        if (!newDeptName.trim()) return;
        setAdding(true);
        try {
            await addDoc(collection(db, 'departments'), {
                companyId: companyId || 'default-company',
                name: newDeptName.trim(),
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Departman Eklendi', status: 'success', duration: 2000 });
            setNewDeptName('');
            fetchDepartments();
        } catch (err) {
            console.error('Error adding department:', err);
            toast({ title: 'Hata', description: 'Departman eklenemedi', status: 'error', duration: 3000 });
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bu departmanı silmek istediğinize emin misiniz?')) return;
        try {
            await deleteDoc(doc(db, 'departments', id));
            toast({ title: 'Departman Silindi', status: 'info', duration: 2000 });
            fetchDepartments();
        } catch (err) {
            console.error('Error deleting department:', err);
            toast({ title: 'Hata', description: 'Departman silinemedi', status: 'error', duration: 3000 });
        }
    };

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

    return (
        <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
            <Card flexDirection="column" w="100%" px="0px">
                <Flex px="25px" mb="8px" justifyContent="space-between" align="center">
                    <Text color={textColor} fontSize="22px" fontWeight="700" lineHeight="100%">
                        Departman Yönetimi
                    </Text>
                </Flex>

                <Box px="25px" mb="20px">
                    <Flex gap="10px" align="flex-end">
                        <FormControl>
                            <FormLabel>Yeni Departman Adı</FormLabel>
                            <Input
                                value={newDeptName}
                                onChange={(e) => setNewDeptName(e.target.value)}
                                placeholder="Örn: Yazılım Ekibi"
                                borderRadius="10px"
                            />
                        </FormControl>
                        <Button
                            leftIcon={<Icon as={MdAdd as any} />}
                            colorScheme="brand"
                            onClick={handleAdd}
                            isLoading={adding}
                            borderRadius="10px"
                            isDisabled={!newDeptName.trim()}
                        >
                            Ekle
                        </Button>
                    </Flex>
                </Box>

                <Box>
                    <Table variant="simple" color="gray.500" mb="24px">
                        <Thead>
                            <Tr>
                                <Th borderColor={borderColor}>Departman Adı</Th>
                                <Th borderColor={borderColor} textAlign="right" width="100px">İşlem</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {loading ? (
                                <Tr>
                                    <Td colSpan={2} textAlign="center"><Spinner /></Td>
                                </Tr>
                            ) : departments.length === 0 ? (
                                <Tr>
                                    <Td colSpan={2} textAlign="center">Henüz departman eklenmemiş.</Td>
                                </Tr>
                            ) : (
                                departments.map((dept) => (
                                    <Tr key={dept.id}>
                                        <Td borderColor={borderColor}>
                                            <Text color={textColor} fontWeight="700">
                                                {dept.name}
                                            </Text>
                                        </Td>
                                        <Td borderColor={borderColor} textAlign="right">
                                            <IconButton
                                                aria-label="Delete"
                                                icon={<Icon as={MdDelete as any} />}
                                                colorScheme="red"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(dept.id)}
                                            />
                                        </Td>
                                    </Tr>
                                ))
                            )}
                        </Tbody>
                    </Table>
                </Box>
            </Card>
        </Box>
    );
}

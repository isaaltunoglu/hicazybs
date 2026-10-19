import {
    Button,
    FormControl,
    FormLabel,
    Input,
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
    CheckboxGroup,
    Checkbox,
    SimpleGrid,
    Spinner,
    Text,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { Mission, MissionFormData, MissionStatus } from 'types/mission';
import { UserProfile } from 'services/userService';
import { Department, getAllDepartments } from 'services/departmentService';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: MissionFormData) => void;
    editData: Mission | null;
    users: UserProfile[];
};

export default function MissionFormModal({ isOpen, onClose, onSubmit, editData, users }: Props) {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loadingDepts, setLoadingDepts] = useState(false);

    const [formData, setFormData] = useState<MissionFormData>({
        team: '',
        description: '',
        importance: 'Medium',
        deadline: new Date().toISOString().split('T')[0],
        assessmentPersons: [],
        status: 'Not Started',
    });

    useEffect(() => {
        const fetchDepts = async () => {
            setLoadingDepts(true);
            const data = await getAllDepartments();
            setDepartments(data);
            setLoadingDepts(false);

            if (!editData && data.length > 0) {
                setFormData(prev => ({ ...prev, team: data[0].name }));
            }
        };
        fetchDepts();
    }, []);

    useEffect(() => {
        if (editData) {
            setFormData({
                team: editData.team,
                description: editData.description,
                importance: editData.importance,
                deadline: editData.deadline ? new Date(editData.deadline).toISOString().split('T')[0] : '',
                assessmentPersons: editData.assessmentPersons,
                status: editData.status || 'Not Started',
            });
        } else {
            setFormData({
                team: departments.length > 0 ? departments[0].name : '',
                description: '',
                importance: 'Medium',
                deadline: new Date().toISOString().split('T')[0],
                assessmentPersons: [],
                status: 'Not Started',
            });
        }
    }, [editData, isOpen, departments]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleCheckboxChange = (values: string[]) => {
        setFormData((prev) => ({
            ...prev,
            assessmentPersons: values,
        }));
    };

    const handleSubmit = () => {
        onSubmit(formData);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalOverlay />
            <ModalContent borderRadius="20px">
                <ModalHeader>{editData ? 'Görevi Düzenle' : 'Yeni Görev Ekle'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4}>
                        <FormControl isRequired>
                            <FormLabel>Takım</FormLabel>
                            {loadingDepts ? <Spinner size="sm" /> : (
                                <Select
                                    name="team"
                                    value={formData.team}
                                    onChange={handleChange}
                                    borderRadius="14px"
                                >
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                                    ))}
                                </Select>
                            )}
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel>Görev Açıklaması</FormLabel>
                            <Textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Görevi detaylandırın..."
                                borderRadius="14px"
                            />
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel>Önem Derecesi</FormLabel>
                            <Select
                                name="importance"
                                value={formData.importance}
                                onChange={handleChange}
                                borderRadius="14px"
                            >
                                <option value="Low">Düşük</option>
                                <option value="Medium">Orta</option>
                                <option value="High">Yüksek</option>
                                <option value="Critical">Kritik</option>
                            </Select>
                        </FormControl>
                        {editData && (
                            <FormControl isRequired>
                                <FormLabel>Durum</FormLabel>
                                <Select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    borderRadius="14px"
                                >
                                    <option value="Not Started">Henüz Başlamadı</option>
                                    <option value="Working">Çalışılıyor</option>
                                    <option value="Completed">Tamamlandı</option>
                                </Select>
                            </FormControl>
                        )}
                        <FormControl isRequired>
                            <FormLabel>Bitiş Tarihi</FormLabel>
                            <Input
                                name="deadline"
                                type="date"
                                value={formData.deadline}
                                onChange={handleChange}
                                borderRadius="14px"
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel>Değerlendiriciler (Çoklu Seçim)</FormLabel>
                            <CheckboxGroup colorScheme="brand" value={formData.assessmentPersons} onChange={handleCheckboxChange}>
                                <SimpleGrid columns={2} spacing={2}>
                                    {users.map((user) => (
                                        <Checkbox key={user.uid} value={`${user.name} ${user.surname}`}>
                                            {user.name} {user.surname}
                                        </Checkbox>
                                    ))}
                                </SimpleGrid>
                            </CheckboxGroup>
                        </FormControl>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose} borderRadius="14px">
                        İptal
                    </Button>
                    <Button colorScheme="brand" onClick={handleSubmit} borderRadius="14px">
                        {editData ? 'Güncelle' : 'Ekle'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

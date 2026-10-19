import {
    Flex,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    useColorModeValue,
    IconButton,
    Badge,
    Tooltip,
    Input,
    InputGroup,
    InputLeftElement,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
    Icon,
    Box,
    VStack,
    Divider,
} from '@chakra-ui/react';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import Card from 'components/card/Card';
import { MdEdit, MdDelete, MdSearch, MdZoomIn, MdHistory, MdPlayArrow, MdDone, MdHourglassEmpty } from 'react-icons/md';
import * as React from 'react';
import { Mission, MissionStatus } from 'types/mission';

type Props = {
    missions: Mission[];
    onEdit: (mission: Mission) => void;
    onDelete: (mission: Mission) => void;
    onUpdateStatus?: (mission: Mission) => void;
    canEdit: boolean;
    isMyMissions?: boolean;
    canUpdateStatus?: (mission: Mission) => boolean;
};

const columnHelper = createColumnHelper<Mission>();

export default function MissionTable({ missions, onEdit, onDelete, onUpdateStatus, canEdit, isMyMissions, canUpdateStatus }: Props) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = React.useState('');
    const [selectedDescription, setSelectedDescription] = React.useState<string>('');
    const { isOpen: isZoomOpen, onOpen: onZoomOpen, onClose: onZoomClose } = useDisclosure();

    const textColor = useColorModeValue('secondaryGray.900', 'white');
    const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
    const searchBg = useColorModeValue('secondaryGray.300', 'navy.700');

    const handleZoom = React.useCallback((description: string) => {
        setSelectedDescription(description);
        onZoomOpen();
    }, [onZoomOpen]);

    const getImportanceColor = React.useCallback((importance: string): string => {
        switch (importance) {
            case 'Critical': return 'red';
            case 'High': return 'orange';
            case 'Medium': return 'yellow';
            case 'Low': return 'green';
            default: return 'gray';
        }
    }, []);

    const getStatusColor = React.useCallback((status: MissionStatus): string => {
        switch (status) {
            case 'Completed': return 'green';
            case 'Working': return 'blue';
            case 'Not Started': return 'gray';
            default: return 'gray';
        }
    }, []);

    const getStatusIcon = React.useCallback((status: MissionStatus) => {
        switch (status) {
            case 'Completed': return MdDone;
            case 'Working': return MdPlayArrow;
            case 'Not Started': return MdHourglassEmpty;
            default: return MdHourglassEmpty;
        }
    }, []);

    const columns = React.useMemo(() => [
        columnHelper.accessor('team', {
            id: 'team',
            header: () => (
                <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
                    TAKIM
                </Text>
            ),
            cell: (info) => (
                <Text color={textColor} fontSize="sm" fontWeight="700">
                    {info.getValue()}
                </Text>
            ),
        }),
        columnHelper.accessor('description', {
            id: 'description',
            header: () => (
                <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
                    GÖREV AÇIKLAMASI
                </Text>
            ),
            cell: (info) => (
                <Flex align="center">
                    <Text
                        color={textColor}
                        fontSize="sm"
                        fontWeight="500"
                        noOfLines={1}
                        maxW="200px"
                    >
                        {info.getValue()}
                    </Text>
                    {info.getValue().length > 30 && (
                        <IconButton
                            aria-label="Zoom Description"
                            icon={<Icon as={MdZoomIn as any} />}
                            size="xs"
                            variant="ghost"
                            ml="2"
                            onClick={() => handleZoom(info.getValue())}
                        />
                    )}
                </Flex>
            ),
        }),
        columnHelper.accessor('importance', {
            id: 'importance',
            header: () => (
                <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
                    ÖNEM DERECESİ
                </Text>
            ),
            cell: (info) => (
                <Badge
                    colorScheme={getImportanceColor(info.getValue())}
                    fontSize="sm"
                    fontWeight="600"
                    borderRadius="14px"
                    px="14px"
                >
                    {info.getValue()}
                </Badge>
            ),
        }),
        columnHelper.accessor('status', {
            id: 'status',
            header: () => (
                <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
                    DURUM
                </Text>
            ),
            cell: (info) => (
                <Badge
                    colorScheme={getStatusColor(info.getValue())}
                    fontSize="sm"
                    fontWeight="600"
                    borderRadius="14px"
                    px="14px"
                    display="flex"
                    alignItems="center"
                    gap={1}
                >
                    <Icon as={getStatusIcon(info.getValue()) as any} />
                    {info.getValue() === 'Completed' ? 'Tamamlandı' : 
                     info.getValue() === 'Working' ? 'Çalışılıyor' : 'Başlanmadı'}
                </Badge>
            ),
        }),
        columnHelper.accessor('deadline', {
            id: 'deadline',
            header: () => (
                <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
                    BİTİŞ TARİHİ
                </Text>
            ),
            cell: (info) => (
                <Text color={textColor} fontSize="sm" fontWeight="500">
                    {info.getValue() ? new Date(info.getValue()).toLocaleDateString('tr-TR') : '-'}
                </Text>
            ),
        }),
        columnHelper.accessor('assessmentPersons', {
            id: 'assessmentPersons',
            header: () => (
                <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
                    DEĞERLENDİRİCİLER
                </Text>
            ),
            cell: (info) => (
                <Text color={textColor} fontSize="sm" fontWeight="500">
                    {info.getValue().join(', ')}
                </Text>
            ),
        }),
        columnHelper.display({
            id: 'actions',
            header: () => (
                <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
                    İŞLEMLER
                </Text>
            ),
            cell: (info) => (
                <Flex>
                    {onUpdateStatus && (!canUpdateStatus || canUpdateStatus(info.row.original)) && (
                        <Tooltip label="Durum Güncelle / Süreç Bilgisi">
                            <IconButton
                                aria-label="Update Status"
                                icon={<Icon as={MdHistory as any} />}
                                variant="ghost"
                                colorScheme="blue"
                                size="sm"
                                onClick={() => onUpdateStatus(info.row.original)}
                            />
                        </Tooltip>
                    )}
                    <Tooltip label="Düzenle">
                        <IconButton
                            aria-label="Edit"
                            icon={<Icon as={MdEdit as any} />}
                            variant="ghost"
                            colorScheme="brand"
                            size="sm"
                            onClick={() => onEdit(info.row.original)}
                            isDisabled={!canEdit}
                        />
                    </Tooltip>
                    {canEdit && (
                        <Tooltip label="Sil">
                            <IconButton
                                aria-label="Delete"
                                icon={<Icon as={MdDelete as any} />}
                                variant="ghost"
                                colorScheme="red"
                                size="sm"
                                onClick={() => onDelete(info.row.original)}
                            />
                        </Tooltip>
                    )}
                </Flex>
            ),
        }),
    ], [canEdit, onEdit, onDelete, onUpdateStatus, canUpdateStatus, textColor, handleZoom, getImportanceColor, getStatusColor, getStatusIcon]);

    const table = useReactTable({
        data: missions,
        columns,
        state: {
            sorting,
            globalFilter,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    return (
        <Card flexDirection="column" w="100%" px="0px" overflowX={{ sm: 'scroll', lg: 'hidden' }}>
            <Flex px="25px" mb="20px" alignItems="center" justifyContent="space-between">
                <Text color={textColor} fontSize="22px" fontWeight="700" lineHeight="100%">
                    Görev Listesi
                </Text>
                <InputGroup w={{ base: '100%', md: '300px' }}>
                    <InputLeftElement pointerEvents="none">
                        <Icon as={MdSearch as any} color="gray.300" />
                    </InputLeftElement>
                    <Input
                        fontSize="sm"
                        bg={searchBg}
                        color={textColor}
                        placeholder="Ara..."
                        borderRadius="14px"
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                    />
                </InputGroup>
            </Flex>
            <Table variant="simple" color="gray.500" mb="24px" mt="12px">
                <Thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <Tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <Th
                                    key={header.id}
                                    colSpan={header.colSpan}
                                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                                    cursor={header.column.getCanSort() ? 'pointer' : 'default'}
                                    borderColor={borderColor}
                                >
                                    <Flex justifyContent="space-between" align="center">
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                        {header.column.getIsSorted() ? (header.column.getIsSorted() === 'asc' ? ' 🔼' : ' 🔽') : null}
                                    </Flex>
                                </Th>
                            ))}
                        </Tr>
                    ))}
                </Thead>
                <Tbody>
                    {table.getRowModel().rows.map((row) => (
                        <Tr key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                                <Td key={cell.id} fontSize={{ sm: '14px' }} minW={{ sm: '150px', md: '200px', lg: 'auto' }} borderColor="transparent">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </Td>
                            ))}
                        </Tr>
                    ))}
                </Tbody>
            </Table>

            <Modal isOpen={isZoomOpen} onClose={onZoomClose} size="xl">
                <ModalOverlay />
                <ModalContent borderRadius="20px">
                    <ModalHeader>Görev Açıklaması</ModalHeader>
                    <ModalBody>
                        <Text color={textColor} fontSize="md" whiteSpace="pre-wrap">
                            {selectedDescription}
                        </Text>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="brand" onClick={onZoomClose} borderRadius="14px">
                            Kapat
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Card>
    );
}


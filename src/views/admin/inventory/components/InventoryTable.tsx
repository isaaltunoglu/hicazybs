import {
    Box,
    Flex,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    useColorModeValue,
    Icon,
    IconButton,
    Badge,
    Tooltip,
    Input,
    InputGroup,
    InputLeftElement,
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
import { MdEdit, MdDelete, MdSearch } from 'react-icons/md';
import * as React from 'react';
import { InventoryItem, Category } from 'types/inventory';

type Props = {
    items: InventoryItem[];
    categories: Category[];
    onEdit: (item: InventoryItem) => void;
    onDelete: (item: InventoryItem) => void;
};

const columnHelper = createColumnHelper<InventoryItem>();

export default function InventoryTable({ items, categories, onEdit, onDelete }: Props) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = React.useState('');

    const textColor = useColorModeValue('secondaryGray.900', 'white');
    const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
    const searchBg = useColorModeValue('secondaryGray.300', 'navy.700');

    const getCategoryName = (categoryId: string): string => {
        const cat = categories.find((c) => c.id === categoryId);
        return cat ? cat.name : 'Bilinmiyor';
    };

    const getCategoryColor = (categoryId: string): string => {
        const cat = categories.find((c) => c.id === categoryId);
        return cat ? cat.color : 'gray';
    };

    const columns = [
        columnHelper.accessor('name', {
            id: 'name',
            header: () => (
                <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
                    AD
                </Text>
            ),
            cell: (info) => (
                <Text color={textColor} fontSize="sm" fontWeight="700">
                    {info.getValue()}
                </Text>
            ),
        }),
        columnHelper.accessor('location', {
            id: 'location',
            header: () => (
                <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
                    KONUM
                </Text>
            ),
            cell: (info) => (
                <Text color={textColor} fontSize="sm" fontWeight="500">
                    {info.getValue()}
                </Text>
            ),
        }),
        columnHelper.accessor('category', {
            id: 'category',
            header: () => (
                <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
                    KATEGORİ
                </Text>
            ),
            cell: (info) => (
                <Badge
                    colorScheme={getCategoryColor(info.getValue())}
                    fontSize="sm"
                    fontWeight="600"
                    borderRadius="8px"
                    px="10px"
                    py="4px"
                >
                    {getCategoryName(info.getValue())}
                </Badge>
            ),
        }),
        columnHelper.accessor('amount', {
            id: 'amount',
            header: () => (
                <Text fontSize={{ sm: '10px', lg: '12px' }} color="gray.400">
                    MİKTAR
                </Text>
            ),
            cell: (info) => (
                <Text color={textColor} fontSize="sm" fontWeight="700">
                    {info.getValue()}
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
                <Flex gap="2">
                    <Tooltip label="Düzenle">
                        <IconButton
                            aria-label="Düzenle"
                            icon={<Icon as={MdEdit as any} />}
                            size="sm"
                            variant="ghost"
                            colorScheme="brand"
                            onClick={() => onEdit(info.row.original)}
                        />
                    </Tooltip>
                    <Tooltip label="Sil">
                        <IconButton
                            aria-label="Sil"
                            icon={<Icon as={MdDelete as any} />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => onDelete(info.row.original)}
                        />
                    </Tooltip>
                </Flex>
            ),
        }),
    ];

    const table = useReactTable({
        data: items,
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
            <Flex px="25px" mb="8px" justifyContent="space-between" align="center">
                <Text color={textColor} fontSize="22px" fontWeight="700" lineHeight="100%">
                    Envanter Listesi
                </Text>
                <InputGroup w="260px">
                    <InputLeftElement>
                        <Icon as={MdSearch as any} color="gray" />
                    </InputLeftElement>
                    <Input
                        placeholder="Ara..."
                        bg={searchBg}
                        border="none"
                        borderRadius="14px"
                        fontSize="sm"
                        value={globalFilter ?? ''}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                    />
                </InputGroup>
            </Flex>
            <Box>
                <Table variant="simple" color="gray.500" mb="24px" mt="12px">
                    <Thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <Tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <Th
                                        key={header.id}
                                        colSpan={header.colSpan}
                                        pe="10px"
                                        borderColor={borderColor}
                                        cursor="pointer"
                                        onClick={header.column.getToggleSortingHandler()}
                                    >
                                        <Flex
                                            justifyContent="space-between"
                                            align="center"
                                            fontSize={{ sm: '10px', lg: '12px' }}
                                            color="gray.400"
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {{
                                                asc: ' ↑',
                                                desc: ' ↓',
                                            }[header.column.getIsSorted() as string] ?? null}
                                        </Flex>
                                    </Th>
                                ))}
                            </Tr>
                        ))}
                    </Thead>
                    <Tbody>
                        {table.getRowModel().rows.length === 0 ? (
                            <Tr>
                                <Td colSpan={5} textAlign="center" py="40px">
                                    <Text color="gray.400" fontSize="md">
                                        Henüz envanter öğesi eklenmemiş. "Yeni Öğe Ekle" butonuna tıklayarak başlayın.
                                    </Text>
                                </Td>
                            </Tr>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <Tr key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <Td
                                            key={cell.id}
                                            fontSize={{ sm: '14px' }}
                                            minW={{ sm: '150px', md: '200px', lg: 'auto' }}
                                            borderColor="transparent"
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </Td>
                                    ))}
                                </Tr>
                            ))
                        )}
                    </Tbody>
                </Table>
            </Box>
        </Card>
    );
}

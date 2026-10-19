// Chakra imports
import { Flex, Image, Text, Box, Icon, Select, useColorModeValue } from '@chakra-ui/react';
import { MdDashboardCustomize } from 'react-icons/md';

// Custom components
import { HSeparator } from 'components/separator/Separator';
import { useOrganization } from 'contexts/OrganizationContext';
import { useLanguage } from 'contexts/LanguageContext';

export function SidebarBrand() {
	const textColor = useColorModeValue('navy.700', 'white');
	const subTextColor = useColorModeValue('gray.500', 'gray.400');
	const brandColor = useColorModeValue('brand.500', 'brand.400');
	const selectBg = useColorModeValue('gray.50', 'whiteAlpha.100');
	const { orgSettings, subTeams, activeSubTeamId, setActiveSubTeamId } = useOrganization();
	const { t } = useLanguage();

	return (
		<Flex alignItems='center' flexDirection='column' px='16px' w='100%'>
			{orgSettings.logoUrl ? (
				<Image
					src={orgSettings.logoUrl}
					alt={orgSettings.organizationName}
					maxW='160px'
					maxH='56px'
					objectFit='contain'
					mt='28px'
					mb='16px'
				/>
			) : (
				<Flex
					align='center'
					gap='10px'
					mt='28px'
					mb='16px'
					justify='center'
					textAlign='center'
				>
					<Flex
						w='38px'
						h='38px'
						borderRadius='12px'
						bg={brandColor}
						align='center'
						justify='center'
						color='white'
						flexShrink={0}
					>
						<Icon as={MdDashboardCustomize as any} w='22px' h='22px' />
					</Flex>
					<Box textAlign='left'>
						<Text
							color={textColor}
							fontWeight='800'
							fontSize='lg'
							lineHeight='1.1'
							letterSpacing='-0.02em'
						>
							{orgSettings.organizationName}
						</Text>
						{orgSettings.organizationSubtitle && (
							<Text color={subTextColor} fontSize='11px' fontWeight='500' mt='2px'>
								{orgSettings.organizationSubtitle}
							</Text>
						)}
					</Box>
				</Flex>
			)}

			{subTeams.length > 0 && (
				<Box w='100%' mb='16px'>
					<Text fontSize='10px' fontWeight='700' color={subTextColor} mb='4px' textTransform='uppercase'>
						{t('Aktif Alt Takım / Çalışma Alanı', 'Active Sub-Team / Workspace')}
					</Text>
					<Select
						size='sm'
						borderRadius='10px'
						bg={selectBg}
						fontWeight='600'
						value={activeSubTeamId}
						onChange={(e) => setActiveSubTeamId(e.target.value)}
					>
						<option value='all'>{t('Tüm Şirket (Genel)', 'All Company (General)')}</option>
						{subTeams.map((team) => (
							<option key={team.id} value={team.id}>
								{team.name}
							</option>
						))}
					</Select>
				</Box>
			)}

			<HSeparator mb='20px' />
		</Flex>
	);
}

export default SidebarBrand;

/* eslint-disable */

import { Flex, Link, List, ListItem, Text, useColorModeValue } from '@chakra-ui/react';
import { useOrganization } from 'contexts/OrganizationContext';

export default function Footer() {
	let textColor = useColorModeValue('gray.400', 'white');
	let linkColor = useColorModeValue({ base: 'gray.400', lg: 'white' }, 'white');
	const { orgSettings } = useOrganization();

	return (
		<Flex
			zIndex='3'
			flexDirection={{
				base: 'column',
				lg: 'row'
			}}
			alignItems={{
				base: 'center',
				xl: 'start'
			}}
			justifyContent='space-between'
			px={{ base: '30px', md: '0px' }}
			pb='30px'>
			<Text
				color={textColor}
				textAlign={{
					base: 'center',
					xl: 'start'
				}}
				mb={{ base: '20px', lg: '0px' }}>
				&copy; {new Date().getFullYear()}
				<Text as='span' fontWeight='500' ms='4px'>
					{orgSettings.footerText || orgSettings.organizationName}
				</Text>
			</Text>
			{orgSettings.supportEmail && (
				<List display='flex'>
					<ListItem>
						<Link fontWeight='500' color={linkColor} href={`mailto:${orgSettings.supportEmail}`}>
							Destek
						</Link>
					</ListItem>
				</List>
			)}
		</Flex>
	);
}

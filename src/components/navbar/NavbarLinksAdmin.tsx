// Chakra Imports
import {
	Avatar,
	Button,
	Flex,
	Icon,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	Text,
	useColorModeValue,
	useColorMode
} from '@chakra-ui/react';
// Custom Components
import { SearchBar } from 'components/navbar/searchBar/SearchBar';
import { SidebarResponsive } from 'components/sidebar/Sidebar';
import PropTypes from 'prop-types';
import React from 'react';
import { IoMdMoon, IoMdSunny } from 'react-icons/io';
import routes from 'routes';
import { useAuth } from 'contexts/AuthContext';
import { useLanguage } from 'contexts/LanguageContext';
import LanguageSwitcher from 'components/navbar/LanguageSwitcher';
import { useNavigate } from 'react-router-dom';

export default function HeaderLinks(props: { secondary: boolean }) {
	const { user, signOut, userName, userSurname, isSuperAdmin } = useAuth();
	const { t } = useLanguage();
	const { secondary } = props;
	const { colorMode, toggleColorMode } = useColorMode();
	const navigate = useNavigate();

	const fullName = `${userName ?? ''} ${userSurname ?? ''}`.trim() || user?.displayName || t('Kullanıcı', 'User');

	// Chakra Color Mode
	const navbarIcon = useColorModeValue('gray.400', 'white');
	let menuBg = useColorModeValue('white', 'navy.800');
	const textColor = useColorModeValue('secondaryGray.900', 'white');
	const borderColor = useColorModeValue('#E6ECFA', 'rgba(135, 140, 189, 0.3)');
	const shadow = useColorModeValue(
		'14px 17px 40px 4px rgba(112, 144, 176, 0.18)',
		'14px 17px 40px 4px rgba(112, 144, 176, 0.06)'
	);

	return (
		<Flex
			w={{ sm: '100%', md: 'auto' }}
			alignItems='center'
			flexDirection='row'
			bg={menuBg}
			flexWrap={secondary ? { base: 'wrap', md: 'nowrap' } : 'unset'}
			p='10px'
			gap='6px'
			borderRadius='30px'
			boxShadow={shadow}>
			<SearchBar
				mb={() => {
					if (secondary) {
						return { base: '10px', md: 'unset' };
					}
					return 'unset';
				}}
				me='6px'
				borderRadius='30px'
			/>
			<SidebarResponsive routes={routes} />
			<LanguageSwitcher size='xs' />

			<Button
				variant='no-hover'
				bg='transparent'
				p='0px'
				minW='unset'
				minH='unset'
				h='18px'
				w='max-content'
				onClick={toggleColorMode}>
				<Icon
					me='10px'
					h='18px'
					w='18px'
					color={navbarIcon}
					as={(colorMode === 'light' ? IoMdMoon : IoMdSunny) as any}
				/>
			</Button>
			<Menu>
				<MenuButton p='0px'>
					<Avatar
						_hover={{ cursor: 'pointer' }}
						color='white'
						name={fullName}
						src={user?.photoURL || undefined}
						bg='#11047A'
						size='sm'
						w='40px'
						h='40px'
					/>
				</MenuButton>
				<MenuList boxShadow={shadow} p='0px' mt='10px' borderRadius='20px' bg={menuBg} border='none'>
					<Flex w='100%' mb='0px'>
						<Text
							ps='20px'
							pt='16px'
							pb='10px'
							w='100%'
							borderBottom='1px solid'
							borderColor={borderColor}
							fontSize='sm'
							fontWeight='700'
							color={textColor}>
							👋&nbsp; {t('Merhaba', 'Hello')}, {userName || fullName.split(' ')[0]}
						</Text>
					</Flex>
					<Flex flexDirection='column' p='10px'>
						<MenuItem
							_hover={{ bg: 'none' }}
							_focus={{ bg: 'none' }}
							borderRadius='8px'
							px='14px'
							onClick={() => navigate('/admin/profile')}>
							<Text fontSize='sm'>{t('Profil Ayarları', 'Profile Settings')}</Text>
						</MenuItem>
						{isSuperAdmin && (
							<MenuItem
								_hover={{ bg: 'none' }}
								_focus={{ bg: 'none' }}
								borderRadius='8px'
								px='14px'
								onClick={() => navigate('/admin/settings')}>
								<Text fontSize='sm'>{t('Kurum & Rol Ayarları', 'Company & Role Settings')}</Text>
							</MenuItem>
						)}
						<MenuItem
							_hover={{ bg: 'none' }}
							_focus={{ bg: 'none' }}
							color='red.400'
							borderRadius='8px'
							px='14px'
							onClick={signOut}>
							<Text fontSize='sm'>{t('Çıkış Yap', 'Sign Out')}</Text>
						</MenuItem>
					</Flex>
				</MenuList>
			</Menu>
		</Flex>
	);
}

HeaderLinks.propTypes = {
	variant: PropTypes.string,
	fixed: PropTypes.bool,
	secondary: PropTypes.bool,
	onOpen: PropTypes.func
};

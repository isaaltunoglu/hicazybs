import { Icon } from '@chakra-ui/react';
import {
  MdDashboard,
  MdInventory,
  MdCategory,
  MdPersonAdd,
  MdPerson,
  MdAssignment,
  MdAnnouncement,
  MdAccessTime,
  MdLink,
  MdSettings,
  MdBusiness,
} from 'react-icons/md';

// Views
import Dashboard from 'views/admin/dashboard';
import Inventory from 'views/admin/inventory';
import Categories from 'views/admin/categories';
import UserApprovals from 'views/admin/userApprovals';
import Departments from 'views/admin/departments';
import Profile from 'views/admin/profile';
import Missions from 'views/admin/missions';
import Announcements from 'views/admin/announcements';
import WorkshopDashboard from 'views/admin/workshop';
import LinksPage from 'views/admin/links';
import OrganizationSettingsView from 'views/admin/settings';

// requiredRole: 'all' = everyone, 'superAdmin' = isSuperAdmin only, string[] = role list
const routes = [
  {
    name: 'Panel',
    layout: '/admin',
    path: '/default',
    icon: <Icon as={MdDashboard as any} width="20px" height="20px" color="inherit" />,
    component: <Dashboard />,
    requiredRole: 'all',
  },
  {
    name: 'Görevler',
    layout: '/admin',
    path: '/missions',
    icon: <Icon as={MdAssignment as any} width="20px" height="20px" color="inherit" />,
    component: <Missions />,
    requiredRole: 'all',
  },
  {
    name: 'Envanter',
    layout: '/admin',
    path: '/inventory',
    icon: <Icon as={MdInventory as any} width="20px" height="20px" color="inherit" />,
    component: <Inventory />,
    requiredRole: 'all',
  },
  {
    name: 'Kategoriler',
    layout: '/admin',
    path: '/categories',
    icon: <Icon as={MdCategory as any} width="20px" height="20px" color="inherit" />,
    component: <Categories />,
    requiredRole: 'all',
  },
  {
    name: 'Duyurular',
    layout: '/admin',
    path: '/announcements',
    icon: <Icon as={MdAnnouncement as any} width="20px" height="20px" color="inherit" />,
    component: <Announcements />,
    requiredRole: 'all',
  },
  {
    name: 'Mesai / Alan Takip',
    layout: '/admin',
    path: '/workshop',
    icon: <Icon as={MdAccessTime as any} width="20px" height="20px" color="inherit" />,
    component: <WorkshopDashboard />,
    requiredRole: 'all',
  },
  {
    name: 'Bağlantılar',
    layout: '/admin',
    path: '/links',
    icon: <Icon as={MdLink as any} width="20px" height="20px" color="inherit" />,
    component: <LinksPage />,
    requiredRole: 'all',
  },
  {
    name: 'Çalışan & Davetler',
    layout: '/admin',
    path: '/user-approvals',
    icon: <Icon as={MdPersonAdd as any} width="20px" height="20px" color="inherit" />,
    component: <UserApprovals />,
    requiredRole: 'manager',
  },
  {
    name: 'Departman Yönetimi',
    layout: '/admin',
    path: '/departments',
    icon: <Icon as={MdBusiness as any} width="20px" height="20px" color="inherit" />,
    component: <Departments />,
    requiredRole: 'superAdmin',
  },
  {
    name: 'Kurum & Rol Ayarları',
    layout: '/admin',
    path: '/settings',
    icon: <Icon as={MdSettings as any} width="20px" height="20px" color="inherit" />,
    component: <OrganizationSettingsView />,
    requiredRole: 'superAdmin',
  },
  {
    name: 'Profil',
    layout: '/admin',
    path: '/profile',
    icon: <Icon as={MdPerson as any} width="20px" height="20px" color="inherit" />,
    component: <Profile />,
    requiredRole: 'all',
  },
];

export default routes;

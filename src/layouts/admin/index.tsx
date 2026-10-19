// Chakra imports
import { Portal, Box, useDisclosure } from '@chakra-ui/react';
import Footer from 'components/footer/FooterAdmin';
// Layout components
import Navbar from 'components/navbar/NavbarAdmin';
import Sidebar from 'components/sidebar/Sidebar';
import { SidebarContext } from 'contexts/SidebarContext';
import { useAuth } from 'contexts/AuthContext';
import { useOrganization } from 'contexts/OrganizationContext';
import { useLanguage } from 'contexts/LanguageContext';
import { useState, useMemo } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import routes from 'routes';
import WorkshopScan from 'views/admin/workshop/scan';

const ROUTE_NAME_EN: Record<string, string> = {
  'Panel': 'Dashboard',
  'Görevler': 'Tasks & Missions',
  'Envanter': 'Inventory',
  'Kategoriler': 'Categories',
  'Duyurular': 'Announcements',
  'Mesai / Alan Takip': 'Attendance & Area',
  'Bağlantılar': 'Team Links',
  'Çalışan & Davetler': 'Employees & Invites',
  'Departman Yönetimi': 'Departments',
  'Kurum & Rol Ayarları': 'Company & Roles',
  'Profil': 'Profile',
};

// Custom Chakra theme
export default function Dashboard(props: { [x: string]: any }) {
  const { ...rest } = props;
  // states and functions
  const [fixed] = useState(false);
  const [toggleSidebar, setToggleSidebar] = useState(false);
  const { role, isSuperAdmin, isManager } = useAuth();
  const { orgSettings } = useOrganization();
  const { language, t } = useLanguage();

  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => {
      if (!route.requiredRole || route.requiredRole === 'all') return true;
      if (route.requiredRole === 'superAdmin') return isSuperAdmin;
      if (route.requiredRole === 'manager') return isManager || isSuperAdmin;
      if (Array.isArray(route.requiredRole)) {
        return isSuperAdmin || (role && route.requiredRole.includes(role));
      }
      return true;
    });
  }, [role, isSuperAdmin, isManager]);

  // functions for changing the states from components
  const getRoute = () => {
    return window.location.pathname !== '/admin/full-screen-maps';
  };
  const getActiveRoute = (routes: RoutesType[]): string => {
    let activeRoute = orgSettings.organizationName || t('Yönetim Paneli', 'Admin Dashboard');
    for (let i = 0; i < routes.length; i++) {
      if (
        window.location.href.indexOf(routes[i].layout + routes[i].path) !== -1
      ) {
        const name = routes[i].name;
        return language === 'en' ? ROUTE_NAME_EN[name] || name : name;
      }
    }
    return activeRoute;
  };
  const getActiveNavbar = (routes: RoutesType[]): boolean => {
    let activeNavbar = false;
    for (let i = 0; i < routes.length; i++) {
      if (
        window.location.href.indexOf(routes[i].layout + routes[i].path) !== -1
      ) {
        return routes[i].secondary;
      }
    }
    return activeNavbar;
  };
  const getActiveNavbarText = (routes: RoutesType[]): string | boolean => {
    let activeNavbar = false;
    for (let i = 0; i < routes.length; i++) {
      if (
        window.location.href.indexOf(routes[i].layout + routes[i].path) !== -1
      ) {
        const name = routes[i].name;
        return language === 'en' ? ROUTE_NAME_EN[name] || name : name;
      }
    }
    return activeNavbar;
  };
  const getRoutes = (routes: RoutesType[]): any => {
    return routes.map((route: RoutesType, key: any) => {
      if (route.layout === '/admin') {
        return (
          <Route path={`${route.path}`} element={route.component} key={key} />
        );
      } else {
        return null;
      }
    });
  };
  document.documentElement.dir = 'ltr';
  const { onOpen } = useDisclosure();
  return (
    <Box>
      <SidebarContext.Provider
        value={{
          toggleSidebar,
          setToggleSidebar,
        }}
      >
        <Sidebar routes={filteredRoutes} display="none" {...rest} />
        <Box
          float="right"
          minHeight="100vh"
          height="100%"
          overflow="auto"
          position="relative"
          maxHeight="100%"
          w={{ base: '100%', xl: 'calc( 100% - 290px )' }}
          maxWidth={{ base: '100%', xl: 'calc( 100% - 290px )' }}
          transition="all 0.33s cubic-bezier(0.685, 0.0473, 0.346, 1)"
          transitionDuration=".2s, .2s, .35s"
          transitionProperty="top, bottom, width"
          transitionTimingFunction="linear, linear, ease"
        >
          <Portal>
            <Box>
              <Navbar
                onOpen={onOpen}
                logoText={orgSettings.organizationName}
                brandText={getActiveRoute(routes)}
                secondary={getActiveNavbar(routes)}
                message={getActiveNavbarText(routes)}
                fixed={fixed}
                {...rest}
              />
            </Box>
          </Portal>

          {getRoute() ? (
            <Box
              mx="auto"
              p={{ base: '20px', md: '30px' }}
              pe="20px"
              minH="100vh"
              pt="50px"
            >
              <Routes>
                {getRoutes(routes)}
                <Route path="/workshop/scan" element={<WorkshopScan />} />
                <Route
                  path="/"
                  element={<Navigate to="/admin/default" replace />}
                />
              </Routes>
            </Box>
          ) : null}
          <Box>
            <Footer />
          </Box>
        </Box>
      </SidebarContext.Provider>
    </Box>
  );
}

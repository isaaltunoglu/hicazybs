import './assets/css/App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/admin';
import AuthLayout from './layouts/auth';
import { ChakraProvider } from '@chakra-ui/react';
import initialTheme from './theme/theme';
import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Flex, Spinner } from '@chakra-ui/react';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading, isApproved } = useAuth();

  if (loading) {
    return (
      <Flex w="100vw" h="100vh" align="center" justify="center">
        <Spinner size="xl" color="brand.500" thickness="4px" />
      </Flex>
    );
  }

  if (!user) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  if (!isApproved) {
    return <Navigate to="/auth/onboarding" replace />;
  }

  return children;
}

export default function Main() {
  const [currentTheme, setCurrentTheme] = useState(initialTheme);
  return (
    <ChakraProvider theme={currentTheme}>
      <LanguageProvider>
        <AuthProvider>
          <OrganizationProvider>
            <Routes>
              <Route
                path="admin/*"
                element={
                  <ProtectedRoute>
                    <AdminLayout
                      theme={currentTheme}
                      setTheme={setCurrentTheme}
                    />
                  </ProtectedRoute>
                }
              />
              <Route path="auth/*" element={<AuthLayout />} />
              <Route path="/" element={<Navigate to="/admin" replace />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </OrganizationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ChakraProvider>
  );
}

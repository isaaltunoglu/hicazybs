import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { getAllRoles, resolveRolePermissions } from '../services/roleService';
import { DEMO_COMPANY, DEMO_STORAGE_KEY, isDemoModeActive, setDemoModeActive } from '../services/demoData';

const superAdminEmails = (process.env.REACT_APP_SUPERADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isApproved: boolean;
    isDemoMode: boolean;
    companyId: string | null;
    subTeamId: string | null;
    subTeamName: string | null;
    department: string | null;
    role: string | null;
    isSuperAdmin: boolean;
    isManager: boolean;
    userName: string | null;
    userSurname: string | null;
    enableDemoMode: (mode?: 'company' | 'onboarding') => void;
    refreshUserProfile: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isApproved: false,
    isDemoMode: false,
    companyId: null,
    subTeamId: null,
    subTeamName: null,
    department: null,
    role: null,
    isSuperAdmin: false,
    isManager: false,
    userName: null,
    userSurname: null,
    enableDemoMode: () => {},
    refreshUserProfile: async () => {},
    signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isApproved, setIsApproved] = useState(false);
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [subTeamId, setSubTeamId] = useState<string | null>(null);
    const [subTeamName, setSubTeamName] = useState<string | null>(null);
    const [department, setDepartment] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [isManager, setIsManager] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const [userSurname, setUserSurname] = useState<string | null>(null);

    const applyDemoState = useCallback((mode: 'company' | 'onboarding') => {
        const fakeUser = {
            uid: 'demo-user-1',
            email: 'ahmet.yilmaz@novateknoloji.com',
            displayName: 'Ahmet Yılmaz',
        } as unknown as User;

        setUser(fakeUser);
        setIsDemoMode(true);
        if (mode === 'onboarding') {
            setIsApproved(false);
            setCompanyId(null);
            setSubTeamId(null);
            setSubTeamName(null);
            setDepartment(null);
            setRole(null);
            setUserName('Ahmet');
            setUserSurname('Yılmaz');
            setIsSuperAdmin(false);
            setIsManager(false);
        } else {
            setIsApproved(true);
            setCompanyId(DEMO_COMPANY.id);
            setSubTeamId(null);
            setSubTeamName(null);
            setDepartment('Yönetim & Strateji');
            setRole('Süper Yönetici');
            setUserName('Ahmet');
            setUserSurname('Yılmaz');
            setIsSuperAdmin(true);
            setIsManager(true);
        }
        setLoading(false);
    }, []);

    const enableDemoMode = useCallback(
        (mode: 'company' | 'onboarding' = 'company') => {
            try {
                localStorage.setItem(DEMO_STORAGE_KEY, mode === 'onboarding' ? 'onboarding' : 'true');
            } catch {
                // ignore
            }
            applyDemoState(mode);
        },
        [applyDemoState]
    );

    const loadUserProfile = useCallback(async (firebaseUser: User | null) => {
        const storedDemo = (() => {
            try {
                return localStorage.getItem(DEMO_STORAGE_KEY);
            } catch {
                return null;
            }
        })();

        if (storedDemo === 'true' || storedDemo === 'onboarding') {
            applyDemoState(storedDemo === 'onboarding' ? 'onboarding' : 'company');
            return;
        }

        if (!firebaseUser) {
            setIsDemoMode(false);
            setIsApproved(false);
            setCompanyId(null);
            setSubTeamId(null);
            setSubTeamName(null);
            setDepartment(null);
            setRole(null);
            setUserName(null);
            setUserSurname(null);
            setIsSuperAdmin(false);
            setIsManager(false);
            return;
        }

        try {
            const approvedDoc = await getDoc(doc(db, 'approvedUsers', firebaseUser.uid));
            if (approvedDoc.exists()) {
                const userData = approvedDoc.data();
                const userCompanyId = userData.companyId || 'default-company';
                const rolesList = await getAllRoles(userCompanyId);

                setIsApproved(true);
                setCompanyId(userCompanyId);
                setSubTeamId(userData.subTeamId || null);
                setSubTeamName(userData.subTeamName || null);
                setDepartment(userData.department || null);

                const userRole = userData.role || 'Personel';
                setRole(userRole);
                setUserName(userData.name || '');
                setUserSurname(userData.surname || '');

                const normalizedEmail = (firebaseUser.email || '').toLowerCase();
                const isEmailAllowListed = normalizedEmail
                    ? superAdminEmails.includes(normalizedEmail)
                    : false;

                const resolved = resolveRolePermissions(userRole, rolesList, {
                    isSuperAdmin: userData.isSuperAdmin,
                    isManager: userData.isManager,
                });

                const finalSuperAdmin = resolved.isSuperAdmin || isEmailAllowListed;
                const finalManager = resolved.isManager || finalSuperAdmin;

                setIsSuperAdmin(finalSuperAdmin);
                setIsManager(finalManager);
            } else {
                setIsApproved(false);
                setCompanyId(null);
                setSubTeamId(null);
                setSubTeamName(null);
                setDepartment(null);
                setRole(null);
                setUserName(null);
                setUserSurname(null);
                setIsSuperAdmin(false);
                setIsManager(false);
            }
        } catch (err) {
            console.error('Error checking approval:', err);
            setIsApproved(false);
            setCompanyId(null);
            setSubTeamId(null);
            setSubTeamName(null);
            setDepartment(null);
            setRole(null);
            setUserName(null);
            setUserSurname(null);
            setIsSuperAdmin(false);
            setIsManager(false);
        }
    }, [applyDemoState]);

    useEffect(() => {
        const storedDemo = (() => {
            try {
                return localStorage.getItem(DEMO_STORAGE_KEY);
            } catch {
                return null;
            }
        })();
        if (storedDemo === 'true' || storedDemo === 'onboarding') {
            applyDemoState(storedDemo === 'onboarding' ? 'onboarding' : 'company');
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            await loadUserProfile(firebaseUser);
            setLoading(false);
        });
        return unsubscribe;
    }, [loadUserProfile, applyDemoState]);

    const refreshUserProfile = useCallback(async () => {
        if (isDemoModeActive()) {
            applyDemoState('company');
            return;
        }
        if (auth.currentUser) {
            await loadUserProfile(auth.currentUser);
        }
    }, [loadUserProfile, applyDemoState]);

    const signOut = async () => {
        setDemoModeActive(false);
        setIsDemoMode(false);
        try {
            await firebaseSignOut(auth);
        } catch {
            // ignore in demo mode
        }
        setUser(null);
        setIsApproved(false);
        setCompanyId(null);
        setSubTeamId(null);
        setSubTeamName(null);
        setDepartment(null);
        setRole(null);
        setUserName(null);
        setUserSurname(null);
        setIsSuperAdmin(false);
        setIsManager(false);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isApproved,
                isDemoMode,
                companyId,
                subTeamId,
                subTeamName,
                department,
                role,
                isSuperAdmin,
                isManager,
                userName,
                userSurname,
                enableDemoMode,
                refreshUserProfile,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;

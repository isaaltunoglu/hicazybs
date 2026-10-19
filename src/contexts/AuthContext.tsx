import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { getAllRoles, resolveRolePermissions } from '../services/roleService';

const superAdminEmails = (process.env.REACT_APP_SUPERADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isApproved: boolean;
    companyId: string | null;
    subTeamId: string | null;
    subTeamName: string | null;
    department: string | null;
    role: string | null;
    isSuperAdmin: boolean;
    isManager: boolean;
    userName: string | null;
    userSurname: string | null;
    refreshUserProfile: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isApproved: false,
    companyId: null,
    subTeamId: null,
    subTeamName: null,
    department: null,
    role: null,
    isSuperAdmin: false,
    isManager: false,
    userName: null,
    userSurname: null,
    refreshUserProfile: async () => {},
    signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isApproved, setIsApproved] = useState(false);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [subTeamId, setSubTeamId] = useState<string | null>(null);
    const [subTeamName, setSubTeamName] = useState<string | null>(null);
    const [department, setDepartment] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [isManager, setIsManager] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const [userSurname, setUserSurname] = useState<string | null>(null);

    const loadUserProfile = useCallback(async (firebaseUser: User | null) => {
        if (!firebaseUser) {
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
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            await loadUserProfile(firebaseUser);
            setLoading(false);
        });
        return unsubscribe;
    }, [loadUserProfile]);

    const refreshUserProfile = useCallback(async () => {
        if (auth.currentUser) {
            await loadUserProfile(auth.currentUser);
        }
    }, [loadUserProfile]);

    const signOut = async () => {
        await firebaseSignOut(auth);
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
                companyId,
                subTeamId,
                subTeamName,
                department,
                role,
                isSuperAdmin,
                isManager,
                userName,
                userSurname,
                refreshUserProfile,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;

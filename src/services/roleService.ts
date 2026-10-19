import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { isDemoModeActive } from './demoData';

export interface RoleDefinition {
    id: string;
    companyId?: string;
    name: string;
    isSuperAdmin: boolean;
    isManager: boolean;
    isDefault?: boolean;
    color?: string;
}

export type RoleFormData = Omit<RoleDefinition, 'id'>;

const ROLES_COLLECTION = 'roles';

export const DEFAULT_ROLES: RoleDefinition[] = [
    {
        id: 'default-super-admin',
        name: 'Süper Yönetici',
        isSuperAdmin: true,
        isManager: true,
        isDefault: false,
        color: 'purple',
    },
    {
        id: 'default-manager',
        name: 'Yönetici',
        isSuperAdmin: false,
        isManager: true,
        isDefault: false,
        color: 'blue',
    },
    {
        id: 'default-lead',
        name: 'Birim Sorumlusu',
        isSuperAdmin: false,
        isManager: true,
        isDefault: false,
        color: 'teal',
    },
    {
        id: 'default-member',
        name: 'Uzman / Mühendis',
        isSuperAdmin: false,
        isManager: false,
        isDefault: true,
        color: 'gray',
    },
];

// Geriye dönük uyumluluk için eski sistemdeki sabit rol isimleri
export const LEGACY_SUPER_ADMIN_ROLES = ['Super Admin', 'Süper Yönetici', 'CTO'];
export const LEGACY_MANAGER_ROLES = [
    'Super Admin',
    'Süper Yönetici',
    'CTO',
    'Yönetici',
    'Birim Sorumlusu',
    'Admin',
    'Manager',
    'Team Captain',
    'Vice Captain',
    'Captain',
];

export async function getAllRoles(companyId?: string | null): Promise<RoleDefinition[]> {
    if (isDemoModeActive()) {
        return DEFAULT_ROLES;
    }
    try {
        const q = companyId
            ? query(collection(db, ROLES_COLLECTION), where('companyId', '==', companyId))
            : query(collection(db, ROLES_COLLECTION));
        const snap = await getDocs(q);
        if (snap.empty) {
            return DEFAULT_ROLES;
        }
        const list = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<RoleDefinition, 'id'>),
        }));
        return list.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    } catch (error) {
        console.error('Error fetching roles:', error);
        return DEFAULT_ROLES;
    }
}

export async function createRole(data: RoleFormData): Promise<string> {
    const ref = await addDoc(collection(db, ROLES_COLLECTION), {
        ...data,
        createdAt: serverTimestamp(),
    });
    return ref.id;
}

export async function updateRole(id: string, data: Partial<RoleFormData>): Promise<void> {
    await updateDoc(doc(db, ROLES_COLLECTION, id), {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteRole(id: string): Promise<void> {
    await deleteDoc(doc(db, ROLES_COLLECTION, id));
}

export function resolveRolePermissions(
    roleName: string | null | undefined,
    rolesList: RoleDefinition[],
    explicitFlags?: { isSuperAdmin?: boolean; isManager?: boolean }
): { isSuperAdmin: boolean; isManager: boolean } {
    if (!roleName) {
        return {
            isSuperAdmin: !!explicitFlags?.isSuperAdmin,
            isManager: !!explicitFlags?.isManager || !!explicitFlags?.isSuperAdmin,
        };
    }

    const matched = rolesList.find((r) => r.name.toLowerCase() === roleName.toLowerCase());
    const fromRoleSuper = matched
        ? matched.isSuperAdmin
        : LEGACY_SUPER_ADMIN_ROLES.includes(roleName);
    const fromRoleManager = matched
        ? matched.isManager || matched.isSuperAdmin
        : LEGACY_MANAGER_ROLES.includes(roleName);

    const isSuperAdmin = !!explicitFlags?.isSuperAdmin || fromRoleSuper;
    const isManager = isSuperAdmin || !!explicitFlags?.isManager || fromRoleManager;

    return { isSuperAdmin, isManager };
}

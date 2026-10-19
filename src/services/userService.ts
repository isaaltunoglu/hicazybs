import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { getCurrentTenantScope, matchesTenantScope } from './tenantScope';
import { DEMO_USERS, isDemoModeActive } from './demoData';

export interface UserProfile {
    uid: string;
    name: string;
    surname: string;
    email: string;
    role: string;
    department: string;
    companyId?: string;
    subTeamId?: string;
    subTeamName?: string;
}

export const getAllApprovedUsers = async (): Promise<UserProfile[]> => {
    if (isDemoModeActive()) {
        return DEMO_USERS.filter((u) => matchesTenantScope(u));
    }
    try {
        const scope = getCurrentTenantScope();
        const q = query(collection(db, 'approvedUsers'), orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        const users: UserProfile[] = [];
        querySnapshot.forEach((d) => {
            const data = d.data();
            const docCompany = data.companyId || 'default-company';
            if (docCompany !== (scope.companyId || 'default-company')) return;
            if (
                scope.subTeamId &&
                scope.subTeamId !== 'all' &&
                data.subTeamId &&
                data.subTeamId !== scope.subTeamId
            ) {
                return;
            }
            users.push({ ...data, uid: d.id } as UserProfile);
        });
        return users;
    } catch (error) {
        console.error('Error getting users: ', error);
        return [];
    }
};

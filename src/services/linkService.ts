import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { getCurrentTenantScope, matchesTenantScope } from './tenantScope';
import { DEMO_LINKS, isDemoModeActive } from './demoData';

export interface TeamLink {
    id: string;
    companyId?: string;
    subTeamId?: string;
    title: string;
    url: string;
    description: string;
    category: string;
    createdBy: string;
    createdByUid: string;
    createdAt: Timestamp | null;
}

export interface TeamLinkFormData {
    title: string;
    url: string;
    description: string;
    category: string;
}

export async function getAllLinks(): Promise<TeamLink[]> {
    if (isDemoModeActive()) {
        return DEMO_LINKS.filter((l) => matchesTenantScope(l));
    }
    const snap = await getDocs(collection(db, 'teamLinks'));
    const links = snap.docs
        .filter((d) => matchesTenantScope(d.data()))
        .map((d) => ({ id: d.id, ...d.data() } as TeamLink));
    return links.sort((a, b) => {
        const aTime = a.createdAt?.toMillis() ?? 0;
        const bTime = b.createdAt?.toMillis() ?? 0;
        return bTime - aTime;
    });
}

export async function createLink(
    data: TeamLinkFormData,
    createdBy: string,
    createdByUid: string
): Promise<void> {
    const scope = getCurrentTenantScope();
    await addDoc(collection(db, 'teamLinks'), {
        ...data,
        companyId: scope.companyId,
        subTeamId: scope.subTeamId === 'all' ? '' : scope.subTeamId,
        createdBy,
        createdByUid,
        createdAt: serverTimestamp(),
    });
}

export async function deleteLink(id: string): Promise<void> {
    await deleteDoc(doc(db, 'teamLinks', id));
}

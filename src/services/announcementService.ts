import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    query,
    orderBy,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { getCurrentTenantScope, matchesTenantScope } from './tenantScope';

export interface Announcement {
    id: string;
    companyId?: string;
    subTeamId?: string;
    title: string;
    imageUrl: string;
    content: string;
    createdBy: string;
    createdByUid: string;
    createdAt: Timestamp | null;
}

export interface AnnouncementFormData {
    title: string;
    imageUrl: string;
    content: string;
}

export async function getAllAnnouncements(): Promise<Announcement[]> {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs
        .filter((d) => matchesTenantScope(d.data()))
        .map((d) => ({
            id: d.id,
            ...d.data(),
        })) as Announcement[];
}

export async function getLatestAnnouncements(count: number = 3): Promise<Announcement[]> {
    const all = await getAllAnnouncements();
    return all.slice(0, count);
}

export async function createAnnouncement(
    data: AnnouncementFormData,
    createdBy: string,
    createdByUid: string
): Promise<void> {
    const scope = getCurrentTenantScope();
    await addDoc(collection(db, 'announcements'), {
        ...data,
        companyId: scope.companyId,
        subTeamId: scope.subTeamId === 'all' ? '' : scope.subTeamId,
        createdBy,
        createdByUid,
        createdAt: serverTimestamp(),
    });
}

export async function deleteAnnouncement(id: string): Promise<void> {
    await deleteDoc(doc(db, 'announcements', id));
}

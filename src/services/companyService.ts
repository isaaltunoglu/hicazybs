import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { DEMO_COMPANY, DEMO_SUB_TEAMS, isDemoModeActive } from './demoData';

export interface Company {
    id: string;
    name: string;
    subtitle: string;
    logoUrl: string;
    workspaceLabel: string;
    footerText: string;
    supportEmail: string;
    ownerUid: string;
    createdAt?: any;
}

export interface SubTeam {
    id: string;
    companyId: string;
    name: string;
    description: string;
    qrSecret: string;
    lat: number;
    lng: number;
    radius: number;
    maxSessionHours: number;
    createdAt?: any;
}

export function generateRandomCode(prefix = 'QR', length = 10): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const randomPart = Array.from({ length }, () =>
        chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    return `${prefix}_${randomPart}`;
}

export async function createCompany(data: {
    name: string;
    subtitle?: string;
    logoUrl?: string;
    workspaceLabel?: string;
    ownerUid: string;
    initialSubTeamName?: string;
}): Promise<{ company: Company; initialSubTeam?: SubTeam }> {
    const companyRef = doc(collection(db, 'companies'));
    const company: Company = {
        id: companyRef.id,
        name: data.name.trim(),
        subtitle: (data.subtitle || 'Yönetim Bilişim Sistemi').trim(),
        logoUrl: (data.logoUrl || '').trim(),
        workspaceLabel: (data.workspaceLabel || 'Çalışma Alanı').trim(),
        footerText: data.name.trim(),
        supportEmail: '',
        ownerUid: data.ownerUid,
        createdAt: serverTimestamp(),
    };

    await setDoc(companyRef, company);

    let initialSubTeam: SubTeam | undefined;
    if (data.initialSubTeamName && data.initialSubTeamName.trim()) {
        initialSubTeam = await createSubTeam({
            companyId: companyRef.id,
            name: data.initialSubTeamName.trim(),
            description: 'Varsayılan çalışma alanı / alt takım',
        });
    }

    return { company, initialSubTeam };
}

export async function getCompanyById(companyId: string): Promise<Company | null> {
    if (!companyId) return null;
    if (isDemoModeActive()) return DEMO_COMPANY;
    try {
        const snap = await getDoc(doc(db, 'companies', companyId));
        if (snap.exists()) {
            return { id: snap.id, ...(snap.data() as Omit<Company, 'id'>) };
        }
        return null;
    } catch (err) {
        console.error('Error getting company:', err);
        return null;
    }
}

export async function updateCompany(
    companyId: string,
    data: Partial<Omit<Company, 'id' | 'ownerUid'>>
): Promise<void> {
    if (isDemoModeActive()) return;
    await setDoc(doc(db, 'companies', companyId), data, { merge: true });
}

// --- SUB-TEAMS / WORKSPACES ---

export async function getSubTeamsByCompany(companyId: string): Promise<SubTeam[]> {
    if (!companyId) return [];
    if (isDemoModeActive()) return DEMO_SUB_TEAMS;
    try {
        const q = query(collection(db, 'subTeams'), where('companyId', '==', companyId));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SubTeam, 'id'>) }));
        return list.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    } catch (err) {
        console.error('Error getting subTeams:', err);
        return [];
    }
}

export async function createSubTeam(data: {
    companyId: string;
    name: string;
    description?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    maxSessionHours?: number;
}): Promise<SubTeam> {
    const newTeam = {
        companyId: data.companyId,
        name: data.name.trim(),
        description: (data.description || '').trim(),
        qrSecret: generateRandomCode('AREA', 12),
        lat: data.lat ?? 41.0082,
        lng: data.lng ?? 28.9784,
        radius: data.radius ?? 200,
        maxSessionHours: data.maxSessionHours ?? 8,
        createdAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, 'subTeams'), newTeam);
    return { id: ref.id, ...newTeam };
}

export async function updateSubTeam(
    subTeamId: string,
    data: Partial<Omit<SubTeam, 'id' | 'companyId'>>
): Promise<void> {
    await updateDoc(doc(db, 'subTeams', subTeamId), data);
}

export async function deleteSubTeam(subTeamId: string): Promise<void> {
    await deleteDoc(doc(db, 'subTeams', subTeamId));
}

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { DEMO_INVITATIONS, isDemoModeActive } from './demoData';

export interface Invitation {
    key: string;
    companyId: string;
    companyName: string;
    companyLogoUrl?: string;
    subTeamId?: string;
    subTeamName?: string;
    email: string;
    invitedName?: string;
    invitedSurname?: string;
    department: string;
    role: string;
    isSuperAdmin: boolean;
    isManager: boolean;
    status: 'pending' | 'accepted' | 'revoked';
    createdBy: string;
    createdByUid: string;
    createdAt?: any;
    acceptedByUid?: string;
    acceptedAt?: any;
}

export function generateInviteKey(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `INV-${part1}-${part2}`;
}

export async function createInvitation(data: {
    companyId: string;
    companyName: string;
    companyLogoUrl?: string;
    subTeamId?: string;
    subTeamName?: string;
    email: string;
    invitedName?: string;
    invitedSurname?: string;
    department: string;
    role: string;
    isSuperAdmin: boolean;
    isManager: boolean;
    createdBy: string;
    createdByUid: string;
}): Promise<Invitation> {
    const key = generateInviteKey();
    const invitation: Invitation = {
        key,
        companyId: data.companyId,
        companyName: data.companyName,
        companyLogoUrl: data.companyLogoUrl || '',
        subTeamId: data.subTeamId || '',
        subTeamName: data.subTeamName || '',
        email: data.email.trim().toLowerCase(),
        invitedName: (data.invitedName || '').trim(),
        invitedSurname: (data.invitedSurname || '').trim(),
        department: (data.department || 'Genel').trim(),
        role: data.role,
        isSuperAdmin: data.isSuperAdmin,
        isManager: data.isManager,
        status: 'pending',
        createdBy: data.createdBy,
        createdByUid: data.createdByUid,
        createdAt: serverTimestamp(),
    };

    if (isDemoModeActive()) {
        DEMO_INVITATIONS.unshift(invitation);
        return invitation;
    }

    await setDoc(doc(db, 'invitations', key), invitation);
    return invitation;
}

export async function getInvitationByKey(rawKey: string): Promise<Invitation | null> {
    const cleanKey = rawKey.trim().toUpperCase();
    if (!cleanKey) return null;
    const demoMatch = DEMO_INVITATIONS.find((i) => i.key === cleanKey);
    if (demoMatch) return demoMatch;
    if (isDemoModeActive()) return DEMO_INVITATIONS[0] || null;
    try {
        const snap = await getDoc(doc(db, 'invitations', cleanKey));
        if (snap.exists()) {
            return snap.data() as Invitation;
        }
        return null;
    } catch (err) {
        console.error('Error getting invitation by key:', err);
        return null;
    }
}

export async function getCompanyInvitations(companyId: string): Promise<Invitation[]> {
    if (!companyId) return [];
    if (isDemoModeActive()) return [...DEMO_INVITATIONS];
    try {
        const q = query(collection(db, 'invitations'), where('companyId', '==', companyId));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => d.data() as Invitation);
        return list.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() ?? 0;
            const bTime = b.createdAt?.toMillis?.() ?? 0;
            return bTime - aTime;
        });
    } catch (err) {
        console.error('Error getting company invitations:', err);
        return [];
    }
}

export async function markInvitationAccepted(key: string, acceptedByUid: string): Promise<void> {
    const cleanKey = key.trim().toUpperCase();
    await updateDoc(doc(db, 'invitations', cleanKey), {
        status: 'accepted',
        acceptedByUid,
        acceptedAt: serverTimestamp(),
    });
}

export async function deleteInvitation(key: string): Promise<void> {
    const cleanKey = key.trim().toUpperCase();
    await deleteDoc(doc(db, 'invitations', cleanKey));
}

export function buildInviteUrl(key: string): string {
    return `${window.location.origin}/auth/invite?key=${encodeURIComponent(key)}`;
}

export function buildInviteMailtoUrl(invitation: Invitation): string {
    const inviteUrl = buildInviteUrl(invitation.key);
    const subject = `${invitation.companyName} - Yönetim Bilişim Sistemi Davetiyesi`;
    const subTeamLine = invitation.subTeamName
        ? `\nAlt Takım / Çalışma Alanı: ${invitation.subTeamName}`
        : '';
    const body =
        `Merhaba${invitation.invitedName ? ' ' + invitation.invitedName : ''},\n\n` +
        `${invitation.companyName} organizasyonuna katılmanız için davet edildiniz.\n` +
        `Rolünüz: ${invitation.role}\n` +
        `Departman: ${invitation.department}${subTeamLine}\n\n` +
        `Kişiye Özel Davet Anahtarınız (Key): ${invitation.key}\n\n` +
        `Size özel kayıt ekranından doğrudan şirkete katılmak için aşağıdaki bağlantıya tıklayın:\n` +
        `${inviteUrl}\n\n` +
        `(Alternatif olarak sisteme giriş yaptıktan sonra "Şirkete Katıl" ekranında davet anahtarınızı girebilirsiniz.)`;

    return `mailto:${encodeURIComponent(invitation.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

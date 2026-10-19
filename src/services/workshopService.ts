import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    getDoc,
    setDoc,
    query,
    where,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { getCurrentTenantScope, matchesTenantScope } from './tenantScope';
import { DEMO_SESSIONS, isDemoModeActive } from './demoData';

// --- TYPES ---

export interface WorkshopSession {
    id: string;
    companyId?: string;
    subTeamId?: string;
    uid: string;
    userName: string;
    checkIn: Timestamp;
    checkOut: Timestamp | null;
    duration: number | null; // minutes
    status: 'active' | 'completed' | 'expired';
    date: string; // YYYY-MM-DD
}

export interface WorkshopSettings {
    maxSessionHours: number;
    qrSecret: string;
    workshopLat: number;
    workshopLng: number;
    workshopRadius: number; // metres
}

// --- SETTINGS ---

const DEFAULT_SETTINGS: WorkshopSettings = {
    maxSessionHours: 8,
    qrSecret: 'YBS_MESAI_QR_2026',
    workshopLat: 41.0082,
    workshopLng: 28.9784,
    workshopRadius: 200,
};

function getSettingsDocId(): string {
    const scope = getCurrentTenantScope();
    const companyPart = scope.companyId || 'default-company';
    if (companyPart === 'default-company' && (!scope.subTeamId || scope.subTeamId === 'all')) {
        return 'config';
    }
    const subTeamPart = scope.subTeamId && scope.subTeamId !== 'all' ? `_${scope.subTeamId}` : '';
    return `${companyPart}${subTeamPart}`;
}

export async function getWorkshopSettings(): Promise<WorkshopSettings> {
    if (isDemoModeActive()) {
        return DEFAULT_SETTINGS;
    }
    const docId = getSettingsDocId();
    const ref = doc(db, 'workshopSettings', docId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
        return snap.data() as WorkshopSettings;
    }
    const scope = getCurrentTenantScope();
    const customDefault: WorkshopSettings = {
        ...DEFAULT_SETTINGS,
        qrSecret:
            docId === 'config'
                ? DEFAULT_SETTINGS.qrSecret
                : `QR_${docId.slice(0, 8).toUpperCase()}`,
    };
    await setDoc(ref, {
        ...customDefault,
        companyId: scope.companyId,
        subTeamId: scope.subTeamId === 'all' ? '' : scope.subTeamId,
    });
    return customDefault;
}

export async function updateWorkshopSettings(settings: Partial<WorkshopSettings>): Promise<void> {
    if (isDemoModeActive()) return;
    const docId = getSettingsDocId();
    const scope = getCurrentTenantScope();
    const ref = doc(db, 'workshopSettings', docId);
    await setDoc(
        ref,
        {
            ...settings,
            companyId: scope.companyId,
            subTeamId: scope.subTeamId === 'all' ? '' : scope.subTeamId,
        },
        { merge: true }
    );
}

// --- SESSIONS ---

export async function getUserActiveSession(uid: string): Promise<WorkshopSession | null> {
    if (isDemoModeActive()) {
        return DEMO_SESSIONS.find((s) => s.uid === uid && s.status === 'active' && matchesTenantScope(s)) || null;
    }
    const q = query(
        collection(db, 'workshopSessions'),
        where('uid', '==', uid),
        where('status', '==', 'active')
    );
    const snap = await getDocs(q);
    const matching = snap.docs.find((d) => matchesTenantScope(d.data()));
    if (!matching) return null;
    return { id: matching.id, ...matching.data() } as WorkshopSession;
}

export async function checkIn(uid: string, userName: string): Promise<string> {
    const scope = getCurrentTenantScope();
    const today = new Date().toISOString().split('T')[0];
    if (isDemoModeActive()) {
        return 'demo-session-new';
    }
    const ref = await addDoc(collection(db, 'workshopSessions'), {
        companyId: scope.companyId,
        subTeamId: scope.subTeamId === 'all' ? '' : scope.subTeamId,
        uid,
        userName,
        checkIn: serverTimestamp(),
        checkOut: null,
        duration: null,
        status: 'active',
        date: today,
    });
    return ref.id;
}

export async function checkOut(sessionId: string, checkInTime: Timestamp): Promise<number> {
    const now = new Date();
    const checkInDate = checkInTime.toDate();
    const durationMinutes = Math.round((now.getTime() - checkInDate.getTime()) / 60000);
    if (isDemoModeActive()) {
        return durationMinutes;
    }

    await updateDoc(doc(db, 'workshopSessions', sessionId), {
        checkOut: serverTimestamp(),
        duration: durationMinutes,
        status: 'completed',
    });
    return durationMinutes;
}

export async function expireSession(sessionId: string): Promise<void> {
    if (isDemoModeActive()) return;
    await updateDoc(doc(db, 'workshopSessions', sessionId), {
        status: 'expired',
        duration: 0,
    });
}

export async function getActiveSessions(): Promise<WorkshopSession[]> {
    if (isDemoModeActive()) {
        return DEMO_SESSIONS.filter((s) => s.status === 'active' && matchesTenantScope(s));
    }
    const q = query(
        collection(db, 'workshopSessions'),
        where('status', '==', 'active')
    );
    const snap = await getDocs(q);
    const sessions = snap.docs
        .filter((d) => matchesTenantScope(d.data()))
        .map((d) => ({ id: d.id, ...d.data() } as WorkshopSession));
    return sessions.sort((a, b) => b.checkIn.toMillis() - a.checkIn.toMillis());
}

export async function getAllCompletedSessions(): Promise<WorkshopSession[]> {
    if (isDemoModeActive()) {
        return DEMO_SESSIONS.filter((s) => s.status === 'completed' && matchesTenantScope(s));
    }
    const q = query(
        collection(db, 'workshopSessions'),
        where('status', '==', 'completed')
    );
    const snap = await getDocs(q);
    const sessions = snap.docs
        .filter((d) => matchesTenantScope(d.data()))
        .map((d) => ({ id: d.id, ...d.data() } as WorkshopSession));
    return sessions.sort((a, b) => b.checkIn.toMillis() - a.checkIn.toMillis());
}

export async function getLast7DaysSessions(): Promise<WorkshopSession[]> {
    if (isDemoModeActive()) {
        return DEMO_SESSIONS.filter((s) => s.status === 'completed' && matchesTenantScope(s));
    }
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const dateStr = sevenDaysAgo.toISOString().split('T')[0];

    const q = query(
        collection(db, 'workshopSessions'),
        where('date', '>=', dateStr)
    );
    const snap = await getDocs(q);
    const sessions = snap.docs
        .filter((d) => matchesTenantScope(d.data()))
        .map((d) => ({ id: d.id, ...d.data() } as WorkshopSession));
    return sessions
        .filter((s) => s.status === 'completed')
        .sort((a, b) => a.date.localeCompare(b.date));
}

// --- HELPERS ---

export function getDistanceMetres(
    lat1: number, lng1: number,
    lat2: number, lng2: number
): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h} saat ${m > 0 ? m + ' dk' : ''}`.trim();
    return `${m} dk`;
}

export function getLeaderboard(sessions: WorkshopSession[]): { uid: string; userName: string; totalMinutes: number }[] {
    const map: Record<string, { userName: string; totalMinutes: number }> = {};
    for (const s of sessions) {
        if (!map[s.uid]) map[s.uid] = { userName: s.userName, totalMinutes: 0 };
        map[s.uid].totalMinutes += s.duration ?? 0;
    }
    return Object.entries(map)
        .map(([uid, v]) => ({ uid, ...v }))
        .sort((a, b) => b.totalMinutes - a.totalMinutes);
}

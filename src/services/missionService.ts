import { Mission, MissionFormData, MissionUpdate, MissionStatus } from '../types/mission';
import { db } from '../firebase';
import {
    collection,
    getDocs,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp,
    Timestamp,
    arrayUnion,
} from 'firebase/firestore';
import { getCurrentTenantScope, matchesTenantScope } from './tenantScope';
import { DEMO_MISSIONS, isDemoModeActive } from './demoData';

const COLLECTION_NAME = 'missions';

const convertDoc = (docSnap: any): Mission => {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        deadline:
            data.deadline instanceof Timestamp
                ? data.deadline.toDate()
                : new Date(data.deadline),
        createdAt:
            data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        updatedAt:
            data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
        processUpdates: (data.processUpdates || []).map((update: any) => ({
            ...update,
            timestamp:
                update.timestamp instanceof Timestamp
                    ? update.timestamp.toDate()
                    : new Date(update.timestamp),
        })),
        status: data.status || 'Not Started',
    } as Mission;
};

export const getAllMissions = async (): Promise<Mission[]> => {
    if (isDemoModeActive()) {
        return DEMO_MISSIONS.filter((m) => matchesTenantScope(m));
    }
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const missions: Mission[] = [];
        querySnapshot.forEach((d) => {
            if (matchesTenantScope(d.data())) {
                missions.push(convertDoc(d));
            }
        });
        return missions;
    } catch (error) {
        console.error('Error getting missions: ', error);
        return [];
    }
};

export const createMission = async (data: MissionFormData): Promise<string> => {
    try {
        const scope = getCurrentTenantScope();
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...data,
            companyId: scope.companyId,
            subTeamId: scope.subTeamId === 'all' ? '' : scope.subTeamId,
            processUpdates: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating mission: ', error);
        throw error;
    }
};

export const updateMission = async (
    id: string,
    data: Partial<MissionFormData>
): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating mission: ', error);
        throw error;
    }
};

export const updateMissionStatus = async (
    id: string,
    status: MissionStatus
): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            status,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating mission status: ', error);
        throw error;
    }
};

export const addMissionUpdate = async (
    id: string,
    update: MissionUpdate
): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            processUpdates: arrayUnion({
                ...update,
                timestamp: serverTimestamp(),
            }),
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error adding mission update: ', error);
        throw error;
    }
};

export const deleteMission = async (id: string): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Error deleting mission: ', error);
        throw error;
    }
};

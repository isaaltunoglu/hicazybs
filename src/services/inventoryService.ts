import { InventoryItem, InventoryItemFormData } from '../types/inventory';
import { db } from '../firebase';
import {
    collection,
    getDocs,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { getCurrentTenantScope, matchesTenantScope } from './tenantScope';

const COLLECTION_NAME = 'inventory';

const convertDoc = (docSnap: any): InventoryItem => {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    } as InventoryItem;
};

export const getAllItems = async (): Promise<InventoryItem[]> => {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const items: InventoryItem[] = [];
        querySnapshot.forEach((d) => {
            if (matchesTenantScope(d.data())) {
                items.push(convertDoc(d));
            }
        });
        return items;
    } catch (error) {
        console.error('Error getting items: ', error);
        return [];
    }
};

export const getItemById = async (id: string): Promise<InventoryItem | null> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && matchesTenantScope(docSnap.data())) {
            return convertDoc(docSnap);
        }
        return null;
    } catch (error) {
        console.error('Error getting item: ', error);
        return null;
    }
};

export const createItem = async (data: InventoryItemFormData): Promise<string> => {
    try {
        const scope = getCurrentTenantScope();
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...data,
            companyId: scope.companyId,
            subTeamId: scope.subTeamId === 'all' ? '' : scope.subTeamId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating item: ', error);
        throw error;
    }
};

export const updateItem = async (
    id: string,
    data: Partial<InventoryItemFormData>
): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating item: ', error);
        throw error;
    }
};

export const deleteItem = async (id: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
        console.error('Error deleting item: ', error);
        throw error;
    }
};

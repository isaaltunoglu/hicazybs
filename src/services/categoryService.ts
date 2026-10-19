import { Category, CategoryFormData } from '../types/inventory';
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
} from 'firebase/firestore';
import { getCurrentTenantScope, matchesTenantScope } from './tenantScope';
import { DEMO_CATEGORIES, isDemoModeActive } from './demoData';

const COLLECTION_NAME = 'categories';

export const getAllCategories = async (): Promise<Category[]> => {
    if (isDemoModeActive()) {
        return DEMO_CATEGORIES.filter((c) => matchesTenantScope(c));
    }
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('name'));
        const querySnapshot = await getDocs(q);
        const categories: Category[] = [];
        querySnapshot.forEach((d) => {
            if (matchesTenantScope(d.data())) {
                categories.push({ id: d.id, ...d.data() } as Category);
            }
        });
        return categories;
    } catch (error) {
        console.error('Error getting categories: ', error);
        return [];
    }
};

export const createCategory = async (data: CategoryFormData): Promise<string> => {
    try {
        const scope = getCurrentTenantScope();
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...data,
            companyId: scope.companyId,
            subTeamId: scope.subTeamId === 'all' ? '' : scope.subTeamId,
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating category: ', error);
        throw error;
    }
};

export const updateCategory = async (
    id: string,
    data: Partial<CategoryFormData>
): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, { ...data });
    } catch (error) {
        console.error('Error updating category: ', error);
        throw error;
    }
};

export const deleteCategory = async (id: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
        console.error('Error deleting category: ', error);
        throw error;
    }
};

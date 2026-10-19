import { db } from '../firebase';
import {
    collection,
    getDocs,
    query,
    orderBy
} from 'firebase/firestore';

export interface Department {
    id: string;
    name: string;
}

export const getAllDepartments = async (): Promise<Department[]> => {
    try {
        const q = query(collection(db, 'departments'), orderBy('name'));
        const querySnapshot = await getDocs(q);
        const departments: Department[] = [];
        querySnapshot.forEach((doc) => {
            departments.push({ id: doc.id, name: doc.data().name });
        });
        return departments;
    } catch (error) {
        console.error("Error getting departments: ", error);
        return [];
    }
};

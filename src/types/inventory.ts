export interface InventoryItem {
    id: string;
    name: string;
    location: string;
    category: string; // category ID reference
    amount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface Category {
    id: string;
    name: string;
    color: string;
}

// Form data types (without id and timestamps)
export type InventoryItemFormData = Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>;
export type CategoryFormData = Omit<Category, 'id'>;

export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: 'expense' | 'income';
    createdAt: Date;
    updatedAt: Date;
}

export interface CategoryDTO {
    name: string;
    icon: string;
    color: string;
    type: 'expense' | 'income';
}
import { Category } from './category.model';

export type TransactionType = 'expense' | 'income';

export interface Transaction {
    id: string;
    type: TransactionType;
    amount: number;
    categoryId: string;
    category?: Category;
    accountId?: string;
    date: Date;
    note: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface TransactionDTO {
    type: TransactionType;
    amount: number;
    categoryId: string;
    accountId?: string;
    date: Date;
    note: string;
}

export interface TransactionFilter {
    startDate?: Date;
    endDate?: Date;
    categoryId?: string;
    type?: TransactionType;
    search?: string;
    minAmount?: number;
    maxAmount?: number;
    sortBy?: 'date' | 'amount' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
}

export interface MonthlySummary {
    month: number;
    year: number;
    totalIncome: number;
    totalExpense: number;
    balance: number;
    transactionCount: number;
}
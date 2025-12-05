export type AccountType = 'cash' | 'bank' | 'credit_card' | 'debit_card' | 'savings';

export interface Account {
    id: string;
    userId: string;
    name: string;
    type: AccountType;
    balance: number;
    currency: string;
    color: string;
    icon: string;
    isDefault: boolean;
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface AccountDTO {
    name: string;
    type: AccountType;
    balance?: number;
    currency?: string;
    color?: string;
    icon?: string;
    isDefault?: boolean;
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
    cash: 'Efectivo',
    bank: 'Banco',
    credit_card: 'Tarjeta de Crédito',
    debit_card: 'Tarjeta de Débito',
    savings: 'Ahorro'
};

export const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
    cash: '💵',
    bank: '🏦',
    credit_card: '💳',
    debit_card: '💳',
    savings: '🐷'
};

export const ACCOUNT_COLORS = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316', // Orange
    '#6366f1'  // Indigo
];

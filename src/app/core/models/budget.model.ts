export interface Budget {
    id: string;
    categoryId: string;
    amount: number;
    month: number;
    year: number;
    alertThreshold: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface BudgetDTO {
    categoryId: string;
    amount: number;
    month: number;
    year: number;
    alertThreshold: number;
}

export interface BudgetStatus {
    budget: Budget;
    spent: number;
    remaining: number;
    percentageUsed: number;
    isOverBudget: boolean;
    hasAlert: boolean;
}
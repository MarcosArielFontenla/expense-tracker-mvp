export interface Budget {
    id: string;
    categoryId: string;
    amount: number;
    month: number; // 1-12
    year: number;
    alertThreshold: number; // Percentage (e.g., 80 for 80%)
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
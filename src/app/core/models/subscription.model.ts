export interface PlanLimit {
    tier: 'free' | 'starter' | 'pro' | 'max';
    maxAccounts: number;
    maxCategories: number;
    maxTransactionsMonthly: number;
    maxBudgets: number;
    maxExportsMonthly: number;
    canExportCsv: boolean;
    canExportExcel: boolean;
    canExportPdf: boolean;
    auditLogRetentionDays: number;
    canExportData: boolean; // Deprecated or general flag
    hasPrioritySupport: boolean;
}

export interface SubscriptionUsage {
    transactions: number;
    accounts: number;
    categories: number;
    budgets: number;
    exports: number;
}

export interface SubscriptionStatusResponse {
    plan: 'free' | 'starter' | 'pro' | 'max';
    subStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';
    limits: PlanLimit;
    usage: SubscriptionUsage;
}
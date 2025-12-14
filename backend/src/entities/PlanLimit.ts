import { Entity, PrimaryColumn, Column } from 'typeorm';
import { PlanTier } from './User';

@Entity('plan_limits')
export class PlanLimit {
    @PrimaryColumn({
        type: 'enum',
        enum: PlanTier,
        enumName: 'plan_tier'
    })
    tier!: PlanTier;

    @Column({ name: 'max_accounts' })
    maxAccounts!: number;

    @Column({ name: 'max_categories' })
    maxCategories!: number;

    @Column({ name: 'max_transactions_monthly' })
    maxTransactionsMonthly!: number;

    @Column({ name: 'audit_log_retention_days' })
    auditLogRetentionDays!: number;

    @Column({ name: 'can_export_data', default: false })
    canExportData!: boolean;

    @Column({ name: 'has_priority_support', default: false })
    hasPrioritySupport!: boolean;

    @Column({ name: 'max_budgets', default: 1 })
    maxBudgets!: number;

    @Column({ name: 'max_exports_monthly', default: 5 })
    maxExportsMonthly!: number;

    @Column({ name: 'can_export_csv', default: true })
    canExportCsv!: boolean;

    @Column({ name: 'can_export_excel', default: false })
    canExportExcel!: boolean;

    @Column({ name: 'can_export_pdf', default: false })
    canExportPdf!: boolean;
}

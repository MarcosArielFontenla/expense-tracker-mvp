import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { User, PlanTier } from '../entities/User';
import { PlanLimit } from '../entities/PlanLimit';
import { AppError } from '../utils/AppError';
import { Transaction } from '../entities/Transaction';
import { Account } from '../entities/Account';
import { Category } from '../entities/Category';
import { Budget } from '../entities/Budget';
import { AuditLog } from '../entities/AuditLog';

export const checkPlanLimit = (resource: 'transactions' | 'accounts' | 'categories' | 'budgets' | 'exports') => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Get user ID from request (set by auth middleware)
            const userId = (req as any).userId || (req as any).user?.id || (req as any).user?.userId;

            if (!userId) {
                return next(new AppError('Unauthorized - User ID not found', 401));
            }

            const userRepository = AppDataSource.getRepository(User);
            const user = await userRepository.findOne({ where: { id: userId } });

            if (!user) {
                return next(new AppError('User not found', 404));
            }

            // Get limits for the user's plan
            const planLimitRepository = AppDataSource.getRepository(PlanLimit);
            const limits = await planLimitRepository.findOne({ where: { tier: user.plan as PlanTier } });

            if (!limits) {
                return next(new AppError('Error al procesar la configuración de los límites del plan', 500));
            }

            // Check specific resource limit
            if (resource === 'transactions') {
                const transactionRepository = AppDataSource.getRepository(Transaction);

                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

                const count = await transactionRepository
                    .createQueryBuilder('transaction')
                    .where('transaction.userId = :userId', { userId })
                    .andWhere('transaction.date >= :startOfMonth', { startOfMonth })
                    .getCount();

                if (count >= limits.maxTransactionsMonthly) {
                    return next(new AppError(`Limite de transacciones mensuales alcanzado (${limits.maxTransactionsMonthly}). Por favor, actualiza tu plan.`, 403));
                }
            } else if (resource === 'accounts') {
                const accountRepository = AppDataSource.getRepository(Account);
                const count = await accountRepository.count({ where: { userId } });

                if (count >= limits.maxAccounts) {
                    return next(new AppError(`Limite de cuentas alcanzado (${limits.maxAccounts}). Por favor, actualiza tu plan.`, 403));
                }
            } else if (resource === 'categories') {
                const categoryRepository = AppDataSource.getRepository(Category);
                const count = await categoryRepository.count({ where: { userId } });

                if (count >= limits.maxCategories) {
                    return next(new AppError(`Limite de categorias alcanzado (${limits.maxCategories}). Por favor, actualiza tu plan.`, 403));
                }
            } else if (resource === 'budgets') {
                const budgetRepository = AppDataSource.getRepository(Budget);
                const count = await budgetRepository.count({ where: { userId } });

                if (count >= limits.maxBudgets) {
                    return next(new AppError(`Limite de presupuestos alcanzado (${limits.maxBudgets}). Por favor, actualiza tu plan.`, 403));
                }
            } else if (resource === 'exports') {
                // Check monthly exports limit
                const auditRepository = AppDataSource.getRepository(AuditLog);
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

                const count = await auditRepository
                    .createQueryBuilder('audit')
                    .where('audit.userId = :userId', { userId })
                    .andWhere('audit.action LIKE :action', { action: 'EXPORT_%' })
                    .andWhere('audit.createdAt >= :startOfMonth', { startOfMonth })
                    .getCount();

                if (count >= limits.maxExportsMonthly) {
                    return next(new AppError(`Limite de exportaciones mensuales alcanzado (${limits.maxExportsMonthly}). Por favor, actualiza tu plan.`, 403));
                }
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};
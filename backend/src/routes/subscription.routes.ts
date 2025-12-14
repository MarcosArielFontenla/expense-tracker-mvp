import express, { Response } from 'express';
import { AppDataSource } from '../config/database';
import { User, PlanTier } from '../entities/User';
import { PlanLimit } from '../entities/PlanLimit';
import { Transaction } from '../entities/Transaction';
import { Account } from '../entities/Account';
import { Category } from '../entities/Category';
import { Budget } from '../entities/Budget';
import { AuditLog } from '../entities/AuditLog';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../utils/AppError';
import { SubscriptionService } from '../services/subscription.service';

const router = express.Router();

// Get subscription usage and limits
router.get('/usage', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    // Get user with plan
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.userId } });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Lazy check for trial expiration
    if (user.subStatus === 'trialing') {
        await SubscriptionService.checkTrialStatus(user.id);
        // Refresh user after check
        const updatedUser = await userRepository.findOne({ where: { id: req.userId } });
        if (updatedUser) {
            // Update local user variable if it changed
            Object.assign(user, updatedUser);
        }
    }

    // Get limits
    const planLimitRepository = AppDataSource.getRepository(PlanLimit);
    const limits = await planLimitRepository.findOne({ where: { tier: user.plan as PlanTier } });

    if (!limits) {
        throw new AppError('Plan limits not found', 500);
    }

    // Calculate usage
    const transactionRepository = AppDataSource.getRepository(Transaction);
    const accountRepository = AppDataSource.getRepository(Account);
    const categoryRepository = AppDataSource.getRepository(Category);
    const budgetRepository = AppDataSource.getRepository(Budget);
    const auditRepository = AppDataSource.getRepository(AuditLog);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const transactionsCount = await transactionRepository
        .createQueryBuilder('transaction')
        .where('transaction.userId = :userId', { userId: req.userId })
        .andWhere('transaction.date >= :startOfMonth', { startOfMonth })
        .getCount();

    const accountsCount = await accountRepository.count({ where: { userId: req.userId } });
    const categoriesCount = await categoryRepository.count({ where: { userId: req.userId } });
    const budgetsCount = await budgetRepository.count({ where: { userId: req.userId } });

    const exportsCount = await auditRepository
        .createQueryBuilder('audit')
        .where('audit.userId = :userId', { userId: req.userId })
        .andWhere('audit.action LIKE :action', { action: 'EXPORT_%' })
        .andWhere('audit.createdAt >= :startOfMonth', { startOfMonth })
        .getCount();

    res.json({
        plan: user.plan,
        subStatus: user.subStatus,
        limits: limits,
        usage: {
            transactions: transactionsCount,
            accounts: accountsCount,
            categories: categoriesCount,
            budgets: budgetsCount,
            exports: exportsCount
        }
    });
}));

// Check trials self-check endpoint
router.post('/check-trials', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    // Check specific user trial
    await SubscriptionService.checkTrialStatus(req.userId!);
    res.json({ success: true });
}));

// Downgrade to Free
router.post('/downgrade', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await SubscriptionService.downgradeToFree(req.userId!);
    if (!user) throw new AppError('User not found', 404);
    res.json({ success: true, user: { plan: user.plan, subStatus: user.subStatus } });
}));

export default router;

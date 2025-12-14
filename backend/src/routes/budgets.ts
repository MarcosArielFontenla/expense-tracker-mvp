import express, { Response } from 'express';
import { AppDataSource } from '../config/database';
import { Budget } from '../entities/Budget';
import { Transaction } from '../entities/Transaction';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { Between } from 'typeorm';
import { validateRequest } from '../middleware/validateRequest';
import { budgetValidation } from '../validators/budget.validation';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../utils/AppError';
import { AuditService } from '../services/audit.service';
import { checkPlanLimit } from '../middleware/planLimit.middleware';

const router = express.Router();

// Get budgets for a specific month/year with status
router.get('/:month/:year', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { month, year } = req.params;
    const budgetRepository = AppDataSource.getRepository(Budget);
    const transactionRepository = AppDataSource.getRepository(Transaction);

    const budgets = await budgetRepository.find({
        where: {
            userId: req.userId,
            month: parseInt(month),
            year: parseInt(year)
        },
        relations: ['category']
    });

    // Calculate spent for each budget
    const budgetsWithStatus = await Promise.all(
        budgets.map(async (budget) => {
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

            const transactions = await transactionRepository.find({
                where: {
                    userId: req.userId,
                    categoryId: budget.categoryId,
                    type: 'expense',
                    date: Between(startDate, endDate)
                }
            });

            const spent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
            const percentageUsed = (spent / Number(budget.amount)) * 100;

            return {
                budget,
                spent,
                remaining: Number(budget.amount) - spent,
                percentageUsed,
                isOverBudget: spent > Number(budget.amount),
                hasAlert: percentageUsed >= budget.alertThreshold
            };
        })
    );

    res.json(budgetsWithStatus);
}));

// Create budget
router.post('/', authMiddleware, checkPlanLimit('budgets'), budgetValidation, validateRequest, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { categoryId, amount, month, year, alertThreshold } = req.body;

    const budgetRepository = AppDataSource.getRepository(Budget);

    // Check if budget already exists
    const existing = await budgetRepository.findOne({
        where: {
            userId: req.userId,
            categoryId,
            month,
            year
        }
    });

    if (existing) {
        throw new AppError('Budget already exists for this category and period', 400);
    }

    const budget = budgetRepository.create({
        categoryId,
        amount,
        month,
        year,
        alertThreshold: alertThreshold || 80,
        userId: req.userId!
    });

    await budgetRepository.save(budget);

    // Audit Log
    await AuditService.logAction(req.userId!, 'BUDGET_CREATE', req, budget, budget.id, 'Budget');

    res.status(201).json(budget);
}));

// Update budget
router.put('/:id', authMiddleware, budgetValidation, validateRequest, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { amount, alertThreshold } = req.body;
    const budgetRepository = AppDataSource.getRepository(Budget);

    const budget = await budgetRepository.findOne({
        where: { id: req.params.id, userId: req.userId }
    });

    if (!budget) {
        throw new AppError('Budget not found', 404);
    }

    budget.amount = amount || budget.amount;
    budget.alertThreshold = alertThreshold !== undefined ? alertThreshold : budget.alertThreshold;

    await budgetRepository.save(budget);

    // Audit Log
    await AuditService.logAction(req.userId!, 'BUDGET_UPDATE', req, budget, budget.id, 'Budget');

    res.json(budget);
}));

// Delete budget
router.delete('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const budgetRepository = AppDataSource.getRepository(Budget);
    const budget = await budgetRepository.findOne({
        where: { id: req.params.id, userId: req.userId }
    });

    if (!budget) {
        throw new AppError('Budget not found', 404);
    }

    await budgetRepository.remove(budget);

    // Audit Log
    await AuditService.logAction(req.userId!, 'BUDGET_DELETE', req, { id: req.params.id }, req.params.id, 'Budget');

    res.json({ message: 'Budget deleted successfully' });
}));

export default router;

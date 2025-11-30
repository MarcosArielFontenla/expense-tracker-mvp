import express, { Response } from 'express';
import { AppDataSource } from '../config/database';
import { Budget } from '../entities/Budget';
import { Transaction } from '../entities/Transaction';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { Between } from 'typeorm';
import { validateRequest } from '../middleware/validateRequest';
import { budgetValidation } from '../validators/budget.validation';

const router = express.Router();

// Get budgets for a specific month/year with status
router.get('/:month/:year', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
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
    } catch (error) {
        console.error('Error fetching budgets:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create budget
router.post('/', authMiddleware, budgetValidation, validateRequest, async (req: AuthRequest, res: Response) => {
    try {
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
            return res.status(400).json({ message: 'Budget already exists for this category and period' });
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
        res.status(201).json(budget);
    } catch (error) {
        console.error('Error creating budget:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update budget
router.put('/:id', authMiddleware, budgetValidation, validateRequest, async (req: AuthRequest, res: Response) => {
    try {
        const { amount, alertThreshold } = req.body;
        const budgetRepository = AppDataSource.getRepository(Budget);

        const budget = await budgetRepository.findOne({
            where: { id: req.params.id, userId: req.userId }
        });

        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        budget.amount = amount || budget.amount;
        budget.alertThreshold = alertThreshold !== undefined ? alertThreshold : budget.alertThreshold;

        await budgetRepository.save(budget);
        res.json(budget);
    } catch (error) {
        console.error('Error updating budget:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete budget
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const budgetRepository = AppDataSource.getRepository(Budget);
        const budget = await budgetRepository.findOne({
            where: { id: req.params.id, userId: req.userId }
        });

        if (!budget) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        await budgetRepository.remove(budget);
        res.json({ message: 'Budget deleted successfully' });
    } catch (error) {
        console.error('Error deleting budget:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;

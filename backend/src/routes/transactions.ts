import express, { Response } from 'express';
import { AppDataSource } from '../config/database';
import { Transaction } from '../entities/Transaction';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { validateRequest } from '../middleware/validateRequest';
import { transactionValidation } from '../validators/transaction.validation';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../utils/AppError';

const router = express.Router();

// Get all transactions with optional filters
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { type, categoryId, startDate, endDate } = req.query;
    const transactionRepository = AppDataSource.getRepository(Transaction);

    const where: any = { userId: req.userId };

    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;

    // Date range filter
    if (startDate && endDate) {
        where.date = Between(new Date(startDate as string), new Date(endDate as string));
    } else if (startDate) {
        where.date = MoreThanOrEqual(new Date(startDate as string));
    } else if (endDate) {
        where.date = LessThanOrEqual(new Date(endDate as string));
    }

    const transactions = await transactionRepository.find({
        where,
        relations: ['category'],
        order: { date: 'DESC' }
    });

    res.json(transactions);
}));

// Get monthly summary
router.get('/summary/:month/:year', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { month, year } = req.params;
    const transactionRepository = AppDataSource.getRepository(Transaction);

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const transactions = await transactionRepository.find({
        where: {
            userId: req.userId,
            date: Between(startDate, endDate)
        }
    });

    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    res.json({
        totalIncome: income,
        totalExpense: expense,
        balance: income - expense,
        transactionCount: transactions.length
    });
}));

// Create transaction
router.post('/', authMiddleware, transactionValidation, validateRequest, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { type, amount, categoryId, date, note } = req.body;

    const transactionRepository = AppDataSource.getRepository(Transaction);
    const transaction = transactionRepository.create({
        type,
        amount,
        categoryId,
        date: new Date(date),
        note,
        userId: req.userId!
    });

    await transactionRepository.save(transaction);
    res.status(201).json(transaction);
}));

// Update transaction
router.put('/:id', authMiddleware, transactionValidation, validateRequest, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { type, amount, categoryId, date, note } = req.body;
    const transactionRepository = AppDataSource.getRepository(Transaction);

    const transaction = await transactionRepository.findOne({
        where: { id: req.params.id, userId: req.userId }
    });

    if (!transaction) {
        throw new AppError('Transaction not found', 404);
    }

    transaction.type = type || transaction.type;
    transaction.amount = amount || transaction.amount;
    transaction.categoryId = categoryId || transaction.categoryId;
    transaction.date = date ? new Date(date) : transaction.date;
    transaction.note = note !== undefined ? note : transaction.note;

    await transactionRepository.save(transaction);
    res.json(transaction);
}));

// Delete transaction
router.delete('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const transactionRepository = AppDataSource.getRepository(Transaction);
    const transaction = await transactionRepository.findOne({
        where: { id: req.params.id, userId: req.userId }
    });

    if (!transaction) {
        throw new AppError('Transaction not found', 404);
    }

    await transactionRepository.remove(transaction);
    res.json({ message: 'Transaction deleted successfully' });
}));

export default router;

import express, { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Transaction } from '../entities/Transaction';
import { Account } from '../entities/Account';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { validateRequest } from '../middleware/validateRequest';
import { transactionValidation } from '../validators/transaction.validation';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../utils/AppError';
import { AuditService } from '../services/audit.service';

const router = express.Router();

// Get all transactions with optional filters
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { type, categoryId, accountId, startDate, endDate, search, minAmount, maxAmount, sortBy, sortOrder } = req.query;
    const transactionRepository = AppDataSource.getRepository(Transaction);

    const where: any = { userId: req.userId };

    if (type)
        where.type = type;

    if (categoryId)
        where.categoryId = categoryId;

    // Date range filter
    if (startDate && endDate) {
        where.date = Between(new Date(startDate as string), new Date(endDate as string));
    } else if (startDate) {
        where.date = MoreThanOrEqual(new Date(startDate as string));
    } else if (endDate) {
        where.date = LessThanOrEqual(new Date(endDate as string));
    }

    // Amount range filter
    if (minAmount && maxAmount) {
        where.amount = Between(Number(minAmount), Number(maxAmount));
    } else if (minAmount) {
        where.amount = MoreThanOrEqual(Number(minAmount));
    } else if (maxAmount) {
        where.amount = LessThanOrEqual(Number(maxAmount));
    }

    // Text search filter (case-insensitive)
    const queryBuilder = transactionRepository
        .createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.category', 'category')
        .where('transaction.userId = :userId', { userId: req.userId });

    if (type) {
        queryBuilder.andWhere('transaction.type = :type', { type });
    }

    if (categoryId) {
        queryBuilder.andWhere('transaction.categoryId = :categoryId', { categoryId });
    }

    if (startDate && endDate) {
        queryBuilder.andWhere('transaction.date BETWEEN :startDate AND :endDate', {
            startDate: new Date(startDate as string),
            endDate: new Date(endDate as string)
        });
    } else if (startDate) {
        queryBuilder.andWhere('transaction.date >= :startDate', { startDate: new Date(startDate as string) });
    } else if (endDate) {
        queryBuilder.andWhere('transaction.date <= :endDate', { endDate: new Date(endDate as string) });
    }

    if (minAmount && maxAmount) {
        queryBuilder.andWhere('transaction.amount BETWEEN :minAmount AND :maxAmount', {
            minAmount: Number(minAmount),
            maxAmount: Number(maxAmount)
        });
    } else if (minAmount) {
        queryBuilder.andWhere('transaction.amount >= :minAmount', { minAmount: Number(minAmount) });
    } else if (maxAmount) {
        queryBuilder.andWhere('transaction.amount <= :maxAmount', { maxAmount: Number(maxAmount) });
    }

    if (search) {
        queryBuilder.andWhere('LOWER(transaction.note) LIKE LOWER(:search)', { search: `%${search}%` });
    }

    // Dynamic sorting
    const validSortFields = ['date', 'amount', 'createdAt'];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy as string : 'date';
    const order = (sortOrder as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    queryBuilder.orderBy(`transaction.${sortField}`, order);

    const transactions = await queryBuilder.getMany();

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
        .reduce((sum, t) => {
            console.log(`Income: ${t.amount} (${typeof t.amount})`);
            return sum + Number(t.amount);
        }, 0);

    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => {
            console.log(`Expense: ${t.amount} (${typeof t.amount})`);
            return sum + Number(t.amount);
        }, 0);

    console.log('Total Income:', income);
    console.log('Total Expense:', expense);

    res.json({
        totalIncome: income,
        totalExpense: expense,
        balance: income - expense,
        transactionCount: transactions.length
    });
}));

// Create transaction
router.post('/', authMiddleware, transactionValidation, validateRequest, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { type, amount, categoryId, accountId, date, note } = req.body;

    const transactionRepository = AppDataSource.getRepository(Transaction);
    const accountRepository = AppDataSource.getRepository(Account);

    // If no accountId provided, use default account
    let finalAccountId = accountId;
    if (!finalAccountId) {
        const defaultAccount = await accountRepository.findOne({
            where: { userId: req.userId, isDefault: true }
        });
        if (defaultAccount) {
            finalAccountId = defaultAccount.id;
        }
    }

    const transaction = transactionRepository.create({
        type,
        amount,
        categoryId,
        accountId: finalAccountId,
        date: new Date(date),
        note,
        userId: req.userId!
    });

    await transactionRepository.save(transaction);

    // Update account balance
    if (finalAccountId) {
        const account = await accountRepository.findOne({ where: { id: finalAccountId } });
        if (account) {
            const balanceChange = type === 'income' ? Number(amount) : -Number(amount);
            account.balance = Number(account.balance) + balanceChange;
            await accountRepository.save(account);
        }
    }

    // Audit Log
    await AuditService.logAction(req.userId!, 'TRANSACTION_CREATE', req, transaction, transaction.id, 'Transaction');

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

    // Audit Log
    await AuditService.logAction(req.userId!, 'TRANSACTION_UPDATE', req, transaction, transaction.id, 'Transaction');

    res.json(transaction);
}));

// Delete transaction
router.delete('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const transactionRepository = AppDataSource.getRepository(Transaction);
    const accountRepository = AppDataSource.getRepository(Account);

    const transaction = await transactionRepository.findOne({
        where: { id: req.params.id, userId: req.userId }
    });

    if (!transaction) {
        throw new AppError('Transaction not found', 404);
    }

    // Revert account balance before deleting
    if (transaction.accountId) {
        const account = await accountRepository.findOne({ where: { id: transaction.accountId } });
        if (account) {
            // Reverse the original effect: income was added, expense was subtracted
            const balanceRevert = transaction.type === 'income'
                ? -Number(transaction.amount)
                : Number(transaction.amount);
            account.balance = Number(account.balance) + balanceRevert;
            await accountRepository.save(account);
        }
    }

    await transactionRepository.remove(transaction);

    // Audit Log
    await AuditService.logAction(req.userId!, 'TRANSACTION_DELETE', req, { id: req.params.id }, req.params.id, 'Transaction');

    res.json({ message: 'Transaction deleted successfully' });
}));

// Debug endpoint
router.get('/debug-summary', asyncHandler(async (req: Request, res: Response) => {
    const transactionRepository = AppDataSource.getRepository(Transaction);
    const transactions = await transactionRepository.find();

    const debugData = transactions.map(t => ({
        id: t.id,
        amount: t.amount,
        typeOfAmount: typeof t.amount,
        parsedAmount: Number(t.amount),
        type: t.type
    }));

    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    res.json({
        income,
        expense,
        balance: income - expense,
        transactions: debugData
    });
}));

export default router;

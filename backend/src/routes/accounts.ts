import express, { Response } from 'express';
import { AppDataSource } from '../config/database';
import { Account } from '../entities/Account';
import { Transaction } from '../entities/Transaction';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../utils/AppError';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Validation rules
const accountValidation = [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('type').isIn(['cash', 'bank', 'credit_card', 'debit_card', 'savings']).withMessage('Invalid account type'),
    body('balance').optional().isNumeric().withMessage('Balance must be a number'),
    body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format'),
    body('icon').optional().isLength({ max: 10 }),
    body('isDefault').optional().isBoolean()
];

// Get all accounts for user
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const accountRepository = AppDataSource.getRepository(Account);

    const accounts = await accountRepository.find({
        where: { userId: req.userId, isArchived: false },
        order: { isDefault: 'DESC', name: 'ASC' }
    });

    res.json(accounts);
}));

// Get single account
router.get('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const accountRepository = AppDataSource.getRepository(Account);

    const account = await accountRepository.findOne({
        where: { id: req.params.id, userId: req.userId }
    });

    if (!account) {
        throw new AppError('Account not found', 404);
    }

    res.json(account);
}));

// Create account
router.post('/', authMiddleware, accountValidation, asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new AppError(errors.array()[0].msg, 400);
    }

    const accountRepository = AppDataSource.getRepository(Account);
    const { name, type, balance, currency, color, icon, isDefault } = req.body;

    // If this is the first account or isDefault is true, handle default status
    const existingAccounts = await accountRepository.count({ where: { userId: req.userId } });
    const shouldBeDefault = existingAccounts === 0 || isDefault === true;

    // If setting as default, unset other defaults
    if (shouldBeDefault) {
        await accountRepository.update(
            { userId: req.userId, isDefault: true },
            { isDefault: false }
        );
    }

    const account = accountRepository.create({
        userId: req.userId,
        name,
        type,
        balance: balance || 0,
        currency: currency || 'ARS',
        color: color || '#3b82f6',
        icon: icon || '💰',
        isDefault: shouldBeDefault
    });

    await accountRepository.save(account);
    res.status(201).json(account);
}));

// Update account
router.put('/:id', authMiddleware, accountValidation, asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new AppError(errors.array()[0].msg, 400);
    }

    const accountRepository = AppDataSource.getRepository(Account);

    const account = await accountRepository.findOne({
        where: { id: req.params.id, userId: req.userId }
    });

    if (!account) {
        throw new AppError('Account not found', 404);
    }

    const { name, type, balance, currency, color, icon, isDefault } = req.body;

    // Handle default status change
    if (isDefault === true && !account.isDefault) {
        await accountRepository.update(
            { userId: req.userId, isDefault: true },
            { isDefault: false }
        );
    }

    account.name = name;
    account.type = type;
    if (balance !== undefined) account.balance = balance;
    if (currency) account.currency = currency;
    if (color) account.color = color;
    if (icon) account.icon = icon;
    if (isDefault !== undefined) account.isDefault = isDefault;

    await accountRepository.save(account);
    res.json(account);
}));

// Delete account
router.delete('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const accountRepository = AppDataSource.getRepository(Account);
    const transactionRepository = AppDataSource.getRepository(Transaction);

    const account = await accountRepository.findOne({
        where: { id: req.params.id, userId: req.userId }
    });

    if (!account) {
        throw new AppError('Account not found', 404);
    }

    // Check if account has transactions
    const transactionCount = await transactionRepository.count({
        where: { accountId: account.id }
    });

    if (transactionCount > 0) {
        throw new AppError('Cannot delete account with transactions. Archive it instead.', 400);
    }

    await accountRepository.remove(account);
    res.status(204).send();
}));

// Archive/Unarchive account
router.patch('/:id/archive', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const accountRepository = AppDataSource.getRepository(Account);

    const account = await accountRepository.findOne({
        where: { id: req.params.id, userId: req.userId }
    });

    if (!account) {
        throw new AppError('Account not found', 404);
    }

    account.isArchived = !account.isArchived;

    // If archiving default account, set another as default
    if (account.isArchived && account.isDefault) {
        account.isDefault = false;
        const anotherAccount = await accountRepository.findOne({
            where: { userId: req.userId, isArchived: false }
        });
        if (anotherAccount) {
            anotherAccount.isDefault = true;
            await accountRepository.save(anotherAccount);
        }
    }

    await accountRepository.save(account);
    res.json(account);
}));

// Recalculate account balance
router.post('/:id/recalculate', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const accountRepository = AppDataSource.getRepository(Account);
    const transactionRepository = AppDataSource.getRepository(Transaction);

    const account = await accountRepository.findOne({
        where: { id: req.params.id, userId: req.userId }
    });

    if (!account) {
        throw new AppError('Account not found', 404);
    }

    // Calculate balance from transactions
    const transactions = await transactionRepository.find({
        where: { accountId: account.id }
    });

    const balance = transactions.reduce((sum, t) => {
        const amount = Number(t.amount);
        return t.type === 'income' ? sum + amount : sum - amount;
    }, 0);

    account.balance = balance;
    await accountRepository.save(account);

    res.json(account);
}));

export default router;

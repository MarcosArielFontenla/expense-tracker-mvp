import { body } from 'express-validator';

export const budgetValidation = [
    body('categoryId')
        .notEmpty().withMessage('Category ID is required')
        .isInt().withMessage('Category ID must be an integer'),
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
    body('month')
        .notEmpty().withMessage('Month is required')
        .isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
    body('year')
        .notEmpty().withMessage('Year is required')
        .isInt({ min: 2000 }).withMessage('Year must be 2000 or later'),
    body('alertThreshold')
        .optional()
        .isInt({ min: 0, max: 100 }).withMessage('Alert threshold must be between 0 and 100')
];
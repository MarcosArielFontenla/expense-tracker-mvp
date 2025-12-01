import { body } from 'express-validator';

export const transactionValidation = [
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
    body('note')
        .optional()
        .trim(),
    body('date')
        .notEmpty().withMessage('Date is required')
        .isISO8601().withMessage('Date must be a valid ISO 8601 date'),
    body('type')
        .notEmpty().withMessage('Type is required')
        .isIn(['income', 'expense']).withMessage('Type must be either income or expense'),
    body('categoryId')
        .notEmpty().withMessage('Category ID is required')
        .isUUID().withMessage('Category ID must be a valid UUID')
];
import { body } from 'express-validator';

// List of supported currencies (ISO 4217 codes)
const SUPPORTED_CURRENCIES = [
    'USD', // US Dollar
    'EUR', // Euro
    'GBP', // British Pound
    'ARS', // Argentine Peso
    'MXN', // Mexican Peso
    'CLP', // Chilean Peso
    'BRL', // Brazilian Real
    'COP', // Colombian Peso
    'PEN', // Peruvian Sol
    'UYU'  // Uruguayan Peso
];

export const updateProfileValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('currency')
        .optional()
        .isIn(SUPPORTED_CURRENCIES)
        .withMessage(`Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`)
];

export { SUPPORTED_CURRENCIES };

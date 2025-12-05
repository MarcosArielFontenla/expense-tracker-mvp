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

// List of supported timezones (IANA timezone identifiers)
const SUPPORTED_TIMEZONES = [
    'America/Argentina/Buenos_Aires',
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'America/Denver',
    'America/Mexico_City',
    'America/Santiago',
    'America/Sao_Paulo',
    'America/Lima',
    'America/Bogota',
    'Europe/London',
    'Europe/Paris',
    'Europe/Madrid',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Dubai',
    'Australia/Sydney',
    'UTC'
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
        .withMessage(`Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`),
    body('timezone')
        .optional()
        .isIn(SUPPORTED_TIMEZONES)
        .withMessage('Invalid timezone')
];

export { SUPPORTED_CURRENCIES, SUPPORTED_TIMEZONES };

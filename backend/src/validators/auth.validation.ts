import { body } from 'express-validator';

export const registerValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
    body('email')
        .trim()
        .isEmail().withMessage('Must be a valid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

export const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email address'),
    body('password')
        .notEmpty().withMessage('Password is required')
];

export const forgotPasswordValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email address')
];

export const resetPasswordValidation = [
    body('token').notEmpty().withMessage('Token is required'),
    body('password')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

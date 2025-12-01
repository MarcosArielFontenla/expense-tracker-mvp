import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { authLimiter } from '../middleware/rateLimit.middleware';
import { validateRequest } from '../middleware/validateRequest';
import {
    registerValidation,
    loginValidation,
    forgotPasswordValidation,
    resetPasswordValidation
} from '../validators/auth.validation';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../utils/AppError';

const router = express.Router();

// Apply rate limiting to sensitive routes
router.use('/register', authLimiter);
router.use('/login', authLimiter);
router.use('/forgot-password', authLimiter);
router.use('/resend-verification', authLimiter);

// Register
router.post('/register', registerValidation, validateRequest, asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    // Check if user exists
    const userRepository = AppDataSource.getRepository(User);
    const existingUser = await userRepository.findOne({ where: { email } });

    if (existingUser) {
        throw new AppError('User already exists', 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate verification token
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Create user (emailVerified = false by default)
    const user = userRepository.create({
        name,
        email,
        passwordHash,
        emailVerificationToken: hashedToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 3600000) // 24 hours
    });

    await userRepository.save(user);

    // Send verification email
    const emailService = require('../services/email.service').default;
    await emailService.sendVerificationEmail(email, verificationToken);

    res.status(201).json({
        message: 'Registration successful. Please check your email to verify your account.',
        email: user.email
    });
}));

// Login
router.post('/login', loginValidation, validateRequest, asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Find user
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });

    if (!user) {
        throw new AppError('Invalid credentials', 401);
    }

    // Check email verification
    if (!user.emailVerified) {
        throw new AppError('Please verify your email before logging in. Check your inbox for the verification link.', 403);
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
        throw new AppError('Invalid credentials', 401);
    }

    // Generate tokens using token service
    const tokenService = require('../services/token.service').default;
    const accessToken = tokenService.generateAccessToken(user.id);
    const refreshToken = tokenService.generateRefreshToken(user.id);

    // Hash and store refresh token
    user.refreshToken = tokenService.hashRefreshToken(refreshToken);
    await userRepository.save(user);

    res.json({
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        }
    });
}));

// Forgot Password
router.post('/forgot-password', forgotPasswordValidation, validateRequest, asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    // Find user
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });

    if (!user) {
        return res.json({ message: 'If that email exists, a reset link has been sent' });
    }

    // Generate reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await userRepository.save(user);

    // Send email
    const emailService = require('../services/email.service').default;
    await emailService.sendPasswordResetEmail(email, resetToken);

    res.json({ message: 'If that email exists, a reset link has been sent' });
}));

// Reset Password
router.post('/reset-password', resetPasswordValidation, validateRequest, asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;

    // Hash the token to compare
    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository
        .createQueryBuilder('user')
        .where('user.resetPasswordToken = :token', { token: hashedToken })
        .andWhere('user.resetPasswordExpires > :now', { now: new Date() })
        .getOne();

    if (!user) {
        throw new AppError('Invalid or expired token', 400);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    user.passwordHash = passwordHash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await userRepository.save(user);

    res.json({ message: 'Password reset successful' });
}));

// Verify Email
router.get('/verify-email/:token', asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;

    // Hash the token to compare
    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository
        .createQueryBuilder('user')
        .where('user.emailVerificationToken = :token', { token: hashedToken })
        .andWhere('user.emailVerificationExpires > :now', { now: new Date() })
        .getOne();

    if (!user) {
        throw new AppError('Invalid or expired verification token', 400);
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await userRepository.save(user);

    res.json({ message: 'Email verified successfully! You can now login.' });
}));

// Resend Verification Email
router.post('/resend-verification', asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    // Validation
    if (!email) {
        throw new AppError('Email is required', 400);
    }

    // Find user
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });

    // Generic response to prevent email enumeration
    if (!user) {
        return res.json({ message: 'If that email exists, a verification link has been sent' });
    }

    // Check if already verified
    if (user.emailVerified) {
        return res.json({ message: 'This email is already verified. You can login now.' });
    }

    // Generate new verification token
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Update token and expiry
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 3600000); // 24 hours
    await userRepository.save(user);

    // Send new verification email
    const emailService = require('../services/email.service').default;
    await emailService.sendVerificationEmail(email, verificationToken);

    res.json({ message: 'If that email exists, a verification link has been sent' });
}));

router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    // Validation
    if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
    }

    // Verify refresh token
    const tokenService = require('../services/token.service').default;
    const payload = tokenService.verifyRefreshToken(refreshToken);

    if (!payload) {
        throw new AppError('Invalid or expired refresh token', 401);
    }

    // Find user
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: payload.userId } });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Verify stored refresh token matches
    if (!user.refreshToken || !tokenService.verifyHashedToken(refreshToken, user.refreshToken)) {
        throw new AppError('Invalid refresh token', 401);
    }

    // Generate new tokens (token rotation)
    const newAccessToken = tokenService.generateAccessToken(user.id);
    const newRefreshToken = tokenService.generateRefreshToken(user.id);

    // Update stored refresh token
    user.refreshToken = tokenService.hashRefreshToken(newRefreshToken);
    await userRepository.save(user);

    res.json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
    });
}));

// Logout
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
    // Extract user ID from access token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7);
    const tokenService = require('../services/token.service').default;
    const payload = tokenService.verifyAccessToken(token);

    if (!payload) {
        throw new AppError('Invalid token', 401);
    }

    // Clear refresh token from database
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: payload.userId } });

    if (user) {
        user.refreshToken = undefined;
        await userRepository.save(user);
    }

    res.json({ message: 'Logged out successfully' });
}));

export default router;
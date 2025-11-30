import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { authLimiter } from '../middleware/rateLimit.middleware';

const router = express.Router();

// Apply rate limiting to sensitive routes
router.use('/register', authLimiter);
router.use('/login', authLimiter);
router.use('/forgot-password', authLimiter);
router.use('/resend-verification', authLimiter);

// Register
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user exists
        const userRepository = AppDataSource.getRepository(User);
        const existingUser = await userRepository.findOne({ where: { email } });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
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
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check email verification
        if (!user.emailVerified) {
            return res.status(403).json({
                message: 'Please verify your email before logging in. Check your inbox for the verification link.',
                emailVerified: false
            });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
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
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Forgot Password
router.post('/forgot-password', async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        // Validation
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

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
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Reset Password
router.post('/reset-password', async (req: Request, res: Response) => {
    try {
        const { token, password } = req.body;

        // Validation
        if (!token || !password) {
            return res.status(400).json({ message: 'Token and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

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
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(password, 10);

        // Update password and clear reset token
        user.passwordHash = passwordHash;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await userRepository.save(user);

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Verify Email
router.get('/verify-email/:token', async (req: Request, res: Response) => {
    try {
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
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        // Mark email as verified
        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await userRepository.save(user);

        res.json({ message: 'Email verified successfully! You can now login.' });
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Resend Verification Email
router.post('/resend-verification', async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        // Validation
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
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
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        // Validation
        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token is required' });
        }

        // Verify refresh token
        const tokenService = require('../services/token.service').default;
        const payload = tokenService.verifyRefreshToken(refreshToken);

        if (!payload) {
            return res.status(401).json({ message: 'Invalid or expired refresh token' });
        }

        // Find user
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: payload.userId } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify stored refresh token matches
        if (!user.refreshToken || !tokenService.verifyHashedToken(refreshToken, user.refreshToken)) {
            return res.status(401).json({ message: 'Invalid refresh token' });
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
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Logout
router.post('/logout', async (req: Request, res: Response) => {
    try {
        // Extract user ID from access token
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const tokenService = require('../services/token.service').default;
        const payload = tokenService.verifyAccessToken(token);

        if (!payload) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        // Clear refresh token from database
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: payload.userId } });

        if (user) {
            user.refreshToken = undefined;
            await userRepository.save(user);
        }

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
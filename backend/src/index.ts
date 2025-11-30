import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { AppDataSource } from './config/database';
import authRoutes from './routes/auth';
import categoriesRoutes from './routes/categories';
import transactionsRoutes from './routes/transactions';
import budgetsRoutes from './routes/budgets';
import reportsRoutes from './routes/reports.routes';
import { globalLimiter } from './middleware/rateLimit.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api', globalLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/reports', reportsRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

AppDataSource.initialize()
    .then(() => {
        console.log('✅ Database connected successfully');

        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('❌ Database connection error:', error);
        process.exit(1);
    });
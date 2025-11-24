import { Response } from 'express';
import { AppDataSource } from '../config/database';
import { Transaction } from '../entities/Transaction';
import { AuthRequest } from '../middlewares/auth';

export class ReportsController {

    private transactionRepository = AppDataSource.getRepository(Transaction);

    public async getMonthlyExpensesByCategory(req: AuthRequest, res: Response) {
        try {
            const userId = req.userId;
            const { month, year } = req.query;

            if (!month || !year) {
                return res.status(400).json({ message: 'Month and year are required' });
            }

            const startDate = new Date(Number(year), Number(month) - 1, 1);
            const endDate = new Date(Number(year), Number(month), 0);

            const expenses = await this.transactionRepository
                .createQueryBuilder('transaction')
                .leftJoinAndSelect('transaction.category', 'category')
                .select('category.name', 'category')
                .addSelect('category.color', 'color')
                .addSelect('SUM(transaction.amount)', 'total')
                .where('transaction.userId = :userId', { userId })
                .andWhere('transaction.type = :type', { type: 'expense' })
                .andWhere('transaction.date >= :startDate', { startDate })
                .andWhere('transaction.date <= :endDate', { endDate })
                .groupBy('category.name')
                .addGroupBy('category.color')
                .getRawMany();

            res.json(expenses);
        } catch (error) {
            console.error('Error getting monthly expenses:', error);
            res.status(500).json({ message: 'Error retrieving monthly expenses' });
        }
    }

    public async getMonthlyIncomeByCategory(req: AuthRequest, res: Response) {
        try {
            const userId = req.userId;
            const { month, year } = req.query;

            if (!month || !year) {
                return res.status(400).json({ message: 'Month and year are required' });
            }

            const startDate = new Date(Number(year), Number(month) - 1, 1);
            const endDate = new Date(Number(year), Number(month), 0);

            const income = await this.transactionRepository
                .createQueryBuilder('transaction')
                .leftJoinAndSelect('transaction.category', 'category')
                .select('category.name', 'category')
                .addSelect('category.color', 'color')
                .addSelect('SUM(transaction.amount)', 'total')
                .where('transaction.userId = :userId', { userId })
                .andWhere('transaction.type = :type', { type: 'income' })
                .andWhere('transaction.date >= :startDate', { startDate })
                .andWhere('transaction.date <= :endDate', { endDate })
                .groupBy('category.name')
                .addGroupBy('category.color')
                .getRawMany();

            res.json(income);
        } catch (error) {
            console.error('Error getting monthly income:', error);
            res.status(500).json({ message: 'Error retrieving monthly income' });
        }
    }

    public async getCashFlow(req: AuthRequest, res: Response) {
        try {
            const userId = req.userId;

            // Get last 6 months
            const endDate = new Date();
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 5);
            startDate.setDate(1);

            const cashFlow = await this.transactionRepository
                .createQueryBuilder('transaction')
                .select("FORMAT(transaction.date, 'yyyy-MM')", 'month')
                .addSelect("SUM(CASE WHEN transaction.type = 'income' THEN transaction.amount ELSE 0 END)", 'income')
                .addSelect("SUM(CASE WHEN transaction.type = 'expense' THEN transaction.amount ELSE 0 END)", 'expense')
                .where('transaction.userId = :userId', { userId })
                .andWhere('transaction.date >= :startDate', { startDate })
                .groupBy("FORMAT(transaction.date, 'yyyy-MM')")
                .orderBy('month', 'ASC')
                .getRawMany();

            res.json(cashFlow);
        } catch (error) {
            console.error('Error getting cash flow:', error);
            res.status(500).json({ message: 'Error retrieving cash flow' });
        }
    }

    public async getCustomRangeReport(req: AuthRequest, res: Response) {
        try {
            const userId = req.userId;
            const { startDate, endDate, categoryId, type } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({ message: 'Start date and end date are required' });
            }

            let query = this.transactionRepository
                .createQueryBuilder('transaction')
                .leftJoinAndSelect('transaction.category', 'category')
                .where('transaction.userId = :userId', { userId })
                .andWhere('transaction.date >= :startDate', { startDate: new Date(startDate as string) })
                .andWhere('transaction.date <= :endDate', { endDate: new Date(endDate as string) });

            if (categoryId) {
                query = query.andWhere('transaction.categoryId = :categoryId', { categoryId });
            }

            if (type && (type === 'income' || type === 'expense')) {
                query = query.andWhere('transaction.type = :type', { type });
            }

            const transactions = await query
                .orderBy('transaction.date', 'DESC')
                .getMany();

            // Calculate summary
            const summary = transactions.reduce((acc, t) => {
                if (t.type === 'income') {
                    acc.totalIncome += Number(t.amount);
                } else {
                    acc.totalExpenses += Number(t.amount);
                }
                return acc;
            }, { totalIncome: 0, totalExpenses: 0, balance: 0 });

            summary.balance = summary.totalIncome - summary.totalExpenses;

            res.json({ transactions, summary });
        } catch (error) {
            console.error('Error getting custom range report:', error);
            res.status(500).json({ message: 'Error retrieving custom range report' });
        }
    }

    public async getDetailedMonthlyReport(req: AuthRequest, res: Response) {
        try {
            const userId = req.userId;
            const { month, year } = req.query;

            if (!month || !year) {
                return res.status(400).json({ message: 'Month and year are required' });
            }

            const startDate = new Date(Number(year), Number(month) - 1, 1);
            const endDate = new Date(Number(year), Number(month), 0);

            // Get all transactions for the month
            const transactions = await this.transactionRepository
                .createQueryBuilder('transaction')
                .leftJoinAndSelect('transaction.category', 'category')
                .where('transaction.userId = :userId', { userId })
                .andWhere('transaction.date >= :startDate', { startDate })
                .andWhere('transaction.date <= :endDate', { endDate })
                .orderBy('transaction.date', 'DESC')
                .getMany();

            // Group by category
            const categoryBreakdown = await this.transactionRepository
                .createQueryBuilder('transaction')
                .leftJoinAndSelect('transaction.category', 'category')
                .select('category.id', 'categoryId')
                .addSelect('category.name', 'categoryName')
                .addSelect('category.color', 'categoryColor')
                .addSelect('transaction.type', 'type')
                .addSelect('SUM(transaction.amount)', 'total')
                .addSelect('COUNT(transaction.id)', 'count')
                .where('transaction.userId = :userId', { userId })
                .andWhere('transaction.date >= :startDate', { startDate })
                .andWhere('transaction.date <= :endDate', { endDate })
                .groupBy('category.id')
                .addGroupBy('category.name')
                .addGroupBy('category.color')
                .addGroupBy('transaction.type')
                .getRawMany();

            // Calculate totals
            const summary = transactions.reduce((acc, t) => {
                if (t.type === 'income') {
                    acc.totalIncome += Number(t.amount);
                } else {
                    acc.totalExpenses += Number(t.amount);
                }
                return acc;
            }, { totalIncome: 0, totalExpenses: 0, balance: 0 });

            summary.balance = summary.totalIncome - summary.totalExpenses;

            res.json({ transactions, categoryBreakdown, summary });
        } catch (error) {
            console.error('Error getting detailed monthly report:', error);
            res.status(500).json({ message: 'Error retrieving detailed monthly report' });
        }
    }

    public async getCategoryDetailedReport(req: AuthRequest, res: Response) {
        try {
            const userId = req.userId;
            const { categoryId, startDate, endDate } = req.query;

            if (!categoryId) {
                return res.status(400).json({ message: 'Category ID is required' });
            }

            let query = this.transactionRepository
                .createQueryBuilder('transaction')
                .leftJoinAndSelect('transaction.category', 'category')
                .where('transaction.userId = :userId', { userId })
                .andWhere('transaction.categoryId = :categoryId', { categoryId });

            if (startDate) {
                query = query.andWhere('transaction.date >= :startDate', { startDate: new Date(startDate as string) });
            }

            if (endDate) {
                query = query.andWhere('transaction.date <= :endDate', { endDate: new Date(endDate as string) });
            }

            const transactions = await query
                .orderBy('transaction.date', 'DESC')
                .getMany();

            // Calculate statistics
            const stats = transactions.reduce((acc, t) => {
                acc.total += Number(t.amount);
                acc.count += 1;
                if (!acc.minAmount || Number(t.amount) < acc.minAmount) {
                    acc.minAmount = Number(t.amount);
                }
                if (!acc.maxAmount || Number(t.amount) > acc.maxAmount) {
                    acc.maxAmount = Number(t.amount);
                }
                return acc;
            }, { total: 0, count: 0, minAmount: 0, maxAmount: 0, average: 0 });

            stats.average = stats.count > 0 ? stats.total / stats.count : 0;

            res.json({ transactions, stats });
        } catch (error) {
            console.error('Error getting category detailed report:', error);
            res.status(500).json({ message: 'Error retrieving category detailed report' });
        }
    }
}
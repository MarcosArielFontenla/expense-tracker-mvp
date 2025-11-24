import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const reportsController = new ReportsController();

router.get('/monthly-expenses', authMiddleware, (req, res) => reportsController.getMonthlyExpensesByCategory(req, res));
router.get('/monthly-income', authMiddleware, (req, res) => reportsController.getMonthlyIncomeByCategory(req, res));
router.get('/cash-flow', authMiddleware, (req, res) => reportsController.getCashFlow(req, res));
router.get('/custom-range', authMiddleware, (req, res) => reportsController.getCustomRangeReport(req, res));
router.get('/monthly-detailed', authMiddleware, (req, res) => reportsController.getDetailedMonthlyReport(req, res));
router.get('/category-detailed', authMiddleware, (req, res) => reportsController.getCategoryDetailedReport(req, res));

export default router;
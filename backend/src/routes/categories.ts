import express, { Response } from 'express';
import { AppDataSource } from '../config/database';
import { Category } from '../entities/Category';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../utils/AppError';

const router = express.Router();

// Get all categories for the authenticated user
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const categoryRepository = AppDataSource.getRepository(Category);
    const categories = await categoryRepository.find({
        where: { userId: req.userId }
    });
    res.json(categories);
}));

// Get category by ID
router.get('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const categoryRepository = AppDataSource.getRepository(Category);
    const category = await categoryRepository.findOne({
        where: { id: req.params.id, userId: req.userId }
    });

    if (!category) {
        throw new AppError('Category not found', 404);
    }

    res.json(category);
}));

// Create category
router.post('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, icon, color, type, isDefault } = req.body;

    if (!name || !icon || !color || !type) {
        throw new AppError('All fields are required', 400);
    }

    const categoryRepository = AppDataSource.getRepository(Category);
    const category = categoryRepository.create({
        name,
        icon,
        color,
        type,
        isDefault: isDefault || false,
        userId: req.userId!
    });

    await categoryRepository.save(category);
    res.status(201).json(category);
}));

// Update category
router.put('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, icon, color, type } = req.body;
    const categoryRepository = AppDataSource.getRepository(Category);

    const category = await categoryRepository.findOne({
        where: { id: req.params.id, userId: req.userId }
    });

    if (!category) {
        throw new AppError('Category not found', 404);
    }

    category.name = name || category.name;
    category.icon = icon || category.icon;
    category.color = color || category.color;
    category.type = type || category.type;

    await categoryRepository.save(category);
    res.json(category);
}));

// Delete category
router.delete('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const categoryRepository = AppDataSource.getRepository(Category);
    const category = await categoryRepository.findOne({
        where: { id: req.params.id, userId: req.userId }
    });

    if (!category) {
        throw new AppError('Category not found', 404);
    }

    await categoryRepository.remove(category);
    res.json({ message: 'Category deleted successfully' });
}));

export default router;

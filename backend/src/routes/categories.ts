import express, { Response } from 'express';
import { AppDataSource } from '../config/database';
import { Category } from '../entities/Category';
import { authMiddleware, AuthRequest } from '../middlewares/auth';

const router = express.Router();

// Get all categories for the authenticated user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const categoryRepository = AppDataSource.getRepository(Category);
        const categories = await categoryRepository.find({
            where: { userId: req.userId }
        });
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get category by ID
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const categoryRepository = AppDataSource.getRepository(Category);
        const category = await categoryRepository.findOne({
            where: { id: req.params.id, userId: req.userId }
        });

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json(category);
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create category
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { name, icon, color, type, isDefault } = req.body;

        if (!name || !icon || !color || !type) {
            return res.status(400).json({ message: 'All fields are required' });
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
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update category
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { name, icon, color, type } = req.body;
        const categoryRepository = AppDataSource.getRepository(Category);

        const category = await categoryRepository.findOne({
            where: { id: req.params.id, userId: req.userId }
        });

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        category.name = name || category.name;
        category.icon = icon || category.icon;
        category.color = color || category.color;
        category.type = type || category.type;

        await categoryRepository.save(category);
        res.json(category);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete category
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const categoryRepository = AppDataSource.getRepository(Category);
        const category = await categoryRepository.findOne({
            where: { id: req.params.id, userId: req.userId }
        });

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        await categoryRepository.remove(category);
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;

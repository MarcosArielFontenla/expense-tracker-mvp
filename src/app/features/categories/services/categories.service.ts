import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Category, CategoryDTO } from '../../../core/models/category.model';

@Injectable({
    providedIn: 'root'
})
export class CategoriesService {
    private categories: Category[] = [];
    private categoriesSubject = new BehaviorSubject<Category[]>([]);
    public categories$ = this.categoriesSubject.asObservable();

    constructor() {
        this.initializeDefaultCategories();
    }

    /**
     * Initialize default categories with Spanish names
     */
    private initializeDefaultCategories(): void {
        const defaultCategories: CategoryDTO[] = [
            // Expense categories
            { name: 'Alimentos', icon: '🍔', color: '#ef4444', type: 'expense' },
            { name: 'Transporte', icon: '🚗', color: '#f59e0b', type: 'expense' },
            { name: 'Hogar', icon: '🏠', color: '#3b82f6', type: 'expense' },
            { name: 'Ocio', icon: '🎮', color: '#8b5cf6', type: 'expense' },
            { name: 'Salud', icon: '💊', color: '#ec4899', type: 'expense' },
            { name: 'Servicios', icon: '💡', color: '#14b8a6', type: 'expense' },
            { name: 'Educación', icon: '📚', color: '#6366f1', type: 'expense' },
            { name: 'Ropa', icon: '👕', color: '#a855f7', type: 'expense' },
            // Income categories
            { name: 'Salario', icon: '💰', color: '#22c55e', type: 'income' },
            { name: 'Inversiones', icon: '📈', color: '#10b981', type: 'income' },
            { name: 'Otros Ingresos', icon: '💵', color: '#059669', type: 'income' },
        ];

        defaultCategories.forEach(dto => this.createCategory(dto).subscribe());
    }

    /**
     * Get all categories
     */
    getCategories(): Observable<Category[]> {
        return of(this.categories).pipe(delay(100));
    }

    /**
     * Get categories filtered by type
     */
    getCategoriesByType(type: 'expense' | 'income'): Observable<Category[]> {
        return of(this.categories.filter(c => c.type === type)).pipe(delay(100));
    }

    /**
     * Get a single category by ID
     */
    getCategoryById(id: string): Observable<Category | undefined> {
        const category = this.categories.find(c => c.id === id);
        return of(category).pipe(delay(50));
    }

    /**
     * Create a new category
     */
    createCategory(categoryDTO: CategoryDTO): Observable<Category> {
        // Check if category name already exists
        const exists = this.categories.some(
            c => c.name.toLowerCase() === categoryDTO.name.toLowerCase()
        );

        if (exists) {
            return throwError(() => new Error('Ya existe una categoría con ese nombre'));
        }

        const newCategory: Category = {
            id: this.generateId(),
            ...categoryDTO,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.categories.push(newCategory);
        this.categoriesSubject.next([...this.categories]);

        return of(newCategory).pipe(delay(200));
    }

    /**
     * Update an existing category
     */
    updateCategory(id: string, categoryDTO: CategoryDTO): Observable<Category> {
        const index = this.categories.findIndex(c => c.id === id);

        if (index === -1) {
            return throwError(() => new Error('Categoría no encontrada'));
        }

        // Check if new name conflicts with another category
        const nameExists = this.categories.some(
            c => c.id !== id && c.name.toLowerCase() === categoryDTO.name.toLowerCase()
        );

        if (nameExists) {
            return throwError(() => new Error('Ya existe una categoría con ese nombre'));
        }

        const updatedCategory: Category = {
            ...this.categories[index],
            ...categoryDTO,
            updatedAt: new Date()
        };

        this.categories[index] = updatedCategory;
        this.categoriesSubject.next([...this.categories]);

        return of(updatedCategory).pipe(delay(200));
    }

    /**
     * Delete a category
     */
    deleteCategory(id: string): Observable<void> {
        const index = this.categories.findIndex(c => c.id === id);

        if (index === -1) {
            return throwError(() => new Error('Categoría no encontrada'));
        }

        // TODO: In production, check if category is used in transactions before deleting
        this.categories.splice(index, 1);
        this.categoriesSubject.next([...this.categories]);

        return of(void 0).pipe(delay(200));
    }

    /**
     * Get category statistics (count by type)
     */
    getCategoryStats(): Observable<{ expense: number; income: number }> {
        const stats = {
            expense: this.categories.filter(c => c.type === 'expense').length,
            income: this.categories.filter(c => c.type === 'income').length
        };
        return of(stats);
    }

    /**
     * Generate a unique ID for categories
     */
    private generateId(): string {
        return `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

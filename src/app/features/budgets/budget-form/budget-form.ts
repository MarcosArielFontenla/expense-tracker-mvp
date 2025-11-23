import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BudgetService } from '../services/budget.service';
import { CategoriesService } from '../../categories/services/categories.service';
import { Category } from '../../../core/models/category.model';
import { BudgetDTO } from '../../../core/models/budget.model';

@Component({
    selector: 'app-budget-form',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './budget-form.html',
    styleUrl: './budget-form.css',
    standalone: true
})
export class BudgetForm implements OnInit {
    budgetForm!: FormGroup;
    isEditMode = false;
    budgetId: string | null = null;
    isSubmitting = false;
    error: string | null = null;

    categories: Category[] = [];
    months = [
        { value: 1, label: 'Enero' },
        { value: 2, label: 'Febrero' },
        { value: 3, label: 'Marzo' },
        { value: 4, label: 'Abril' },
        { value: 5, label: 'Mayo' },
        { value: 6, label: 'Junio' },
        { value: 7, label: 'Julio' },
        { value: 8, label: 'Agosto' },
        { value: 9, label: 'Septiembre' },
        { value: 10, label: 'Octubre' },
        { value: 11, label: 'Noviembre' },
        { value: 12, label: 'Diciembre' }
    ];
    years: number[] = [];

    constructor(
        private fb: FormBuilder,
        private budgetService: BudgetService,
        private categoriesService: CategoriesService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        const today = new Date();
        const currentYear = today.getFullYear();
        for (let i = 0; i < 5; i++) {
            this.years.push(currentYear - i);
        }
    }

    ngOnInit(): void {
        this.initializeForm();
        this.loadCategories();
        this.checkEditMode();
    }

    initializeForm(): void {
        const today = new Date();

        this.budgetForm = this.fb.group({
            categoryId: ['', Validators.required],
            amount: [null, [Validators.required, Validators.min(1)]],
            month: [today.getMonth() + 1, Validators.required],
            year: [today.getFullYear(), Validators.required],
            alertThreshold: [80, [Validators.required, Validators.min(1), Validators.max(100)]]
        });
    }

    loadCategories(): void {
        this.categoriesService.getCategoriesByType('expense').subscribe({
            next: (cats) => this.categories = cats,
            error: (err) => console.error('Error loading categories', err)
        });
    }

    checkEditMode(): void {
        this.budgetId = this.route.snapshot.paramMap.get('id');

        if (this.budgetId) {
            this.isEditMode = true;
            this.budgetService.getBudgetById(this.budgetId).subscribe({
                next: (budget) => {
                    if (budget) {
                        this.budgetForm.patchValue({
                            categoryId: budget.categoryId,
                            amount: budget.amount,
                            month: budget.month,
                            year: budget.year,
                            alertThreshold: budget.alertThreshold
                        });
                        // Disable fields that shouldn't change in edit (optional, but good practice for composite keys)
                        // For now we allow changing everything but ID
                    } else {
                        this.error = 'Presupuesto no encontrado';
                    }
                },
                error: (err) => {
                    this.error = 'Error al cargar el presupuesto';
                    console.error(err);
                }
            });
        }
    }

    onSubmit(): void {
        if (this.budgetForm.invalid) {
            this.budgetForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;
        this.error = null;

        const formValue = this.budgetForm.value;
        const budgetDTO: BudgetDTO = {
            categoryId: formValue.categoryId,
            amount: Number(formValue.amount),
            month: Number(formValue.month),
            year: Number(formValue.year),
            alertThreshold: Number(formValue.alertThreshold)
        };

        const request$ = this.isEditMode && this.budgetId
            ? this.budgetService.updateBudget(this.budgetId, budgetDTO)
            : this.budgetService.createBudget(budgetDTO);

        request$.subscribe({
            next: () => {
                this.router.navigate(['/budgets']);
            },
            error: (err) => {
                this.error = err.message || 'Error al guardar el presupuesto';
                this.isSubmitting = false;
            }
        });
    }

    onCancel(): void {
        this.router.navigate(['/budgets']);
    }

    // Getters
    get categoryId() { return this.budgetForm.get('categoryId'); }
    get amount() { return this.budgetForm.get('amount'); }
    get month() { return this.budgetForm.get('month'); }
    get year() { return this.budgetForm.get('year'); }
    get alertThreshold() { return this.budgetForm.get('alertThreshold'); }
}

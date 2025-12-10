import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BudgetService } from '../services/budget.service';
import { CategoriesService } from '../../categories/services/categories.service';
import { Category } from '../../../core/models/category.model';
import { BudgetDTO } from '../../../core/models/budget.model';
import { AlertService } from '../../../core/services/alert.service';

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
        private route: ActivatedRoute,
        private alertService: AlertService,
        @Inject(PLATFORM_ID) private platformId: Object) {
        const today = new Date();
        const currentYear = today.getFullYear();

        for (let i = 0; i < 5; i++) {
            this.years.push(currentYear - i);
        }
    }

    public ngOnInit(): void {
        this.initializeForm();

        if (isPlatformBrowser(this.platformId)) {
            this.loadCategories();
            this.checkEditMode();
        }
    }

    public initializeForm(): void {
        const today = new Date();

        this.budgetForm = this.fb.group({
            categoryId: ['', Validators.required],
            amount: [null, [Validators.required, Validators.min(1)]],
            month: [today.getMonth() + 1, Validators.required],
            year: [today.getFullYear(), Validators.required],
            alertThreshold: [80, [Validators.required, Validators.min(1), Validators.max(100)]]
        });
    }

    public loadCategories(): void {
        this.categoriesService.getCategoriesByType('expense').subscribe({
            next: (cats) => this.categories = cats,
            error: (err) => console.error('Error loading categories', err)
        });
    }

    public checkEditMode(): void {
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

    public onSubmit(): void {
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
                this.alertService.success(
                    this.isEditMode ? 'Presupuesto actualizado correctamente' : 'Presupuesto creado correctamente',
                    '¡Éxito!'
                );
                setTimeout(() => {
                    this.router.navigate(['/budgets']);
                }, 1500);
            },
            error: (err) => {
                this.alertService.error(
                    err.error?.message || err.message || 'Error al guardar el presupuesto',
                    'Error'
                );
                this.isSubmitting = false;
            }
        });
    }

    public onCancel(): void {
        this.router.navigate(['/budgets']);
    }

    // Getters
    public get categoryId() {
        return this.budgetForm.get('categoryId');
    }

    public get amount() {
        return this.budgetForm.get('amount');
    }

    public get month() {
        return this.budgetForm.get('month');
    }

    public get year() {
        return this.budgetForm.get('year');
    }

    public get alertThreshold() {
        return this.budgetForm.get('alertThreshold');
    }
}
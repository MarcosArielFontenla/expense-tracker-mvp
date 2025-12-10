import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BudgetService } from '../services/budget.service';
import { CategoriesService } from '../../categories/services/categories.service';
import { BudgetStatus } from '../../../core/models/budget.model';
import { Category } from '../../../core/models/category.model';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';

@Component({
    selector: 'app-budget-list',
    imports: [CommonModule, RouterModule, FormsModule, CurrencyPipe],
    templateUrl: './budget-list.html',
    styleUrl: './budget-list.css',
    standalone: true
})
export class BudgetList implements OnInit {
    budgets: BudgetStatus[] = [];
    categories: Map<string, Category> = new Map();
    userCurrency: string = 'USD';

    selectedMonth: number;
    selectedYear: number;

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
        private budgetService: BudgetService,
        private categoriesService: CategoriesService,
        private authService: AuthService,
        private alertService: AlertService,
        @Inject(PLATFORM_ID) private platformId: Object) {
        const today = new Date();
        this.selectedMonth = today.getMonth() + 1;
        this.selectedYear = today.getFullYear();

        // Generate last 5 years
        for (let i = 0; i < 5; i++) {
            this.years.push(this.selectedYear - i);
        }
    }

    public ngOnInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            // Get user currency
            this.authService.currentUser$.subscribe(user => {
                if (user) {
                    this.userCurrency = user.currency || 'USD';
                }
            });

            this.loadCategories();
        }
    }

    public loadCategories(): void {
        this.categoriesService.getCategories().subscribe(cats => {
            cats.forEach(c => this.categories.set(c.id, c));
            this.loadBudgets();
        });
    }

    public loadBudgets(): void {
        this.budgetService.getBudgets(Number(this.selectedMonth), Number(this.selectedYear))
            .subscribe(budgets => {
                this.budgets = budgets;
            });
    }

    public onPeriodChange(): void {
        this.loadBudgets();
    }

    public getCategory(id: string): Category | undefined {
        return this.categories.get(id);
    }

    public getProgressBarColor(status: BudgetStatus): string {
        if (status.isOverBudget)
            return 'bg-red-600';

        if (status.hasAlert)
            return 'bg-yellow-500';

        return 'bg-green-500';
    }

    public deleteBudget(id: string): void {
        this.alertService.confirmDelete('este presupuesto').then((confirmed) => {
            if (confirmed) {
                this.budgetService.deleteBudget(id).subscribe({
                    next: () => {
                        this.alertService.success('Presupuesto eliminado correctamente');
                        this.loadBudgets();
                    },
                    error: (err) => {
                        this.alertService.error('Error al eliminar el presupuesto');
                        console.error(err);
                    }
                });
            }
        });
    }
}
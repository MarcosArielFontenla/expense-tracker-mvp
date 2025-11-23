import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of, switchMap, combineLatest } from 'rxjs';
import { Budget, BudgetDTO, BudgetStatus } from '../../../core/models/budget.model';
import { TransactionsService } from '../../transactions/service/transactions.service';

@Injectable({
    providedIn: 'root'
})
export class BudgetService {
    private budgetsSubject = new BehaviorSubject<Budget[]>([]);
    public budgets$ = this.budgetsSubject.asObservable();

    constructor(private transactionsService: TransactionsService) {
        // Initialize with some mock data if needed, or empty
        this.budgetsSubject.next([]);
    }

    getBudgets(month: number, year: number): Observable<BudgetStatus[]> {
        return combineLatest([
            this.budgets$,
            this.transactionsService.transactions$
        ]).pipe(
            map(([budgets, transactions]) => {
                // Filter budgets for the specified month/year
                const periodBudgets = budgets.filter(b => b.month === month && b.year === year);

                // Calculate status for each budget
                return periodBudgets.map(budget => {
                    // Calculate total spent for this category in this month/year
                    const spent = transactions
                        .filter(t =>
                            t.categoryId === budget.categoryId &&
                            t.type === 'expense' &&
                            new Date(t.date).getMonth() + 1 === month &&
                            new Date(t.date).getFullYear() === year
                        )
                        .reduce((sum, t) => sum + t.amount, 0);

                    const percentageUsed = (spent / budget.amount) * 100;

                    return {
                        budget,
                        spent,
                        remaining: budget.amount - spent,
                        percentageUsed,
                        isOverBudget: spent > budget.amount,
                        hasAlert: percentageUsed >= budget.alertThreshold
                    };
                });
            })
        );
    }

    getBudgetById(id: string): Observable<Budget | undefined> {
        return this.budgets$.pipe(
            map(budgets => budgets.find(b => b.id === id))
        );
    }

    createBudget(budgetDTO: BudgetDTO): Observable<void> {
        const currentBudgets = this.budgetsSubject.value;

        // Check if budget already exists for this category/month/year
        const exists = currentBudgets.some(b =>
            b.categoryId === budgetDTO.categoryId &&
            b.month === budgetDTO.month &&
            b.year === budgetDTO.year
        );

        if (exists) {
            throw new Error('Ya existe un presupuesto para esta categoría en este periodo.');
        }

        const newBudget: Budget = {
            id: this.generateId(),
            ...budgetDTO,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.budgetsSubject.next([...currentBudgets, newBudget]);
        return of(void 0);
    }

    updateBudget(id: string, budgetDTO: BudgetDTO): Observable<void> {
        const currentBudgets = this.budgetsSubject.value;
        const index = currentBudgets.findIndex(b => b.id === id);

        if (index === -1) {
            throw new Error('Presupuesto no encontrado');
        }

        // Check for duplicates (excluding current)
        const exists = currentBudgets.some(b =>
            b.id !== id &&
            b.categoryId === budgetDTO.categoryId &&
            b.month === budgetDTO.month &&
            b.year === budgetDTO.year
        );

        if (exists) {
            throw new Error('Ya existe un presupuesto para esta categoría en este periodo.');
        }

        const updatedBudget: Budget = {
            ...currentBudgets[index],
            ...budgetDTO,
            updatedAt: new Date()
        };

        const updatedBudgets = [...currentBudgets];
        updatedBudgets[index] = updatedBudget;

        this.budgetsSubject.next(updatedBudgets);
        return of(void 0);
    }

    deleteBudget(id: string): Observable<void> {
        const currentBudgets = this.budgetsSubject.value;
        this.budgetsSubject.next(currentBudgets.filter(b => b.id !== id));
        return of(void 0);
    }

    private generateId(): string {
        return Math.random().toString(36).substring(2, 9);
    }
}

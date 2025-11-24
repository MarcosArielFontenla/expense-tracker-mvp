import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { Budget, BudgetDTO, BudgetStatus } from '../../../core/models/budget.model';
import { environment } from '../../../environments/environment.development';

@Injectable({
    providedIn: 'root'
})
export class BudgetService {
    private budgetsSubject = new BehaviorSubject<BudgetStatus[]>([]);
    public budgets$ = this.budgetsSubject.asObservable();

    private apiUrl = `${environment.apiUrl}/budgets`;

    constructor(private http: HttpClient) { }

    public getBudgets(month: number, year: number): Observable<BudgetStatus[]> {
        return this.http.get<BudgetStatus[]>(`${this.apiUrl}/${month}/${year}`)
            .pipe(tap(budgets => this.budgetsSubject.next(budgets)));
    }

    public getBudgetById(id: string): Observable<Budget> {
        const budgets = this.budgetsSubject.value;
        const budgetStatus = budgets.find(b => b.budget.id === id);

        return new Observable(observer => {
            if (budgetStatus) {
                observer.next(budgetStatus.budget);
                observer.complete();
            } else {
                observer.error('Budget not found');
            }
        });
    }

    public createBudget(budgetDTO: BudgetDTO): Observable<Budget> {
        return this.http.post<Budget>(this.apiUrl, budgetDTO)
            .pipe(tap(() => this.refreshBudgets(budgetDTO.month, budgetDTO.year)));
    }

    public updateBudget(id: string, budgetDTO: Partial<BudgetDTO>): Observable<Budget> {
        return this.http.put<Budget>(`${this.apiUrl}/${id}`, budgetDTO)
            .pipe(
                tap(() => {
                    const now = new Date();
                    this.refreshBudgets(now.getMonth() + 1, now.getFullYear());
                })
            );
    }

    public deleteBudget(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`)
            .pipe(
                tap(() => {
                    const now = new Date();
                    this.refreshBudgets(now.getMonth() + 1, now.getFullYear());
                })
            );
    }

    private refreshBudgets(month: number, year: number): void {
        this.getBudgets(month, year).subscribe();
    }
}
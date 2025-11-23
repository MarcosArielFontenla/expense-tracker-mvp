import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Transaction, TransactionDTO, TransactionFilter, MonthlySummary } from '../../../core/models/transaction.model';
import { CategoriesService } from '../../categories/services/categories.service';

@Injectable({
    providedIn: 'root'
})
export class TransactionsService {
    private transactions: Transaction[] = [];
    private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
    public transactions$ = this.transactionsSubject.asObservable();

    constructor(private categoriesService: CategoriesService) {
        this.initializeMockTransactions();
    }

    private initializeMockTransactions(): void {
        // Generate some mock data
        const today = new Date();

        // We need to wait for categories to be available to link them, 
        // but for mock data we can just use placeholders or wait a bit.
        // For now, let's assume we have some categories or just use IDs.

        // This is a simplified mock. In a real app, we'd fetch from API.
        this.transactions = [];
        this.transactionsSubject.next(this.transactions);
    }

    getTransactions(filter?: TransactionFilter): Observable<Transaction[]> {
        let filtered = [...this.transactions];

        if (filter) {
            if (filter.type) {
                filtered = filtered.filter(t => t.type === filter.type);
            }
            if (filter.categoryId) {
                filtered = filtered.filter(t => t.categoryId === filter.categoryId);
            }
            if (filter.startDate) {
                filtered = filtered.filter(t => new Date(t.date) >= filter.startDate!);
            }
            if (filter.endDate) {
                filtered = filtered.filter(t => new Date(t.date) <= filter.endDate!);
            }
        }

        // Sort by date desc
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Enrich with category data
        return this.enrichTransactionsWithCategory(filtered);
    }

    getTransactionById(id: string): Observable<Transaction | undefined> {
        const transaction = this.transactions.find(t => t.id === id);
        if (!transaction) return of(undefined);

        return this.enrichTransactionWithCategory(transaction);
    }

    createTransaction(dto: TransactionDTO): Observable<Transaction> {
        const newTransaction: Transaction = {
            id: this.generateId(),
            ...dto,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.transactions.push(newTransaction);
        this.transactionsSubject.next([...this.transactions]);

        return this.enrichTransactionWithCategory(newTransaction);
    }

    updateTransaction(id: string, dto: TransactionDTO): Observable<Transaction> {
        const index = this.transactions.findIndex(t => t.id === id);
        if (index === -1) return throwError(() => new Error('Transacción no encontrada'));

        const updatedTransaction: Transaction = {
            ...this.transactions[index],
            ...dto,
            updatedAt: new Date()
        };

        this.transactions[index] = updatedTransaction;
        this.transactionsSubject.next([...this.transactions]);

        return this.enrichTransactionWithCategory(updatedTransaction);
    }

    deleteTransaction(id: string): Observable<void> {
        const index = this.transactions.findIndex(t => t.id === id);
        if (index === -1) return throwError(() => new Error('Transacción no encontrada'));

        this.transactions.splice(index, 1);
        this.transactionsSubject.next([...this.transactions]);

        return of(void 0).pipe(delay(200));
    }

    getMonthlySummary(month: number, year: number): Observable<MonthlySummary> {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0);

        const monthlyTransactions = this.transactions.filter(t => {
            const d = new Date(t.date);
            return d >= start && d <= end;
        });

        const summary: MonthlySummary = {
            month,
            year,
            totalIncome: monthlyTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0),
            totalExpense: monthlyTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0),
            balance: 0,
            transactionCount: monthlyTransactions.length
        };

        summary.balance = summary.totalIncome - summary.totalExpense;

        return of(summary).pipe(delay(200));
    }

    // Helper to join category data
    private enrichTransactionsWithCategory(transactions: Transaction[]): Observable<Transaction[]> {
        return this.categoriesService.getCategories().pipe(
            map(categories => {
                return transactions.map(t => ({
                    ...t,
                    category: categories.find(c => c.id === t.categoryId)
                }));
            })
        );
    }

    private enrichTransactionWithCategory(transaction: Transaction): Observable<Transaction> {
        return this.categoriesService.getCategoryById(transaction.categoryId).pipe(
            map(category => ({
                ...transaction,
                category
            }))
        );
    }

    private generateId(): string {
        return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

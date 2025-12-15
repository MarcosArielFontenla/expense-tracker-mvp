import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { Transaction, TransactionDTO, TransactionFilter, MonthlySummary } from '../../../core/models/transaction.model';
import { environment } from '../../../environments/environment';
import { SubscriptionService } from '../../../core/services/subscription.service';

@Injectable({
    providedIn: 'root'
})
export class TransactionsService {
    private refreshSubject = new Subject<void>();
    public refresh$ = this.refreshSubject.asObservable();

    private apiUrl = `${environment.apiUrl}/transactions`;

    constructor(
        private http: HttpClient,
        private subscriptionService: SubscriptionService
    ) { }

    public getTransactions(filter?: TransactionFilter): Observable<Transaction[]> {
        let params = new HttpParams();

        if (filter) {
            if (filter.type) params = params.set('type', filter.type);
            if (filter.categoryId) params = params.set('categoryId', filter.categoryId);
            if (filter.startDate) params = params.set('startDate', filter.startDate.toISOString());
            if (filter.endDate) params = params.set('endDate', filter.endDate.toISOString());
            if (filter.search) params = params.set('search', filter.search);
            if (filter.minAmount !== undefined && filter.minAmount !== null) params = params.set('minAmount', filter.minAmount.toString());
            if (filter.maxAmount !== undefined && filter.maxAmount !== null) params = params.set('maxAmount', filter.maxAmount.toString());
            if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
            if (filter.sortOrder) params = params.set('sortOrder', filter.sortOrder);
        }

        return this.http.get<Transaction[]>(this.apiUrl, { params });
    }

    public getMonthlySummary(month: number, year: number): Observable<MonthlySummary> {
        return this.http.get<MonthlySummary>(`${this.apiUrl}/summary/${month}/${year}`);
    }

    public getTransactionById(id: string): Observable<Transaction> {
        return this.http.get<Transaction>(`${this.apiUrl}/${id}`);
    }

    public createTransaction(transaction: TransactionDTO): Observable<Transaction> {
        return this.http.post<Transaction>(this.apiUrl, transaction).pipe(
            tap(() => this.refreshTransactions())
        );
    }

    public updateTransaction(id: string, transaction: TransactionDTO): Observable<Transaction> {
        return this.http.put<Transaction>(`${this.apiUrl}/${id}`, transaction).pipe(
            tap(() => this.refreshTransactions())
        );
    }

    public deleteTransaction(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            tap(() => this.refreshTransactions())
        );
    }

    private refreshTransactions(): void {
        this.refreshSubject.next();
        this.subscriptionService.refreshUsage();
    }
}
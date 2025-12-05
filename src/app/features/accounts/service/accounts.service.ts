import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { Account, AccountDTO } from '../../../core/models/account.model';
import { environment } from '../../../environments/environment.development';

@Injectable({
    providedIn: 'root'
})
export class AccountsService {
    private refreshSubject = new Subject<void>();
    public refresh$ = this.refreshSubject.asObservable();

    private apiUrl = `${environment.apiUrl}/accounts`;

    constructor(private http: HttpClient) { }

    public getAccounts(): Observable<Account[]> {
        return this.http.get<Account[]>(this.apiUrl);
    }

    public getAccountById(id: string): Observable<Account> {
        return this.http.get<Account>(`${this.apiUrl}/${id}`);
    }

    public createAccount(account: AccountDTO): Observable<Account> {
        return this.http.post<Account>(this.apiUrl, account).pipe(
            tap(() => this.refreshAccounts())
        );
    }

    public updateAccount(id: string, account: AccountDTO): Observable<Account> {
        return this.http.put<Account>(`${this.apiUrl}/${id}`, account).pipe(
            tap(() => this.refreshAccounts())
        );
    }

    public deleteAccount(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            tap(() => this.refreshAccounts())
        );
    }

    public archiveAccount(id: string): Observable<Account> {
        return this.http.patch<Account>(`${this.apiUrl}/${id}/archive`, {}).pipe(
            tap(() => this.refreshAccounts())
        );
    }

    public recalculateBalance(id: string): Observable<Account> {
        return this.http.post<Account>(`${this.apiUrl}/${id}/recalculate`, {}).pipe(
            tap(() => this.refreshAccounts())
        );
    }

    public refreshAccounts(): void {
        this.refreshSubject.next();
    }
}

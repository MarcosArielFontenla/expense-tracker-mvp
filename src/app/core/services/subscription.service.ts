import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SubscriptionStatusResponse } from '../models/subscription.model';

import { BehaviorSubject, tap } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SubscriptionService {
    private apiUrl = `${environment.apiUrl}/subscription`;

    private usageSubject = new BehaviorSubject<SubscriptionStatusResponse | null>(null);
    usage$ = this.usageSubject.asObservable();

    constructor(private http: HttpClient) { }

    getUsage(): Observable<SubscriptionStatusResponse> {
        return this.http.get<SubscriptionStatusResponse>(`${this.apiUrl}/usage`).pipe(
            tap(usage => this.usageSubject.next(usage))
        );
    }

    refreshUsage(): void {
        this.getUsage().subscribe();
    }

    public checkAllTrials(): Observable<any> {
        return this.http.post(`${this.apiUrl}/check-trials`, {});
    }

    public trackExport(format: 'csv' | 'excel' | 'pdf'): Observable<any> {
        return this.http.post(`${environment.apiUrl}/reports/track-export`, { format }).pipe(
            tap(() => this.refreshUsage())
        );
    }

    public downgradeToFree(): Observable<any> {
        return this.http.post(`${this.apiUrl}/downgrade`, {}).pipe(
            tap(() => this.refreshUsage())
        );
    }
}

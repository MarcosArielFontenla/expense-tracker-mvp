import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { Transaction } from '../../../core/models/transaction.model';

export interface ExpenseByCategory {
    category: string;
    color: string;
    total: number;
}

export interface IncomeByCategory {
    category: string;
    color: string;
    total: number;
}

export interface CashFlowData {
    month: string;
    income: number;
    expense: number;
}

export interface CategoryBreakdown {
    categoryId: string;
    categoryName: string;
    categoryColor: string;
    type: string;
    total: number;
    count: number;
}

export interface ReportSummary {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
}

export interface CustomRangeReport {
    transactions: Transaction[];
    summary: ReportSummary;
}

export interface DetailedMonthlyReport {
    transactions: Transaction[];
    categoryBreakdown: CategoryBreakdown[];
    summary: ReportSummary;
}

export interface CategoryStats {
    total: number;
    count: number;
    minAmount: number;
    maxAmount: number;
    average: number;
}

export interface CategoryDetailedReport {
    transactions: Transaction[];
    stats: CategoryStats;
}

@Injectable({
    providedIn: 'root'
})
export class ReportsService {
    private apiUrl = `${environment.apiUrl}/reports`;

    constructor(private http: HttpClient) { }

    public getMonthlyExpensesByCategory(month: number, year: number): Observable<ExpenseByCategory[]> {
        return this.http.get<ExpenseByCategory[]>(`${this.apiUrl}/monthly-expenses`, {
            params: { month: month.toString(), year: year.toString() }
        });
    }

    public getMonthlyIncomeByCategory(month: number, year: number): Observable<IncomeByCategory[]> {
        return this.http.get<IncomeByCategory[]>(`${this.apiUrl}/monthly-income`, {
            params: { month: month.toString(), year: year.toString() }
        });
    }

    public getCashFlow(): Observable<CashFlowData[]> {
        return this.http.get<CashFlowData[]>(`${this.apiUrl}/cash-flow`);
    }

    public getCustomRangeReport(startDate: string, endDate: string, categoryId?: string, type?: string): Observable<CustomRangeReport> {
        let params: any = { startDate, endDate };
        if (categoryId) params.categoryId = categoryId;
        if (type) params.type = type;

        return this.http.get<CustomRangeReport>(`${this.apiUrl}/custom-range`, { params });
    }

    public getDetailedMonthlyReport(month: number, year: number): Observable<DetailedMonthlyReport> {
        return this.http.get<DetailedMonthlyReport>(`${this.apiUrl}/monthly-detailed`, {
            params: { month: month.toString(), year: year.toString() }
        });
    }

    public getCategoryDetailedReport(categoryId: string, startDate?: string, endDate?: string): Observable<CategoryDetailedReport> {
        let params: any = { categoryId };
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        return this.http.get<CategoryDetailedReport>(`${this.apiUrl}/category-detailed`, { params });
    }
}
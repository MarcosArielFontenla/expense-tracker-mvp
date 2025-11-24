import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Category } from '../../../core/models/category.model';
import { environment } from '../../../environments/environment.development';

@Injectable({
    providedIn: 'root'
})
export class CategoriesService {
    private categoriesSubject = new BehaviorSubject<Category[]>([]);
    public categories$ = this.categoriesSubject.asObservable();

    private apiUrl = `${environment.apiUrl}/categories`;

    constructor(
        private http: HttpClient,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {
        if (isPlatformBrowser(this.platformId)) {
            this.loadCategories();
        }
    }

    private loadCategories(): void {
        this.getCategories().subscribe({
            next: (categories) => this.categoriesSubject.next(categories),
            error: (error) => console.error('Error loading categories:', error)
        });
    }

    getCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(this.apiUrl);
    }

    getCategoryById(id: string): Observable<Category> {
        return this.http.get<Category>(`${this.apiUrl}/${id}`);
    }

    getCategoriesByType(type: 'income' | 'expense'): Observable<Category[]> {
        return this.http.get<Category[]>(`${this.apiUrl}?type=${type}`);
    }

    createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Observable<Category> {
        return this.http.post<Category>(this.apiUrl, category).pipe(
            tap(() => this.loadCategories())
        );
    }

    updateCategory(id: string, category: Partial<Category>): Observable<Category> {
        return this.http.put<Category>(`${this.apiUrl}/${id}`, category).pipe(
            tap(() => this.loadCategories())
        );
    }

    deleteCategory(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            tap(() => this.loadCategories())
        );
    }
}

import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment.development';

interface LoginRequest {
    email: string;
    password: string;
}

interface RegisterRequest {
    name: string;
    email: string;
    password: string;
}

interface AuthResponse {
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<any>(null);
    public currentUser$ = this.currentUserSubject.asObservable();
    private tokenKey = 'auth_token';
    private userKey = 'auth_user';
    private isBrowser: boolean;

    constructor(
        private http: HttpClient,
        private router: Router,
        @Inject(PLATFORM_ID) platformId: Object) {
        this.isBrowser = isPlatformBrowser(platformId);

        // Check if user is already logged in (only in browser)
        if (this.isBrowser) {
            const token = this.getToken();
            const user = this.getUser();

            if (token && user) {
                this.currentUserSubject.next(user);
            }
        }
    }

    public register(data: RegisterRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, data)
            .pipe(
                tap(response => this.handleAuthResponse(response))
            );
    }

    public login(data: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, data)
            .pipe(
                tap(response => this.handleAuthResponse(response))
            );
    }

    public logout(): void {
        if (this.isBrowser) {
            localStorage.removeItem(this.tokenKey);
            localStorage.removeItem(this.userKey);
        }
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
    }

    public getToken(): string | null {
        if (this.isBrowser) {
            return localStorage.getItem(this.tokenKey);
        }
        return null;
    }

    public getUser(): any | null {
        if (this.isBrowser) {
            const userStr = localStorage.getItem(this.userKey);
            return userStr ? JSON.parse(userStr) : null;
        }
        return null;
    }

    public isAuthenticated(): boolean {
        return !!this.getToken();
    }

    private handleAuthResponse(response: AuthResponse): void {
        if (this.isBrowser) {
            localStorage.setItem(this.tokenKey, response.token);
            localStorage.setItem(this.userKey, JSON.stringify(response.user));
        }
        this.currentUserSubject.next(response.user);
    }
}
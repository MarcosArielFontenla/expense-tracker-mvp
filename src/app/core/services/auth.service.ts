import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment.development';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<any>(null);
    public currentUser$ = this.currentUserSubject.asObservable();
    private accessTokenKey = 'access_token';
    private refreshTokenKey = 'refresh_token';
    private userKey = 'auth_user';
    private isBrowser: boolean;

    constructor(
        private http: HttpClient,
        private router: Router,
        @Inject(PLATFORM_ID) platformId: Object) {
        this.isBrowser = isPlatformBrowser(platformId);

        // Check if user is already logged in (only in browser)
        if (this.isBrowser) {
            const token = this.getAccessToken();
            const user = this.getUser();

            if (token && user) {
                this.currentUserSubject.next(user);
            }
        }
    }

    public register(data: RegisterRequest): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/auth/register`, data);
    }

    public login(data: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, data)
            .pipe(tap(response => this.handleAuthResponse(response)));
    }

    public refreshAccessToken(): Observable<any> {
        const refreshToken = this.getRefreshToken();

        return this.http.post<any>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
            .pipe(tap(response => {
                this.setTokens(response.accessToken, response.refreshToken);
            }));
    }

    public requestPasswordReset(email: string): Observable<any> {
        return this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email });
    }

    public getProfile(): Observable<any> {
        return this.http.get(`${environment.apiUrl}/auth/profile`);
    }

    public updateProfile(data: { name?: string; currency?: string }): Observable<any> {
        return this.http.patch(`${environment.apiUrl}/auth/profile`, data)
            .pipe(tap(user => {
                if (this.isBrowser) {
                    localStorage.setItem(this.userKey, JSON.stringify(user));
                    this.currentUserSubject.next(user);
                }
            }));
    }

    public logout(): Observable<any> {
        const headers = {
            'Authorization': `Bearer ${this.getAccessToken()}`
        };

        return this.http.post(`${environment.apiUrl}/auth/logout`, {}, { headers })
            .pipe(tap(() => {
                this.clearTokens();
                this.currentUserSubject.next(null);
                this.router.navigate(['/login']);
            }));
    }

    public getAccessToken(): string | null {
        if (this.isBrowser) {
            return localStorage.getItem(this.accessTokenKey);
        }
        return null;
    }

    public getRefreshToken(): string | null {
        if (this.isBrowser) {
            return localStorage.getItem(this.refreshTokenKey);
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
        return !!this.getAccessToken();
    }

    public setTokens(accessToken: string, refreshToken: string): void {
        if (this.isBrowser) {
            localStorage.setItem(this.accessTokenKey, accessToken);
            localStorage.setItem(this.refreshTokenKey, refreshToken);
        }
    }

    public clearTokens(): void {
        if (this.isBrowser) {
            localStorage.removeItem(this.accessTokenKey);
            localStorage.removeItem(this.refreshTokenKey);
            localStorage.removeItem(this.userKey);
        }
    }

    private handleAuthResponse(response: any): void {
        if (this.isBrowser) {
            localStorage.setItem(this.accessTokenKey, response.accessToken);
            localStorage.setItem(this.refreshTokenKey, response.refreshToken);
            localStorage.setItem(this.userKey, JSON.stringify(response.user));
        }
        this.currentUserSubject.next(response.user);
    }
}
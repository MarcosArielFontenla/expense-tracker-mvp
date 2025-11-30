import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Don't add token to auth endpoints
    const isAuthEndpoint = req.url.includes('/auth/login') ||
        req.url.includes('/auth/register') ||
        req.url.includes('/auth/refresh') ||
        req.url.includes('/auth/verify-email') ||
        req.url.includes('/auth/forgot-password') ||
        req.url.includes('/auth/reset-password');

    if (isAuthEndpoint) {
        return next(req);
    }

    // Add access token to request
    const accessToken = authService.getAccessToken();

    if (accessToken) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${accessToken}`
            }
        });
    }

    // Handle response and auto-refresh on 401
    return next(req).pipe(
        catchError(error => {
            if (error.status === 401 && !req.url.includes('/auth/refresh')) {
                // Try to refresh token
                return authService.refreshAccessToken().pipe(
                    switchMap(() => {
                        // Retry original request with new token
                        const newToken = authService.getAccessToken();
                        const clonedReq = req.clone({
                            setHeaders: {
                                Authorization: `Bearer ${newToken}`
                            }
                        });
                        return next(clonedReq);
                    }),
                    catchError(refreshError => {
                        authService.clearTokens();
                        router.navigate(['/login']);
                        return throwError(() => refreshError);
                    })
                );
            }
            return throwError(() => error);
        })
    );
};
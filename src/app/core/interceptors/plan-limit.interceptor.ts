import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { UpgradeService } from '../services/upgrade.service';

export const planLimitInterceptor: HttpInterceptorFn = (req, next) => {
    const upgradeService = inject(UpgradeService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // Check for 403 and keywords in message indicating plan limit
            if (error.status === 403 && (
                error.error?.message?.toLowerCase().includes('limit') ||
                error.error?.message?.toLowerCase().includes('upgrade'))) {
                upgradeService.showUpgradeModal(error.error.message);
            }
            return throwError(() => error);
        })
    );
};
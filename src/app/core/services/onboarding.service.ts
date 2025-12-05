import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

export interface OnboardingStep {
    id: string;
    title: string;
    message: string;
    targetSelector: string;
    position: 'top' | 'bottom' | 'left' | 'right';
    route?: string;
}

@Injectable({
    providedIn: 'root'
})
export class OnboardingService {
    private readonly STORAGE_KEY = 'fintrack_onboarding_completed';
    private isBrowser: boolean;

    steps: OnboardingStep[] = [
        {
            id: 'welcome',
            title: '¡Bienvenido a FinTrack! 🎉',
            message: 'Te guiaremos por las funciones principales de la aplicación para que puedas aprovecharla al máximo.',
            targetSelector: '.dashboard-header',
            position: 'bottom',
            route: '/dashboard'
        },
        {
            id: 'summary-cards',
            title: 'Tu Resumen Financiero 📊',
            message: 'Aquí verás tus ingresos totales, gastos y el balance actual. Estos valores se actualizan automáticamente.',
            targetSelector: '.summary-cards',
            position: 'bottom',
            route: '/dashboard'
        },
        {
            id: 'new-transaction',
            title: 'Registra Movimientos ➕',
            message: 'Haz click aquí para registrar un nuevo ingreso o gasto. ¡Es muy fácil!',
            targetSelector: '.btn-new-transaction',
            position: 'left',
            route: '/dashboard'
        },
        {
            id: 'transactions-menu',
            title: 'Historial de Transacciones 💸',
            message: 'Aquí encontrarás todas tus transacciones con búsqueda y filtros avanzados.',
            targetSelector: '[href="/transactions"]',
            position: 'right'
        },
        {
            id: 'categories-menu',
            title: 'Categorías Personalizadas 🏷️',
            message: 'Crea y personaliza categorías para organizar mejor tus finanzas.',
            targetSelector: '[href="/categories"]',
            position: 'right'
        },
        {
            id: 'reports-menu',
            title: 'Reportes y Exportación 📈',
            message: 'Genera reportes detallados y exporta tus datos a Excel, CSV o PDF.',
            targetSelector: '[href="/reports"]',
            position: 'right'
        },
        {
            id: 'settings-menu',
            title: 'Configuración ⚙️',
            message: 'Ajusta tu moneda, zona horaria y otras preferencias personales.',
            targetSelector: '[href="/settings"]',
            position: 'right'
        }
    ];

    currentStepIndex$ = new BehaviorSubject<number>(0);
    isActive$ = new BehaviorSubject<boolean>(false);

    constructor(
        private router: Router,
        @Inject(PLATFORM_ID) private platformId: Object) {
        this.isBrowser = isPlatformBrowser(this.platformId);
    }

    get currentStep(): OnboardingStep {
        return this.steps[this.currentStepIndex$.value];
    }

    get totalSteps(): number {
        return this.steps.length;
    }

    get isFirstStep(): boolean {
        return this.currentStepIndex$.value === 0;
    }

    get isLastStep(): boolean {
        return this.currentStepIndex$.value === this.steps.length - 1;
    }

    shouldShowOnboarding(): boolean {
        if (!this.isBrowser)
            return false;

        return localStorage.getItem(this.STORAGE_KEY) !== 'true';
    }

    startOnboarding(): void {
        if (!this.isBrowser)
            return;

        this.currentStepIndex$.next(0);
        this.isActive$.next(true);
        this.navigateToStepRoute();
    }

    nextStep(): void {
        if (this.currentStepIndex$.value < this.steps.length - 1) {
            this.currentStepIndex$.next(this.currentStepIndex$.value + 1);
            this.navigateToStepRoute();
        } else {
            this.completeOnboarding();
        }
    }

    previousStep(): void {
        if (this.currentStepIndex$.value > 0) {
            this.currentStepIndex$.next(this.currentStepIndex$.value - 1);
            this.navigateToStepRoute();
        }
    }

    skipOnboarding(): void {
        this.completeOnboarding();
    }

    completeOnboarding(): void {
        if (this.isBrowser) {
            localStorage.setItem(this.STORAGE_KEY, 'true');
        }
        this.isActive$.next(false);
        this.currentStepIndex$.next(0);
    }

    resetOnboarding(): void {
        if (this.isBrowser) {
            localStorage.removeItem(this.STORAGE_KEY);
        }
    }

    private navigateToStepRoute(): void {
        const step = this.currentStep;
        if (step.route && this.router.url !== step.route) {
            this.router.navigate([step.route]);
        }
    }
}

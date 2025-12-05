import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { OnboardingService, OnboardingStep } from '../../../core/services/onboarding.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-onboarding-overlay',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './onboarding-overlay.html',
    styleUrl: './onboarding-overlay.css'
})
export class OnboardingOverlay implements OnInit, OnDestroy {
    isActive = false;
    currentStep: OnboardingStep | null = null;
    currentStepIndex = 0;
    totalSteps = 0;
    tooltipPosition = { top: '50%', left: '50%' };
    spotlightRect = { top: 0, left: 0, width: 0, height: 0 };

    private subscriptions: Subscription[] = [];
    private isBrowser: boolean;

    constructor(
        public onboardingService: OnboardingService,
        @Inject(PLATFORM_ID) private platformId: Object) {
        this.isBrowser = isPlatformBrowser(this.platformId);
    }

    ngOnInit(): void {
        if (!this.isBrowser) return;

        this.totalSteps = this.onboardingService.totalSteps;

        this.subscriptions.push(
            this.onboardingService.isActive$.subscribe(active => {
                this.isActive = active;
                if (active) {
                    setTimeout(() => this.updatePositions(), 100);
                }
            })
        );

        this.subscriptions.push(
            this.onboardingService.currentStepIndex$.subscribe(index => {
                this.currentStepIndex = index;
                this.currentStep = this.onboardingService.steps[index];
                if (this.isActive) {
                    setTimeout(() => this.updatePositions(), 100);
                }
            })
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    public updatePositions(): void {
        if (!this.currentStep || !this.isBrowser)
            return;

        const element = document.querySelector(this.currentStep.targetSelector);
        if (!element) {
            this.spotlightRect = { top: 0, left: 0, width: 0, height: 0 };
            this.tooltipPosition = { top: '50%', left: '50%' };
            return;
        }

        const rect = element.getBoundingClientRect();
        const padding = 8;

        // Spotlight position
        this.spotlightRect = {
            top: rect.top - padding,
            left: rect.left - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2
        };

        // Tooltip position based on step config
        const tooltipWidth = 320;
        const tooltipHeight = 200;
        const margin = 16;

        let top: number;
        let left: number;

        switch (this.currentStep.position) {
            case 'top':
                top = rect.top - tooltipHeight - margin;
                left = rect.left + rect.width / 2 - tooltipWidth / 2;
                break;
            case 'bottom':
                top = rect.bottom + margin;
                left = rect.left + rect.width / 2 - tooltipWidth / 2;
                break;
            case 'left':
                top = rect.top + rect.height / 2 - tooltipHeight / 2;
                left = rect.left - tooltipWidth - margin;
                break;
            case 'right':
            default:
                top = rect.top + rect.height / 2 - tooltipHeight / 2;
                left = rect.right + margin;
                break;
        }

        // Keep tooltip within viewport
        top = Math.max(margin, Math.min(top, window.innerHeight - tooltipHeight - margin));
        left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin));

        this.tooltipPosition = { top: `${top}px`, left: `${left}px` };
    }

    onNext(): void {
        this.onboardingService.nextStep();
    }

    onPrevious(): void {
        this.onboardingService.previousStep();
    }

    onSkip(): void {
        this.onboardingService.skipOnboarding();
    }

    onComplete(): void {
        this.onboardingService.completeOnboarding();
    }

    get isFirstStep(): boolean {
        return this.onboardingService.isFirstStep;
    }

    get isLastStep(): boolean {
        return this.onboardingService.isLastStep;
    }
}
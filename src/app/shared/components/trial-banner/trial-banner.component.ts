import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-trial-banner',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './trial-banner.component.html',
    styleUrl: './trial-banner.component.css'
})
export class TrialBannerComponent implements OnInit {
    isVisible = false;
    daysRemaining = 0;
    isExpired = false;

    constructor(
        private subscriptionService: SubscriptionService,
        private authService: AuthService,
        private router: Router) { }

    ngOnInit(): void {
        // We can get trial info from auth user directly since we added it to User entity
        // But subscription usage has the most up-to-date status usually.
        this.authService.currentUser$.subscribe(user => {
            if (user && user.subStatus === 'trialing' && user.trialStartDate) {
                this.calculateDays(user.trialStartDate);
            } else if (user && user.subStatus === 'active') {
                this.isVisible = false;
            }
        });

        // Also listen to usage updates which might refresh status
        this.subscriptionService.usage$.subscribe(status => {
            if (status && status.subStatus === 'trialing') {
                // We need trialStartDate here. 
                // If not in status response, we rely on auth user or fetch specific trial info.
                // Let's assume authUser is enough for now as it's updated on login/refresh.
            }
        });
    }

    calculateDays(startDate: Date | string): void {
        const start = new Date(startDate);
        const now = new Date();
        const end = new Date(start);
        end.setDate(end.getDate() + 14); // 14 days trial

        const diff = end.getTime() - now.getTime();
        this.daysRemaining = Math.ceil(diff / (1000 * 3600 * 24));

        if (this.daysRemaining <= 0) {
            this.isExpired = true;
        }

        this.isVisible = true;
    }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { SubscriptionStatusResponse } from '../../../core/models/subscription.model';
import { UpgradeService } from '../../../core/services/upgrade.service';

@Component({
  selector: 'app-plan-usage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plan-usage.component.html',
  styleUrl: './plan-usage.component.css'
})
export class PlanUsageComponent implements OnInit {
  status: SubscriptionStatusResponse | null = null;

  constructor(
    private subscriptionService: SubscriptionService,
    private upgradeService: UpgradeService) { }

  ngOnInit() {
    this.subscriptionService.usage$.subscribe(data => {
      if (data) {
        this.status = data;
      }
    });
    // Trigger initial load
    this.subscriptionService.refreshUsage();
  }

  getPercentage(current: number, max: number): number {
    if (max === 0) return 100;
    return Math.min((current / max) * 100, 100);
  }

  isNearLimit(current: number, max: number): boolean {
    return (current / max) > 0.9;
  }

  upgrade() {
    this.upgradeService.showUpgradeModal('Actualiza el plan para desbloquear más funcionalidades y límites superiores!', 'Actualiza el plan');
  }
}

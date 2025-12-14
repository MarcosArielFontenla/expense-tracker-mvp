import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Sidebar } from './sidebar/sidebar';
import { TrialBannerComponent } from '../../shared/components/trial-banner/trial-banner.component';
import { SubscriptionService } from '../services/subscription.service';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-layout',
    imports: [CommonModule, RouterModule, Sidebar, TrialBannerComponent],
    templateUrl: './layout.html',
    styleUrl: './layout.css',
    standalone: true
})
export class Layout implements OnInit {
    constructor(
        private subscriptionService: SubscriptionService,
        private authService: AuthService,
        @Inject(PLATFORM_ID) private platformId: Object
    ) { }

    ngOnInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            // Trigger trial check on load
            this.subscriptionService.checkAllTrials().subscribe();

            // Monitor subscription status for expiration
            this.authService.currentUser$.subscribe(async user => {
                if (user && user.subStatus === 'expired') {
                    await this.showPaywall(user);
                }
            });
        }
    }

    private async showPaywall(user: any) {
        const result = await Swal.fire({
            title: '¡Tu periodo de prueba ha terminado!',
            html: `
                <div class="text-left">
                    <p class="mb-4">Espero que hayas disfrutado de las funciones Premium de Fintrack.</p>
                    <p class="mb-4">Para seguir disfrutando de presupuestos ilimitados, exportaciones avanzadas y más, suscríbete ahora.</p>
                    <p class="text-sm text-gray-500">O puedes volver al plan gratuito (tus datos se conservarán, pero con límites).</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Suscribirme (Simulado)',
            cancelButtonText: 'Volver al Plan Gratuito',
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#6b7280',
            allowOutsideClick: false,
            allowEscapeKey: false,
            reverseButtons: true
        });

        if (result.isConfirmed) {
            // Simulate Payment logic here -> set to active
            // For MVP, likely direct them to contact or simulate success
            Swal.fire('¡Gracias!', 'Tu suscripción ha sido activada (Simulación).', 'success');
            // This would realistically call an API to upgrade
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            // Downgrade
            this.handleDowngrade();
        }
    }

    private handleDowngrade() {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "Perderás acceso a funciones premium y se aplicarán los límites del plan gratuito.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, volver a Free',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.subscriptionService.downgradeToFree().subscribe({
                    next: () => {
                        window.location.reload(); // Reload to refresh all limits and UI
                    },
                    error: () => {
                        Swal.fire('Error', 'No se pudo procesar el cambio de plan.', 'error');
                    }
                });
            } else {
                // If they cancel downgrade, show paywall again (loop)
                this.authService.currentUser$.subscribe(u => {
                    if (u?.subStatus === 'expired') this.showPaywall(u);
                });
            }
        });
    }
}

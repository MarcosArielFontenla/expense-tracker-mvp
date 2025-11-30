import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-sidebar',
    imports: [CommonModule, RouterModule],
    templateUrl: './sidebar.html',
    styleUrl: './sidebar.css',
    standalone: true
})
export class Sidebar {
    menuItems = [
        { icon: '📊', label: 'Dashboard', path: '/dashboard' },
        { icon: '💸', label: 'Transacciones', path: '/transactions' },
        { icon: '🏷️', label: 'Categorías', path: '/categories' },
        { icon: '💰', label: 'Presupuestos', path: '/budgets' },
        { icon: '📈', label: 'Reportes', path: '/reports' }
    ];

    private authService = inject(AuthService);
    private router = inject(Router);
    currentUser$ = this.authService.currentUser$;

    constructor() { }

    public onLogout(): void {
        this.authService.logout().subscribe({
            next: () => {
                // Navigation handled in AuthService
            },
            error: (error) => {
                console.error('Logout error:', error);
                // Force client-side logout even if backend fails
                this.authService.clearTokens();
                this.router.navigate(['/login']);
            }
        });
    }
}
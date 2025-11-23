import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/transactions', label: 'Transacciones', icon: '💸' },
        { path: '/categories', label: 'Categorías', icon: '🏷️' },
        { path: '/budgets', label: 'Presupuestos', icon: '💰' }
    ];

    private authService = inject(AuthService);
    currentUser$ = this.authService.currentUser$;

    constructor() { }

    onLogout(): void {
        this.authService.logout();
    }
}

import { Component, inject, HostListener } from '@angular/core';
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
        { icon: '💳', label: 'Cuentas', path: '/accounts' },
        { icon: '🏷️', label: 'Categorías', path: '/categories' },
        { icon: '💰', label: 'Presupuestos', path: '/budgets' },
        { icon: '📈', label: 'Reportes', path: '/reports' },
        { icon: '⚙️', label: 'Configuración', path: '/settings' }
    ];

    isDropdownOpen = false;

    private authService = inject(AuthService);
    private router = inject(Router);
    currentUser$ = this.authService.currentUser$;

    constructor() { }

    public toggleDropdown(): void {
        this.isDropdownOpen = !this.isDropdownOpen;
    }

    public closeDropdown(): void {
        this.isDropdownOpen = false;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.user-menu-container')) {
            this.isDropdownOpen = false;
        }
    }

    public onLogout(): void {
        this.isDropdownOpen = false;
        this.authService.logout().subscribe({
            next: () => {
                // Navigation handled in AuthService
            },
            error: (error) => {
                console.error('Logout error:', error);
                this.authService.clearTokens();
                this.router.navigate(['/login']);
            }
        });
    }
}
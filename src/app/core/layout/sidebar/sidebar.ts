import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
}

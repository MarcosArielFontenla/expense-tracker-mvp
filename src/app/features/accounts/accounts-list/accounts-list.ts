import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AccountsService } from '../service/accounts.service';
import { Account, ACCOUNT_TYPE_LABELS } from '../../../core/models/account.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-accounts-list',
    standalone: true,
    imports: [CommonModule, CurrencyPipe],
    templateUrl: './accounts-list.html',
    styleUrl: './accounts-list.css'
})
export class AccountsList implements OnInit {
    accounts: Account[] = [];
    isLoading = false;
    error: string | null = null;
    userCurrency: string = 'USD';

    constructor(
        private accountsService: AccountsService,
        private authService: AuthService,
        private router: Router,
        @Inject(PLATFORM_ID) private platformId: Object) { }

    public ngOnInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            this.authService.currentUser$.subscribe(user => {
                if (user) {
                    this.userCurrency = user.currency || 'USD';
                }
            });

            this.loadAccounts();

            this.accountsService.refresh$.subscribe(() => {
                this.loadAccounts();
            });
        }
    }

    public loadAccounts(): void {
        this.isLoading = true;
        this.error = null;

        this.accountsService.getAccounts().subscribe({
            next: (data) => {
                this.accounts = data;
                this.isLoading = false;
            },
            error: (err) => {
                this.error = 'Error al cargar cuentas';
                this.isLoading = false;
                console.error(err);
            }
        });
    }

    public getTotalBalance(): number {
        return this.accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
    }

    public getTypeLabel(type: string): string {
        return ACCOUNT_TYPE_LABELS[type as keyof typeof ACCOUNT_TYPE_LABELS] || type;
    }

    public onCreateAccount(): void {
        this.router.navigate(['/accounts/new']);
    }

    public onEditAccount(id: string): void {
        this.router.navigate(['/accounts/edit', id]);
    }

    public onArchiveAccount(account: Account): void {
        const action = account.isArchived ? 'restaurar' : 'archivar';
        if (confirm(`¿Deseas ${action} la cuenta "${account.name}"?`)) {
            this.accountsService.archiveAccount(account.id).subscribe({
                error: (err) => console.error(err)
            });
        }
    }

    public onDeleteAccount(account: Account): void {
        if (confirm(`¿Eliminar la cuenta "${account.name}"? Esta acción no se puede deshacer.`)) {
            this.accountsService.deleteAccount(account.id).subscribe({
                error: (err) => {
                    alert('No se puede eliminar una cuenta con transacciones. Archívela en su lugar.');
                    console.error(err);
                }
            });
        }
    }
}

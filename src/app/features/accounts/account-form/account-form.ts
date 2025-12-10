import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AccountsService } from '../service/accounts.service';
import { Account, AccountDTO, AccountType, ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_ICONS, ACCOUNT_COLORS } from '../../../core/models/account.model';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';

@Component({
    selector: 'app-account-form',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './account-form.html',
    styleUrl: './account-form.css'
})
export class AccountForm implements OnInit {
    isEditMode = false;
    accountId: string | null = null;
    isLoading = false;
    isSaving = false;
    error: string | null = null;
    userCurrency: string = 'USD';

    // Form fields
    name: string = '';
    type: AccountType = 'bank';
    balance: number = 0;
    currency: string = 'ARS';
    color: string = '#3b82f6';
    icon: string = '🏦';
    isDefault: boolean = false;

    // Constants for template
    accountTypes: { value: AccountType; label: string }[] = [
        { value: 'cash', label: 'Efectivo' },
        { value: 'bank', label: 'Banco' },
        { value: 'debit_card', label: 'Tarjeta de Débito' },
        { value: 'credit_card', label: 'Tarjeta de Crédito' },
        { value: 'savings', label: 'Ahorro' }
    ];

    colors = ACCOUNT_COLORS;

    icons = ['💵', '🏦', '💳', '🐷', '💰', '🏠', '🚗', '✈️', '🎓', '💼'];

    constructor(
        private accountsService: AccountsService,
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute,
        private alertService: AlertService,
        @Inject(PLATFORM_ID) private platformId: Object) { }

    public ngOnInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            this.authService.currentUser$.subscribe(user => {
                if (user) {
                    this.userCurrency = user.currency || 'USD';
                    this.currency = user.currency || 'ARS';
                }
            });

            // Check if edit mode
            this.route.params.subscribe(params => {
                if (params['id']) {
                    this.isEditMode = true;
                    this.accountId = params['id'];
                    this.loadAccount();
                }
            });
        }
    }

    public loadAccount(): void {
        if (!this.accountId) return;

        this.isLoading = true;
        this.accountsService.getAccountById(this.accountId).subscribe({
            next: (account) => {
                this.name = account.name;
                this.type = account.type;
                this.balance = account.balance;
                this.currency = account.currency;
                this.color = account.color;
                this.icon = account.icon;
                this.isDefault = account.isDefault;
                this.isLoading = false;
            },
            error: (err) => {
                this.error = 'Error al cargar cuenta';
                this.isLoading = false;
                console.error(err);
            }
        });
    }

    public onTypeChange(): void {
        // Auto-select icon based on type
        this.icon = ACCOUNT_TYPE_ICONS[this.type] || '💰';
    }

    public onSubmit(): void {
        if (!this.name.trim()) {
            this.error = 'El nombre es requerido';
            return;
        }

        this.isSaving = true;
        this.error = null;

        const accountData: AccountDTO = {
            name: this.name.trim(),
            type: this.type,
            // Only include balance when creating new account, not when updating
            balance: this.isEditMode ? undefined : this.balance,
            currency: this.currency,
            color: this.color,
            icon: this.icon,
            isDefault: this.isDefault
        };

        const request = this.isEditMode && this.accountId
            ? this.accountsService.updateAccount(this.accountId, accountData)
            : this.accountsService.createAccount(accountData);

        request.subscribe({
            next: () => {
                this.alertService.success(
                    this.isEditMode ? 'Cuenta actualizada correctamente' : 'Cuenta creada correctamente',
                    '¡Éxito!'
                );
                setTimeout(() => {
                    this.router.navigate(['/accounts']);
                }, 1500);
            },
            error: (err) => {
                this.alertService.error(
                    err.error?.message || 'Error al guardar cuenta',
                    'Error'
                );
                this.isSaving = false;
                console.error(err);
            }
        });
    }

    public getTypeLabel(type: AccountType): string {
        const found = this.accountTypes.find(t => t.value === type);
        return found ? found.label : type;
    }

    public onCancel(): void {
        this.router.navigate(['/accounts']);
    }
}

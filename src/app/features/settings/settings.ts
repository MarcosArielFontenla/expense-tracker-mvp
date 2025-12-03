import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CurrencyService, CurrencyInfo } from '../../core/services/currency.service';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
  standalone: true
})
export class Settings implements OnInit {
  currencies: CurrencyInfo[] = [];
  selectedCurrency: string = 'USD';
  userName: string = '';
  isSaving: boolean = false;
  saveSuccess: boolean = false;
  saveError: string | null = null;

  constructor(
    private authService: AuthService,
    private currencyService: CurrencyService,
    private router: Router) { }

  ngOnInit(): void {
    this.currencies = this.currencyService.getSupportedCurrencies();

    // Load user data
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.selectedCurrency = user.currency || 'USD';
        this.userName = user.name || '';
      }
    });
  }

  public onSave(): void {
    this.isSaving = true;
    this.saveError = null;
    this.saveSuccess = false;

    this.authService.updateProfile({
      currency: this.selectedCurrency
    }).subscribe({
      next: () => {
        this.isSaving = false;
        this.saveSuccess = true;
        setTimeout(() => this.saveSuccess = false, 3000);
      },
      error: (err) => {
        this.isSaving = false;
        this.saveError = 'Error al actualizar configuración';
        console.error(err);
      }
    });
  }

  public onCancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
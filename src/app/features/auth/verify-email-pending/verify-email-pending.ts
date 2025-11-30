import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-verify-email-pending',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './verify-email-pending.html',
  styleUrl: './verify-email-pending.css',
})
export class VerifyEmailPending implements OnInit {
  email = '';
  message = '';
  error = '';
  canResend = false;
  countdown = 60;
  isResending = false;

  constructor(
    private router: Router,
    private http: HttpClient) {
    const navigation = this.router.getCurrentNavigation();
    this.email = navigation?.extras?.state?.['email'] || '';
  }

  ngOnInit() {
    if (!this.email) {
      this.router.navigate(['/register']);
      return;
    }
    this.startCountdown();
  }

  public startCountdown() {
    const interval = setInterval(() => {
      this.countdown--;

      if (this.countdown <= 0) {
        this.canResend = true;
        clearInterval(interval);
      }
    }, 1000);
  }

  public resendVerification() {
    if (!this.canResend || this.isResending) return;

    this.isResending = true;
    this.error = '';
    this.message = '';

    this.http.post('http://localhost:3000/api/auth/resend-verification', { email: this.email })
      .subscribe({
        next: () => {
          this.message = '¡Email de verificación reenviado! Revisa tu bandeja de entrada.';
          this.isResending = false;
          this.canResend = false;
          this.countdown = 60;
          this.startCountdown();
        },
        error: (error) => {
          this.error = error.error?.message || 'Error al reenviar el email';
          this.isResending = false;
        }
      });
  }
}
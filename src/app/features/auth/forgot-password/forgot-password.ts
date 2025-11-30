import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPassword {
  forgotPasswordForm: FormGroup;
  error = '';
  success = '';
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid)
      return;

    this.isSubmitting = true;
    this.error = '';
    this.success = '';

    this.http.post(`${environment.apiUrl}/auth/forgot-password`, this.forgotPasswordForm.value)
      .subscribe({
        next: (response: any) => {
          this.success = response.message || 'If that email exists, a reset link has been sent';
          this.isSubmitting = false;
          this.forgotPasswordForm.reset();
        },
        error: (error) => {
          this.error = error.error?.message || 'An error occurred. Please try again.';
          this.isSubmitting = false;
        }
      });
  }

  get email() {
    return this.forgotPasswordForm.get('email');
  }
}

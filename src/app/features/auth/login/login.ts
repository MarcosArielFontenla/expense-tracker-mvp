import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './login.html',
    styleUrl: './login.css'
})
export class Login {
    loginForm: FormGroup;
    error = '';
    isSubmitting = false;
    showResendLink = false;
    userEmail = '';

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    onSubmit(): void {
        if (this.loginForm.invalid)
            return;

        this.isSubmitting = true;
        this.error = '';
        this.showResendLink = false;

        this.authService.login(this.loginForm.value).subscribe({
            next: () => {
                this.router.navigate(['/dashboard']);
            },
            error: (error) => {
                this.error = error.error?.message || 'Login failed';
                this.isSubmitting = false;

                if (error.status === 403 && error.error?.emailVerified === false) {
                    this.showResendLink = true;
                    this.userEmail = this.loginForm.value.email;
                }
            }
        });
    }

    public goToVerificationPage(): void {
        this.router.navigate(['/verify-email-pending'], {
            state: { email: this.userEmail }
        });
    }

    get email() {
        return this.loginForm.get('email');
    }

    get password() {
        return this.loginForm.get('password');
    }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './register.html',
    styleUrl: './register.css'
})
export class Register implements OnInit {
    registerForm: FormGroup;
    error = '';
    isSubmitting = false;
    selectedPlan: string | null = null;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute) {
        this.registerForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]],
            plan: [''] // Hidden field for plan
        }, {
            validators: this.passwordMatchValidator
        });
    }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            if (params['plan']) {
                this.selectedPlan = params['plan'];
                this.registerForm.patchValue({ plan: this.selectedPlan });
            }
        });
    }

    // Custom validator to check if passwords match
    passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
        const password = control.get('password');
        const confirmPassword = control.get('confirmPassword');

        if (!password || !confirmPassword) {
            return null;
        }

        if (password.value !== confirmPassword.value) {
            confirmPassword.setErrors({ passwordMismatch: true });
            return { passwordMismatch: true };
        } else {
            const errors = confirmPassword.errors;

            if (errors) {
                delete errors['passwordMismatch'];
                confirmPassword.setErrors(Object.keys(errors).length > 0 ? errors : null);
            }
        }
        return null;
    }

    onSubmit(): void {
        if (this.registerForm.invalid)
            return;

        this.isSubmitting = true;
        this.error = '';

        // Extract form values without confirmPassword for the API
        const { confirmPassword, ...registerData } = this.registerForm.value;

        // Ensure we send the plan even if not in template (though it is in formGroup now)
        if (this.selectedPlan && !registerData.plan) {
            registerData.plan = this.selectedPlan;
        }

        this.authService.register(registerData).subscribe({
            next: (response: any) => {
                this.router.navigate(['/verify-email-pending'], {
                    state: { email: this.registerForm.value.email }
                });
            },
            error: (error) => {
                this.error = error.error?.message || 'Registration failed';
                this.isSubmitting = false;
            }
        });
    }

    get name() {
        return this.registerForm.get('name');
    }

    get email() {
        return this.registerForm.get('email');
    }

    get password() {
        return this.registerForm.get('password');
    }

    get confirmPassword() {
        return this.registerForm.get('confirmPassword');
    }
}
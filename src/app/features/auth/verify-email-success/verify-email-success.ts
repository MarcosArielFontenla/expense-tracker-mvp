import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-verify-email-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './verify-email-success.html'
})
export class VerifyEmailSuccess implements OnInit {
  loading = true;
  success = false;
  error = '';
  message = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient) { }

  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token');

    if (!token) {
      this.error = 'Token de verificación no encontrado';
      this.loading = false;
      return;
    }

    this.verifyEmail(token);
  }

  public verifyEmail(token: string) {
    this.http.get(`${environment.apiUrl}/auth/verify-email/${token}`)
      .subscribe({
        next: (response: any) => {
          this.success = true;
          this.message = response.message;
          this.loading = false;

          // Redirect to login after 3 seconds
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (error) => {
          this.error = error.error?.message || 'Error al verificar el email';
          this.loading = false;
        }
      });
  }
}
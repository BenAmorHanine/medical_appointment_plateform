import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-password-reset-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './password-reset-request.component.html',
  styleUrls: ['./password-reset-request.component.css']
})
export class PasswordResetRequestComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  public form: FormGroup;
  public isLoading = false;
  public errorMessage = '';
  public successMessage = '';

  constructor() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }
  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const email = this.form.get('email')?.value;

    this.authService.requestPasswordReset(email).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Reset code sent! Redirecting...';
        
        setTimeout(() => {
          this.router.navigate(['/auth/password-reset-verify'], { 
            state: { email }
          });
        }, 100);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to send reset code. Please try again.';
      }
    });
  }
}

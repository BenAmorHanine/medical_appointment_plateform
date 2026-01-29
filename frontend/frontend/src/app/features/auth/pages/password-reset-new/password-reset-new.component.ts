import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-password-reset-new',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './password-reset-new.component.html',
  styleUrls: ['./password-reset-new.component.css']
})
export class PasswordResetNewComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private authService = inject(AuthService);

  public form: FormGroup;
  public isLoading = false;
  public errorMessage = '';
  public successMessage = '';
  public showPassword = false;
  public showConfirmPassword = false;
  public passwordStrength = 0;
  public token = '';

  constructor() {
    this.form = this.fb.group(
      {
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            this.passwordValidator.bind(this)
          ]
        ],
        confirmPassword: ['', Validators.required]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    this.token = sessionStorage.getItem('resetToken') || '';
    
    if (!this.token) {
      this.router.navigate(['/auth/password-reset-request']);
      return;
    }

    this.form.get('password')?.valueChanges.subscribe(() => {
      this.updatePasswordStrength();
      this.form.get('confirmPassword')?.updateValueAndValidity();
    });
  }

  passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);

    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar;

    if (!passwordValid) {
      return { passwordStrength: true };
    }
    return null;
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!password || !confirmPassword) return null;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  updatePasswordStrength(): void {
    const password = this.form.get('password')?.value || '';
    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;

    this.passwordStrength = Math.min((strength / 5) * 100, 100);
  }

  getPasswordStrengthText(): string {
    if (this.passwordStrength < 20) return 'Weak';
    if (this.passwordStrength < 50) return 'Fair';
    if (this.passwordStrength < 80) return 'Good';
    return 'Strong';
  }

  getPasswordStrengthClass(): string {
    if (this.passwordStrength < 20) return 'weak';
    if (this.passwordStrength < 50) return 'fair';
    if (this.passwordStrength < 80) return 'good';
    return 'strong';
  }

  onSubmit(): void {
    if (this.form.invalid || !this.token) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    const password = this.form.get('password')?.value;

    this.authService.resetPassword(this.token, password).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response) => {
        sessionStorage.removeItem('resetToken');
        this.successMessage = response.message;
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to reset password';
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Helper methods for password requirement checks
  hasUpperCase(): boolean {
    const password = this.form.get('password')?.value || '';
    return /[A-Z]/.test(password);
  }

  hasLowerCase(): boolean {
    const password = this.form.get('password')?.value || '';
    return /[a-z]/.test(password);
  }

  hasNumeric(): boolean {
    const password = this.form.get('password')?.value || '';
    return /[0-9]/.test(password);
  }

  hasSpecialChar(): boolean {
    const password = this.form.get('password')?.value || '';
    return /[!@#$%^&*]/.test(password);
  }

  hasMinLength(): boolean {
    const password = this.form.get('password')?.value || '';
    return password.length >= 8;
  }
}

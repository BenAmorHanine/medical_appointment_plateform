import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { finalize } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-password-reset-verify',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './password-reset-verify.component.html',
  styleUrls: ['./password-reset-verify.component.css']
})
export class PasswordResetVerifyComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private authService = inject(AuthService);

  public form: FormGroup;
  public isLoading = false;
  public errorMessage = '';
  public successMessage = '';
  public timeLeft = 900; // 15 minutes in seconds
  public email = '';
  private destroy$ = new Subject<void>();

  constructor() {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();
    this.email = navigation?.extras?.state?.['email'] || '';

    if (!this.email) {
      const historyState = (window.history as any).state;
      this.email = historyState?.email || '';
    }
    
    if (!this.email) {
      this.router.navigate(['/auth/password-reset-request']);
      return;
    }

    this.startTimer();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  startTimer(): void {
    const interval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        clearInterval(interval);
        this.errorMessage = 'Code has expired. Please request a new one.';
        this.form.disable();
      }
    }, 1000);

    this.destroy$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      clearInterval(interval);
    });
  }

  getFormattedTime(): string {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  onSubmit(): void {
    if (this.form.invalid || !this.email) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    const code = this.form.get('code')?.value;

    this.authService.verifyResetCode(this.email, code).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response) => {
        sessionStorage.setItem('resetToken', response.token);
        this.router.navigate(['/auth/password-reset-new']);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Invalid or expired code. Please try again.';
        this.form.reset();
      }
    });
  }

  onResend(): void {
    if (!this.email) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.requestPasswordReset(this.email).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response) => {
        this.successMessage = 'New code sent to your email!';
        this.timeLeft = 900;
        this.form.reset();
        this.form.enable();
        this.startTimer();
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to resend code';
      }
    });
  }
}

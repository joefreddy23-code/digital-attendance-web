import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Auth } from '../../../shared/services/auth/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);

  submitted = false;
  loading = false;
  apiError: string | null = null;

  readonly form = this.fb.nonNullable.group({
    identifier: ['', Validators.required],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/),
      ],
    ],
  });

  showError(controlName: 'identifier' | 'password'): boolean {
    const control = this.form.controls[controlName];
    return this.submitted && control.invalid;
  }

  passwordErrorMessage(): string | null {
    if (!this.showError('password')) {
      return null;
    }
    const control = this.form.controls.password;
    if (control.hasError('required')) {
      return 'Password is required';
    }
    if (control.hasError('minlength')) {
      return 'Password must be at least 8 characters';
    }
    if (control.hasError('pattern')) {
      return 'Password must include at least one letter and one number';
    }
    return null;
  }

  onSubmit(): void {
    this.submitted = true;
    this.apiError = null;
    if (this.form.invalid || this.loading) {
      return;
    }

    const { identifier, password } = this.form.getRawValue();
    const payload = this.auth.buildLoginRequest(identifier, password);
    this.loading = true;

    this.auth.login(payload).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.auth.saveSession(res.data);
          void this.router.navigateByUrl('/dashboard');
          return;
        }
        this.apiError = res.message || 'Login failed';
      },
      error: () => {
        this.loading = false;
        this.apiError = 'Unable to connect. Please try again.';
      },
    });
  }
}

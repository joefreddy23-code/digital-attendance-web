import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Auth } from '../../../shared/services/auth/auth';
import { apiErrorMessage } from '../../../shared/utils/http/api-error-message';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);

  submitted = false;
  loading = false;
  apiMessage: string | null = null;
  apiMessageIsError = false;

  readonly form = this.fb.nonNullable.group({
    identifier: ['', Validators.required],
  });

  showError(controlName: 'identifier'): boolean {
    const control = this.form.controls[controlName];
    return this.submitted && control.invalid;
  }

  onSubmit(): void {
    this.submitted = true;
    this.apiMessage = null;
    this.apiMessageIsError = false;
    if (this.form.invalid || this.loading) {
      return;
    }

    const { identifier } = this.form.getRawValue();
    const payload = this.auth.buildForgotPasswordRequest(identifier);
    this.loading = true;

    this.auth.forgotPassword(payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.apiMessage = res.message;
        this.apiMessageIsError = !res.success;
      },
      error: (err) => {
        this.loading = false;
        this.apiMessage = apiErrorMessage(err);
        this.apiMessageIsError = true;
      },
    });
  }
}

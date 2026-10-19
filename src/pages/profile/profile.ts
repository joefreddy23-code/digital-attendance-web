import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { Auth } from '../../shared/services/auth/auth';
import { ResultModal } from '../../shared/components/result-modal/result-modal';
import { apiErrorMessage } from '../../shared/utils/http/api-error-message';
import type { ResultModalVariant } from '../../shared/components/result-modal/result-modal';

/** Cross-field validator: new password and confirm password must match. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  if (!confirmPassword) {
    return null;
  }
  return newPassword === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, ResultModal],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  private readonly auth = inject(Auth);
  private readonly fb = inject(FormBuilder);

  readonly isSaving = signal(false);

  readonly modalOpen = signal(false);
  readonly modalVariant = signal<ResultModalVariant>('success');
  readonly modalTitle = signal('');
  readonly modalMessage = signal('');

  form: FormGroup = this.buildForm();

  private buildForm(): FormGroup {
    return this.fb.group(
      {
        oldPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordsMatch },
    );
  }

  get f() {
    return this.form.controls;
  }

  get mismatch(): boolean {
    const confirm = this.form.get('confirmPassword');
    return (
      this.form.hasError('passwordMismatch') &&
      !!confirm &&
      confirm.touched &&
      !!confirm.value
    );
  }

  get displayName(): string {
    return this.auth.getUser()?.empName ?? '-';
  }

  get displayRole(): string {
    return this.auth.getUser()?.empRole ?? '';
  }

  get displayEmail(): string {
    return this.auth.getUser()?.empEmail ?? '';
  }

  get initials(): string {
    const name = this.auth.getUser()?.empName?.trim();
    if (!name) {
      return '?';
    }
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);

    const { oldPassword, newPassword } = this.form.getRawValue();

    this.auth.changePassword({ oldPassword, newPassword }).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          this.showModal('success', 'Password updated', res.message);
          this.resetForm();
        } else {
          this.showModal('error', 'Something went wrong', res.message);
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        this.showModal('error', 'Something went wrong', apiErrorMessage(err));
      },
    });
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  /**
   * Clear values and wipe the touched/dirty state so the emptied fields
   * don't immediately show "required" errors after a successful update.
   */
  /**
   * Rebuild the form from scratch so there's no leftover touched/dirty/error
   * state. Resetting an existing group can leave child controls flagged as
   * touched, which makes the emptied required fields show errors again.
   */
  private resetForm(): void {
    this.form = this.buildForm();
  }

  private showModal(
    variant: ResultModalVariant,
    title: string,
    message: string,
  ): void {
    this.modalVariant.set(variant);
    this.modalTitle.set(title);
    this.modalMessage.set(message);
    this.modalOpen.set(true);
  }
}

import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder);

  submitted = false;

  readonly form = this.fb.nonNullable.group({
    employeeId: ['', Validators.required],
  });

  showError(controlName: 'employeeId'): boolean {
    const control = this.form.controls[controlName];
    return this.submitted && control.invalid;
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    // Static UI only — no API in this POC
  }
}

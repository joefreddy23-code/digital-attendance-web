import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  submitted = false;

  readonly form = this.fb.nonNullable.group({
    employeeId: ['', Validators.required],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/),
      ],
    ],
  });

  showError(controlName: 'employeeId' | 'password'): boolean {
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
    if (this.form.invalid) {
      return;
    }
    void this.router.navigateByUrl('/dashboard');
  }
}

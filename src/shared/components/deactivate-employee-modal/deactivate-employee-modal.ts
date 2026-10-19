import { Component, computed, effect, input, output, signal } from '@angular/core';

import { DatePicker } from '../date-picker/date-picker';

/**
 * Confirmation dialog shown before deactivating (disabling) an employee.
 *
 * A relieving date is mandatory: the Confirm button stays disabled until a
 * date is picked. Emits the chosen date (yyyy-mm-dd) on confirm.
 */
@Component({
  selector: 'app-deactivate-employee-modal',
  imports: [DatePicker],
  templateUrl: './deactivate-employee-modal.html',
  styleUrl: './deactivate-employee-modal.css',
})
export class DeactivateEmployeeModal {
  readonly open = input<boolean>(false);
  /** Optional employee name shown in the dialog copy. */
  readonly employeeName = input<string>('');
  /** When true, the Confirm button shows a saving state and is disabled. */
  readonly saving = input<boolean>(false);
  /** Optional error message surfaced inside the dialog. */
  readonly error = input<string>('');

  readonly confirm = output<string>();
  readonly cancel = output<void>();

  /** Selected relieving date (yyyy-mm-dd). */
  readonly relievingDate = signal('');
  /** Set once the user tries to confirm without a date, to show the error. */
  readonly touched = signal(false);

  readonly isValid = computed(() => this.relievingDate().trim().length > 0);

  constructor() {
    // Clear the picked date each time the dialog is (re)opened so a stale value
    // from a previous employee never carries over.
    effect(() => {
      if (this.open()) {
        this.relievingDate.set('');
        this.touched.set(false);
      }
    });
  }

  onDateChange(value: string): void {
    this.relievingDate.set(value);
    this.touched.set(true);
  }

  onConfirm(): void {
    this.touched.set(true);
    if (!this.isValid() || this.saving()) {
      return;
    }
    this.confirm.emit(this.relievingDate());
  }

  onCancel(): void {
    this.resetState();
    this.cancel.emit();
  }

  onBackdrop(): void {
    if (this.saving()) {
      return;
    }
    this.onCancel();
  }

  /** Clears the picked date so the dialog is fresh when reopened. */
  resetState(): void {
    this.relievingDate.set('');
    this.touched.set(false);
  }
}

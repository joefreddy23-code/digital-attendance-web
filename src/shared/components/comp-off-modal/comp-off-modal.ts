import { Component, effect, input, output, signal } from '@angular/core';

/**
 * Confirmation dialog for marking an employee as present on a leave day.
 *
 * Toggle: off (default) = Manual entry → manualEntry 1;
 *         on            = Comp-off     → manualEntry 0.
 * The `manualEntry` value is emitted on Accept.
 */
@Component({
  selector: 'app-comp-off-modal',
  imports: [],
  templateUrl: './comp-off-modal.html',
  styleUrl: './comp-off-modal.css',
})
export class CompOffModal {
  readonly open = input<boolean>(false);
  /** Employee name shown in the confirmation copy. */
  readonly employeeName = input<string>('');
  /** Human readable date shown in the confirmation copy. */
  readonly dateLabel = input<string>('');
  /** When true, the Accept button shows a saving state and is disabled. */
  readonly saving = input<boolean>(false);
  /** Optional error message surfaced inside the dialog. */
  readonly error = input<string>('');

  /** Emits the `manualEntry` value to send to the API (1 = manual entry, 0 = comp-off). */
  readonly confirm = output<0 | 1>();
  readonly cancel = output<void>();

  /** Toggle state: false = Manual entry (default), true = Comp-off. */
  readonly isCompOff = signal(false);

  constructor() {
    // Always start on "Manual entry" when the dialog is (re)opened.
    effect(() => {
      if (this.open()) {
        this.isCompOff.set(false);
      }
    });
  }

  onToggle(): void {
    if (this.saving()) return;
    this.isCompOff.update((v) => !v);
  }

  onConfirm(): void {
    if (this.saving()) return;
    this.confirm.emit(this.isCompOff() ? 0 : 1);
  }

  onCancel(): void {
    if (this.saving()) return;
    this.cancel.emit();
  }
}

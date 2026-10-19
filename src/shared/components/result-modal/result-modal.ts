import { Component, input, output } from '@angular/core';

export type ResultModalVariant = 'success' | 'error';

@Component({
  selector: 'app-result-modal',
  imports: [],
  templateUrl: './result-modal.html',
  styleUrl: './result-modal.css',
})
export class ResultModal {
  readonly open = input<boolean>(false);
  readonly variant = input<ResultModalVariant>('success');
  readonly title = input<string>('');
  readonly message = input<string>('');

  readonly closed = output<void>();

  dismiss(): void {
    this.closed.emit();
  }
}

import { Component, inject } from '@angular/core';

import { SessionExpired } from '../../services/session-expired/session-expired';

@Component({
  selector: 'app-error-modal',
  templateUrl: './error-modal.html',
  styleUrl: './error-modal.css',
})
export class ErrorModal {
  readonly sessionExpired = inject(SessionExpired);

  dismiss(): void {
    this.sessionExpired.dismiss();
  }
}

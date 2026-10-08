import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SessionExpired {
  /** True while the session-expired modal should be visible. */
  readonly visible = signal(false);

  /** Show the modal. */
  show(): void {
    this.visible.set(true);
  }

  /** Dismiss the modal. */
  dismiss(): void {
    this.visible.set(false);
  }
}

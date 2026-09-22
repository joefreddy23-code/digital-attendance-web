import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MainLayoutService {
  readonly sidebarExpanded = signal(true);

  toggleSidebar(): void {
    this.sidebarExpanded.update((v) => !v);
  }
}

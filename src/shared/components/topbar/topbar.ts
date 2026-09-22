import { Component, inject } from '@angular/core';

import { MainLayoutService } from '../../services/main-layout/main-layout';

@Component({
  selector: 'app-topbar',
  imports: [],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  private readonly layout = inject(MainLayoutService);

  toggleSidebar(): void {
    this.layout.toggleSidebar();
  }
}

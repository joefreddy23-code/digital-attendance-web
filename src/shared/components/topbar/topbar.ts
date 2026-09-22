import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { MainLayoutService } from '../../services/main-layout/main-layout';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/employees': 'Employees',
  '/locations': 'Locations',
  '/reports': 'Reports',
  '/attendance': 'Attendance',
};

@Component({
  selector: 'app-topbar',
  imports: [],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  private readonly layout = inject(MainLayoutService);
  private readonly router = inject(Router);

  readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      startWith(null),
      map(() => {
        const path = this.router.url.split('?')[0];
        return PAGE_TITLES[path] ?? 'Overview';
      }),
    ),
    { initialValue: PAGE_TITLES['/dashboard'] },
  );

  toggleSidebar(): void {
    this.layout.toggleSidebar();
  }

  signOut(): void {
    void this.router.navigateByUrl('/login');
  }
}

import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { Auth } from '../../services/auth/auth';
import { MainLayoutService } from '../../services/main-layout/main-layout';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/employees': 'Employees',
  '/locations': 'Locations',
  '/locations/new': 'Locations',
  '/reports': 'Reports',
  '/attendance': 'Attendance',
};

const PAGE_TITLE_PREFIXES: Array<{ prefix: string; title: string }> = [
  { prefix: '/locations/edit/', title: 'Locations' },
];

@Component({
  selector: 'app-topbar',
  imports: [],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  private readonly layout = inject(MainLayoutService);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      startWith(null),
      map(() => {
        const path = this.router.url.split('?')[0];
        if (PAGE_TITLES[path]) {
          return PAGE_TITLES[path];
        }
        const matched = PAGE_TITLE_PREFIXES.find((p) =>
          path.startsWith(p.prefix),
        );
        return matched ? matched.title : 'Overview';
      }),
    ),
    { initialValue: PAGE_TITLES['/dashboard'] },
  );

  toggleSidebar(): void {
    this.layout.toggleSidebar();
  }

  signOut(): void {
    this.auth.logout();
  }
}

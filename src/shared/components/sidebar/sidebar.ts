import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { MainLayoutService } from '../../services/main-layout/main-layout';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  host: {
    class: 'sidebar',
    '[class.sidebar--collapsed]': '!layout.sidebarExpanded()',
    '[class.sidebar--expanded]': 'layout.sidebarExpanded()',
  },
})
export class Sidebar {
  readonly layout = inject(MainLayoutService);

  readonly navItems = [
    { label: 'Overview', path: '/dashboard', icon: 'fa-house' },
    { label: 'Employees', path: '/employees', icon: 'fa-user' },
    { label: 'Locations', path: '/locations', icon: 'fa-location-dot' },
    { label: 'Reports', path: '/reports', icon: 'fa-clock' },
  ] as const;
}

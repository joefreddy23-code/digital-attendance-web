import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { Auth } from '../../services/auth/auth';
import { isPathAllowedForRole } from '../../guards/auth.guard';
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
  private readonly auth = inject(Auth);

  readonly navItems = [
    { label: 'Overview', path: '/dashboard', icon: 'fa-house' },
    { label: 'Employees', path: '/employees', icon: 'fa-user' },
    { label: 'Locations', path: '/locations', icon: 'fa-location-dot' },
    { label: 'Reports', path: '/reports', icon: 'fa-clock' },
  ] as const;

  get visibleNavItems() {
    const roleId = this.auth.getUser()?.empRoleId;
    return this.navItems.filter((i) => isPathAllowedForRole(roleId, i.path));
  }
  get displayName(): string {
    return this.auth.getUser()?.empName ?? '-';
  }

  get displayRole(): string {
    return this.auth.getUser()?.empRole ?? '';
  }

  get initials(): string {
    const name = this.auth.getUser()?.empName?.trim();
    if (!name) {
      return '?';
    }
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }
}

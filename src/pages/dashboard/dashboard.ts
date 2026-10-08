import { Component, OnInit, inject } from '@angular/core';

import { Auth } from '../../shared/services/auth/auth';
import { Overview } from '../../shared/services/overview/overview';
import {
  EmployeesByCity,
  SupervisorQuery,
} from '../../shared/utils/interface/overview-response.interface';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly auth = inject(Auth);
  private readonly overview = inject(Overview);

  totalEmployees = 0;
  totalCheckedIn = 0;
  yettoCheckIn = 0;
  employeesByCity: EmployeesByCity[] = [];
  supervisorQueries: SupervisorQuery[] = [];
  errorMessage = '';

  isModalOpen = false;

  get empRoleId(): number | null {
    return this.auth.getUser()?.empRoleId ?? null;
  }

  get showNeedsReview(): boolean {
    return this.empRoleId === 2;
  }

  ngOnInit(): void {
    this.loadOverview();
  }

  loadOverview(): void {
    this.overview.getOverview().subscribe({
      next: (res) => {
        if (!res.success || !res.data) {
          this.resetData();
          this.errorMessage = res.message?.trim() || 'Unable to load overview.';
          return;
        }
        this.errorMessage = '';
        this.totalEmployees = res.data.totalEmployees;
        this.totalCheckedIn = res.data.totalCheckedIn;
        this.yettoCheckIn = res.data.yettoCheckIn;
        this.employeesByCity = res.data.employeesByCity ?? [];
        this.supervisorQueries = res.data.supervisorQueries ?? [];
      },
      error: () => {
        this.resetData();
        this.errorMessage = 'Unable to load overview.';
      },
    });
  }

  percentPresent(present: number, total: number): number {
    if (total <= 0) {
      return 0;
    }
    return Math.round((present / total) * 100);
  }

  formatCheckinDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return iso;
    }
    return date.toLocaleDateString();
  }

  formatCheckinTime(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return iso;
    }
    return date.toLocaleTimeString();
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  private resetData(): void {
    this.totalEmployees = 0;
    this.totalCheckedIn = 0;
    this.yettoCheckIn = 0;
    this.employeesByCity = [];
    this.supervisorQueries = [];
  }
}

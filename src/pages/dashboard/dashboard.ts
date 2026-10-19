import { Component, OnInit, inject } from '@angular/core';

import { Auth } from '../../shared/services/auth/auth';
import { Overview } from '../../shared/services/overview/overview';
import {
  EmployeesByCity,
  SupervisorQuery,
} from '../../shared/utils/interface/overview-response.interface';
import { apiErrorMessage } from '../../shared/utils/http/api-error-message';

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

  // The exception id currently being approved (null when idle). Used to
  // disable that row's Approve button while the request is in flight.
  approvingExceptionId: number | null = null;
  // Error surfaced inside the modal if an approve call fails.
  approveError = '';

  get empRoleId(): number | null {
    return this.auth.getUser()?.empRoleId ?? null;
  }

  get showNeedsReview(): boolean {
    return this.empRoleId === 2;
  }

  get hasSupervisorQueries(): boolean {
    return this.supervisorQueries.length > 0;
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
    // Format using the UTC components so the value shown matches the raw
    // timestamp (e.g. ...T14:29Z) regardless of the viewer's timezone, rather
    // than being shifted by the local offset.
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${month}/${day}/${date.getUTCFullYear()}`;
  }

  formatCheckinTime(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return iso;
    }
    // Use UTC components (no local-timezone shift) and render as 12-hour time
    // with AM/PM, e.g. 14:29:34 -> "2:29:34 PM".
    let hours = date.getUTCHours();
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    const meridiem = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes}:${seconds} ${meridiem}`;
  }

  openModal(): void {
    // Guard: nothing to review means the modal has no content to show.
    if (!this.hasSupervisorQueries) {
      return;
    }
    this.approveError = '';
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.approveError = '';
    this.approvingExceptionId = null;
  }

  /**
   * Approves a single missed check-out exception via the take-action API, then
   * reloads the overview on success so the list reflects the change.
   */
  onApprove(item: SupervisorQuery): void {
    // Ignore repeat clicks while a request is already in flight.
    if (this.approvingExceptionId !== null) {
      return;
    }

    this.approvingExceptionId = item.exceptionId;
    this.approveError = '';

    this.overview
      .takeAction({
        exceptionId: item.exceptionId,
        attendanceId: item.attendanceId,
      })
      .subscribe({
        next: (res) => {
          this.approvingExceptionId = null;
          if (!res.success) {
            this.approveError =
              res.message?.trim() || 'Unable to approve. Please try again.';
            return;
          }
          // Close the modal if this was the last pending item, then refresh
          // the overview so the data is up to date.
          if (this.supervisorQueries.length <= 1) {
            this.closeModal();
          }
          this.loadOverview();
        },
        error: (err) => {
          this.approvingExceptionId = null;
          this.approveError = apiErrorMessage(err);
        },
      });
  }

  private resetData(): void {
    this.totalEmployees = 0;
    this.totalCheckedIn = 0;
    this.yettoCheckIn = 0;
    this.employeesByCity = [];
    this.supervisorQueries = [];
  }
}

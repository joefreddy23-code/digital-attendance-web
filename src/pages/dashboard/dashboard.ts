import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';

import { Router } from '@angular/router';
import { ClockTimePicker } from '../../shared/components/clock-time-picker/clock-time-picker';
import { ResultModal } from '../../shared/components/result-modal/result-modal';
import { Auth } from '../../shared/services/auth/auth';
import { Overview } from '../../shared/services/overview/overview';
import {
  EmployeesByCity,
  ExceptionNote,
} from '../../shared/utils/interface/overview-response.interface';
import { apiErrorMessage } from '../../shared/utils/http/api-error-message';

export type ReviewTab = 'missedCheckIn' | 'missedCheckout';

@Component({
  selector: 'app-dashboard',
  imports: [ResultModal, ClockTimePicker],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly auth = inject(Auth);
  private readonly overview = inject(Overview);
  private readonly router = inject(Router);

  totalEmployees = 0;
  totalCheckedIn = 0;
  yettoCheckIn = 0;
  employeesByCity: EmployeesByCity[] = [];
  exceptionNotes: ExceptionNote[] = [];
  // Needs-review toggle. Absent / Missed checkin is the default tab.
  activeTab: ReviewTab = 'missedCheckIn';
  errorMessage = '';

  isModalOpen = false;

  // The exception id currently being approved (null when idle). Used to
  // disable that row's Approve button while the request is in flight.
  approvingExceptionId: number | null = null;
  // Error surfaced inside the modal if an approve call fails.
  approveError = '';
  // Selected check-out time (HH:mm[:ss]) per exceptionId.
  selectedTimes: Record<number, string | undefined> = {};
  // exceptionId whose inline time panel is open (null = all closed).
  openTimeFor: number | null = null;
  get empRoleId(): number | null {
    return this.auth.getUser()?.empRoleId ?? null;
  }

  get showNeedsReview(): boolean {
    return this.empRoleId === 2;
  }

  /** Notes for the active tab: missedCheckIn === 1 vs. missedCheckIn === 0. */
  get visibleNotes(): ExceptionNote[] {
    const wantMissedCheckIn = this.activeTab === 'missedCheckIn' ? 1 : 0;
    return this.exceptionNotes.filter(
      (n) => (n.missedCheckIn === 1 ? 1 : 0) === wantMissedCheckIn,
    );
  }

  get missedCheckInCount(): number {
    return this.exceptionNotes.filter((n) => n.missedCheckIn === 1).length;
  }

  get missedCheckoutCount(): number {
    return this.exceptionNotes.filter((n) => n.missedCheckIn !== 1).length;
  }

  get hasExceptionNotes(): boolean {
    return this.visibleNotes.length > 0;
  }

  get isMissedCheckInTab(): boolean {
    return this.activeTab === 'missedCheckIn';
  }

  setTab(tab: ReviewTab): void {
    if (this.activeTab === tab) {
      return;
    }
    this.activeTab = tab;
    this.openTimeFor = null;
    this.approveError = '';
  }

  /**
   * Marks a missed check-in note as read. Only the exception is sent; there is
   * no check-out time for a missed check-in.
   */
  onMarkAsRead(item: ExceptionNote): void {
    if (this.approvingExceptionId !== null) {
      return;
    }
    this.approvingExceptionId = item.exceptionId;
    this.approveError = '';

    this.overview
      .takeAction({
        exceptionId: item.exceptionId,
        attendanceId: item.attendanceId,
        checkOutTime: null,
        manualEntry: 1,
      })
      .subscribe({
        next: (res) => {
          this.approvingExceptionId = null;
          if (!res.success) {
            this.approveError =
              res.error?.trim() ||
              res.message?.trim() ||
              'Unable to mark as read. Please try again.';
            return;
          }
          if (this.visibleNotes.length <= 1) {
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

  /**
   * Opens the employee detail page for this note on its attendance date,
   * e.g. /employees/view/16?date=2026-11-13.
   */
  onAddress(item: ExceptionNote): void {
    const raw = item.attendanceDate ?? item.checkinDatetime;
    const parsed = raw ? new Date(raw) : null;
    const date =
      parsed && !Number.isNaN(parsed.getTime()) ? this.utcDate(parsed) : null;
    this.closeModal();
    void this.router.navigate(['/employees', 'view', item.employeeId], {
      queryParams: date ? { date } : undefined,
    });
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
        this.exceptionNotes = res.data.exceptionNotes ?? [];
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

  formatCheckinDate(iso: string | null): string {
    if (!iso) {
      return '-';
    }
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

  formatCheckinTime(iso: string | null): string {
    if (!iso) {
      return '-';
    }
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
    if (!this.hasExceptionNotes) {
      return;
    }
    this.approveError = '';
    this.selectedTimes = {};
    this.openTimeFor = null;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.openTimeFor = null;
    this.approveError = '';
    this.approvingExceptionId = null;
  }

  /**
   * Approves a single missed check-out exception via the take-action API, then
   * reloads the overview on success so the list reflects the change.
   */
  onApprove(item: ExceptionNote): void {
    // Ignore repeat clicks while a request is already in flight.
    if (this.approvingExceptionId !== null) {
      return;
    }

    const time = this.selectedTimes[item.exceptionId];
    if (!time) {
      return;
    }
    const checkOutTime = this.buildCheckOutTime(item, time);

    this.approvingExceptionId = item.exceptionId;
    this.approveError = '';

    this.overview
      .takeAction({
        exceptionId: item.exceptionId,
        attendanceId: item.attendanceId,
        checkOutTime,
        manualEntry: 0,
      })
      .subscribe({
        next: (res) => {
          this.approvingExceptionId = null;
          if (!res.success) {
            this.approveError =
              res.error?.trim() ||
              res.message?.trim() ||
              'Unable to approve. Please try again.';
            return;
          }
          delete this.selectedTimes[item.exceptionId];
          this.openTimeFor = null;
          // Close the modal if this was the last pending item, then refresh
          // the overview so the data is up to date.
          if (this.visibleNotes.length <= 1) {
            this.closeModal();
          }
          this.loadOverview();
        },
        error: (err) => {
          this.approvingExceptionId = null;
          // The API puts the useful reason (e.g. "Checkout time must be greater
          // than check-in time") in `error`, with a generic `message`.
          const body = (err as HttpErrorResponse | null)?.error as
            | { error?: unknown }
            | null
            | undefined;
          this.approveError =
            typeof body?.error === 'string' && body.error.trim()
              ? body.error
              : apiErrorMessage(err);
        },
      });
  }

  // ── Check-out time selection ────────────────────────────────────────────────
  // The date is always the check-in date (UTC, matching what the modal shows);
  // the supervisor only picks the time.

  toggleTimePanel(item: ExceptionNote): void {
    this.openTimeFor =
      this.openTimeFor === item.exceptionId ? null : item.exceptionId;
  }

  /** "hh:mm AM" label for the field, or '' until a time is chosen. */
  timeLabel(item: ExceptionNote): string {
    const time = this.selectedTimes[item.exceptionId];
    if (!time) {
      return '';
    }
    const [h24, minute] = time.split(':');
    const hour = Number(h24);
    const hour12 = String(hour % 12 || 12).padStart(2, '0');
    return `${hour12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
  }

  /** Receives the 24-hour "HH:mm" chosen in the clock picker. */
  onTimePicked(item: ExceptionNote, time: string): void {
    this.selectedTimes[item.exceptionId] = time || undefined;
    this.approveError = '';
  }
  private buildCheckOutTime(item: ExceptionNote, time: string): string {
    // The picker yields HH:mm (24h); seconds are sent as 00.
    const full = time.length === 5 ? `${time}:00` : time;
    return `${this.utcDate(new Date(item.checkinDatetime ?? item.attendanceDate ?? Date.now()))} ${full}`;
  }

  private utcDate(d: Date): string {
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${d.getUTCFullYear()}-${m}-${day}`;
  }

  private resetData(): void {
    this.totalEmployees = 0;
    this.totalCheckedIn = 0;
    this.yettoCheckIn = 0;
    this.employeesByCity = [];
    this.exceptionNotes = [];
  }
}

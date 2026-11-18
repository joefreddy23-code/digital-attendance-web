import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Auth } from '../../shared/services/auth/auth';
import { EmployeesService } from '../../shared/services/employees/employees';
import {
  AttendanceRecord,
  EmployeeDetail,
} from '../../shared/utils/interface/employees-response.interface';
import { apiErrorMessage } from '../../shared/utils/http/api-error-message';
import { CompOffModal } from '../../shared/components/comp-off-modal/comp-off-modal';
import { ResultModal } from '../../shared/components/result-modal/result-modal';
import type { ResultModalVariant } from '../../shared/components/result-modal/result-modal';
import {
  AttendanceDetailModal,
  AttendanceModalHeader,
} from '../../shared/components/attendance-detail-modal/attendance-detail-modal';

/** A single attendance row shaped for the table. */
interface AttendanceRow {
  date: string;
  dateLabel: string;
  checkIn: string;
  checkOut: string;
  hours: string;
  /** Check-in location shown under the Location column. */
  location: string;
  code: string;
  codeClass: string;
  canView: boolean;
  /** True only for a leave day (L), not present (P) or week-off (WO). */
  canMarkPresent: boolean;
  raw: AttendanceRecord;
}

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

@Component({
  selector: 'app-employee-detail',
  imports: [AttendanceDetailModal, CompOffModal, ResultModal],
  templateUrl: './employee-detail.html',
  styleUrl: './employee-detail.css',
})
export class EmployeeDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly employeesService = inject(EmployeesService);
  private readonly auth = inject(Auth);

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  readonly employee = signal<EmployeeDetail | null>(null);
  readonly attendance = signal<AttendanceRecord[]>([]);

  /** True once the profile image fails to load, so we fall back to the icon. */
  readonly profileImgFailed = signal(false);

  // ── Attendance detail modal state ────────────────────────────────────────
  readonly detailOpen = signal(false);
  /** The attendance record backing the open modal. */
  readonly detailRecord = signal<AttendanceRecord | null>(null);

  /** Header details (employee + selected day) for the open modal. */
  readonly detailHeader = computed<AttendanceModalHeader | null>(() => {
    const emp = this.employee();
    const rec = this.detailRecord();
    if (!emp || !rec) return null;
    return {
      empName: emp.name,
      empId: emp.id,
      selectedDate: this.formatFullDate(rec.date),
      designationName: emp.designationName,
      clientName: emp.clientName,
      // Loc code for the day comes from the check-in location on the record.
      locCode: rec.checkInLocation,
    };
  });

  /**
   * The employee's profile image URL (a pre-signed S3 URL from the API), or
   * null when there is none or it failed to load. When null the template
   * shows the default user icon instead.
   */
  readonly profileImgUrl = computed<string | null>(() => {
    if (this.profileImgFailed()) return null;
    const path = this.employee()?.profileImgPath?.trim();
    return path ? path : null;
  });

  // ── Mark-as-present modal state ──────────────────────────────────────────
  readonly markModalOpen = signal(false);
  readonly markDateLabel = signal('');
  readonly isMarking = signal(false);
  readonly markError = signal('');
  /** yyyy-mm-dd of the leave day being marked present. */
  private readonly markDate = signal<string | null>(null);

  // Result modal (success / error) shown after the API call.
  readonly resultModalOpen = signal(false);
  readonly resultModalVariant = signal<ResultModalVariant>('success');
  readonly resultModalTitle = signal('');
  readonly resultModalMessage = signal('');
  private readonly lastActionSucceeded = signal(false);

  // The query the page was loaded with, reused to refresh after an update.
  private currentEmployeeId = 0;
  private currentDate = '';

  // ── Derived view data ──────────────────────────────────────────────────
  readonly rows = computed<AttendanceRow[]>(() =>
    this.attendance().map((rec) => this.toRow(rec)),
  );

  /** Heading for the attendance card, e.g. "RECENT ATTENDANCE · OCTOBER 2026". */
  readonly attendanceHeading = computed(() => {
    const first = this.attendance()[0];
    if (!first) return 'RECENT ATTENDANCE';
    const parts = this.parseIsoDateParts(first.date);
    if (!parts) return 'RECENT ATTENDANCE';
    return `RECENT ATTENDANCE · ${MONTHS_LONG[parts.monthIndex].toUpperCase()} ${parts.year}`;
  });

  readonly metaLine = computed(() => {
    const e = this.employee();
    if (!e) return '';
    const parts = [
      String(e.id),
      e.roleName || '—',
      e.clientName || '—',
    ];
    return parts.join(' · ');
  });

  readonly subMetaLine = computed(() => {
    const e = this.employee();
    if (!e) return '';
    const parts: string[] = [];
    const locations = e.allocatedLocations?.length
      ? e.allocatedLocations.join(', ')
      : '—';
    parts.push(locations);
    if (e.designationName) parts.push(e.designationName);
    if (e.joiningDate) parts.push(`joined ${this.formatFullDate(e.joiningDate)}`);
    return parts.join(' · ');
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const employeeId = Number(idParam);
    if (!idParam || Number.isNaN(employeeId) || employeeId <= 0) {
      this.errorMessage.set('Invalid employee reference.');
      return;
    }
    // The attendance window ends on the date the list was filtered on, passed
    // through as a query param (?date=yyyy-mm-dd). Falls back to today when the
    // screen is opened directly without one.
    const dateParam = this.route.snapshot.queryParamMap.get('date');
    const date = this.isValidIsoDate(dateParam) ? dateParam! : this.today();
    this.currentEmployeeId = employeeId;
    this.currentDate = date;
    this.fetchEmployee(employeeId, date);
  }

  private fetchEmployee(employeeId: number, date: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.employeesService
      .getEmployee({ employeeId, attendanceFetch: true, date })
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (!res.success || !res.data) {
            this.errorMessage.set(
              res.message?.trim() || 'Unable to load employee details.',
            );
            return;
          }
          this.profileImgFailed.set(false);
          this.employee.set(res.data.employee);
          this.attendance.set(res.data.attendance ?? []);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(apiErrorMessage(err));
        },
      });
  }

  // ── Actions ────────────────────────────────────────────────────────────
  onBack(): void {
    void this.router.navigate(['/employees']);
  }

  onEdit(): void {
    // Return to the list; editing is handled by the list's edit modal.
    void this.router.navigate(['/employees']);
  }

  /** Opens the day's attendance proof/details modal. */
  onViewRow(row: AttendanceRow): void {
    this.detailRecord.set(row.raw);
    this.detailOpen.set(true);
  }

  /** Closes the attendance detail modal. */
  onCloseDetail(): void {
    this.detailOpen.set(false);
    this.detailRecord.set(null);
  }

  /** Opens the mark-as-present dialog for a leave day. */
  onMarkPresent(row: AttendanceRow): void {
    this.markDate.set(row.date.slice(0, 10));
    this.markDateLabel.set(this.formatFullDate(row.date));
    this.markError.set('');
    this.isMarking.set(false);
    this.markModalOpen.set(true);
  }

  onMarkCancel(): void {
    if (this.isMarking()) return;
    this.markModalOpen.set(false);
    this.markDate.set(null);
    this.markError.set('');
  }

  /** manualEntry: 1 = manual entry (toggle off, default), 0 = comp-off (toggle on). */
  onMarkConfirm(manualEntry: 0 | 1): void {
    const emp = this.employee();
    const date = this.markDate();
    if (!emp || !date) return;

    this.isMarking.set(true);
    this.markError.set('');

    this.employeesService
      .addCompOff({ empId: emp.id, date, manualEntry })
      .subscribe({
        next: (res) => {
          this.isMarking.set(false);
          this.markModalOpen.set(false);
          this.markDate.set(null);
          if (!res.success) {
            this.showResultModal(
              'error',
              'Cannot mark as present',
              res.message?.trim() || 'Unable to mark as present.',
            );
            return;
          }
          this.lastActionSucceeded.set(true);
          this.showResultModal(
            'success',
            'Success',
            res.message?.trim() || 'Marked as present successfully.',
          );
        },
        error: (err) => {
          this.isMarking.set(false);
          this.markModalOpen.set(false);
          this.markDate.set(null);
          this.showResultModal('error', 'Cannot mark as present', apiErrorMessage(err));
        },
      });
  }

  private showResultModal(
    variant: ResultModalVariant,
    title: string,
    message: string,
  ): void {
    this.resultModalVariant.set(variant);
    this.resultModalTitle.set(title);
    this.resultModalMessage.set(message);
    this.resultModalOpen.set(true);
  }

  onResultModalClosed(): void {
    this.resultModalOpen.set(false);
    // Refresh so the updated day shows as present.
    if (this.lastActionSucceeded()) {
      this.lastActionSucceeded.set(false);
      this.fetchEmployee(this.currentEmployeeId, this.currentDate);
    }
  }

  /** Falls back to the default user icon when the profile image can't load. */
  onProfileImgError(): void {
    this.profileImgFailed.set(true);
  }

  // ── Row mapping ─────────────────────────────────────────────────────────
  private toRow(rec: AttendanceRecord): AttendanceRow {
    const code = this.resolveCode(rec);
    return {
      date: rec.date,
      dateLabel: this.formatShortDate(rec.date),
      checkIn: this.formatTime(rec.checkinDatetime),
      checkOut: this.formatTime(rec.checkoutDatetime),
      hours: this.formatHours(rec.hours),
      location: rec.checkInLocation?.trim() || '—',
      code,
      codeClass: this.codeClass(code),
      // "View" is only meaningful when the person was present (isPresent === 1)
      // and there is a check-in to show. Fall back to the status code when the
      // API omits isPresent so older rows still behave correctly.
      canView:
        (rec.isPresent === 1 || code === 'P') && !!rec.checkinDatetime,
      canMarkPresent: code === 'L' && this.auth.getUser()?.empRoleId === 2,
      raw: rec,
    };
  }

  /**
   * Resolves the display code per the rules:
   *  - If the date is a weekend (Sat/Sun) and status is "L", show "WO".
   *  - If status is "P", keep "P".
   *  - Otherwise keep the raw status.
   */
  private resolveCode(rec: AttendanceRecord): string {
    const status = (rec.status || '').toUpperCase();
    const parts = this.parseIsoDateParts(rec.date);
    // Compute the weekday from the calendar parts via a UTC date so the result
    // is independent of the browser's local timezone.
    const day = parts
      ? new Date(Date.UTC(parts.year, parts.monthIndex, parts.day)).getUTCDay()
      : -1; // 0 = Sunday, 6 = Saturday
    const isWeekend = day === 0 || day === 6;

    if (isWeekend && status === 'L') {
      return 'WO';
    }
    return status || '—';
  }

  private codeClass(code: string): string {
    switch (code) {
      case 'P':
        return 'ed-code--present';
      case 'WO':
        return 'ed-code--weekoff';
      case 'L':
        return 'ed-code--leave';
      default:
        return 'ed-code--neutral';
    }
  }

  // ── Formatting helpers ────────────────────────────────────────────────────
  /**
   * "2026-10-12T00:00:00.000Z" → "12 Oct".
   *
   * Read the calendar parts straight from the ISO string so no timezone
   * conversion shifts the day (the DB value is nominal IST wall-clock).
   */
  private formatShortDate(value: string | null): string {
    const parts = this.parseIsoDateParts(value);
    if (!parts) return '—';
    return `${parts.day} ${MONTHS_SHORT[parts.monthIndex]}`;
  }

  /** "2026-04-15T00:00:00.000Z" → "15 Apr 2026". */
  private formatFullDate(value: string | null): string {
    const parts = this.parseIsoDateParts(value);
    if (!parts) return '—';
    return `${parts.day} ${MONTHS_SHORT[parts.monthIndex]} ${parts.year}`;
  }

  /** Today as yyyy-mm-dd in local time (fallback when no date param is given). */
  private today(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }

  /** True when the value is a well-formed yyyy-mm-dd date string. */
  private isValidIsoDate(value: string | null): boolean {
    return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  /** Extracts year/month/day from an ISO date string without timezone math. */
  private parseIsoDateParts(
    value: string | null,
  ): { year: number; monthIndex: number; day: number } | null {
    if (!value) return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (!match) return null;
    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    const day = Number(match[3]);
    if (monthIndex < 0 || monthIndex > 11) return null;
    return { year, monthIndex, day };
  }

  /**
   * ISO datetime → "09:30 AM". Null/empty → em dash.
   *
   * The datetime stored in the DB is already IST wall-clock time (the trailing
   * "Z" is nominal, not an actual UTC marker). We therefore read the hour and
   * minute straight from the string and must NOT let `new Date()` apply any
   * timezone conversion, which would shift the displayed time.
   */
  private formatTime(value: string | null): string {
    if (!value) return '—';
    const match = /T(\d{2}):(\d{2})/.exec(value);
    if (!match) return '—';
    let hours = Number(match[1]);
    const minutes = match[2];
    if (Number.isNaN(hours)) return '—';
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${period}`;
  }

  /**
   * Formats the worked duration "HH:mm:ss" into "Hh MMm SSs".
   * e.g. "08:12:05" → "8h 12m 05s", "00:00:40" → "0h 00m 40s",
   * null/"00:00:00" → "0h 00m 00s".
   */
  private formatHours(value: string | null): string {
    if (!value) return '0h 00m 00s';
    const parts = value.split(':');
    const h = Number(parts[0] ?? 0);
    const m = Number(parts[1] ?? 0);
    const s = Number(parts[2] ?? 0);
    if (Number.isNaN(h) || Number.isNaN(m) || Number.isNaN(s)) {
      return '0h 00m 00s';
    }
    return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  }
}

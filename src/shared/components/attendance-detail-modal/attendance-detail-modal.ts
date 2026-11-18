import { Component, computed, effect, input, output, signal } from '@angular/core';

import { AttendanceRecord } from '../../utils/interface/employees-response.interface';

/**
 * Header details shown across the top of the attendance detail modal.
 * These come from the employee record (not the per-day attendance row).
 */
export interface AttendanceModalHeader {
  empName: string;
  empId: number | string;
  /** The selected day, pre-formatted for display, e.g. "26 Aug 2026". */
  selectedDate: string;
  designationName: string | null;
  clientName: string | null;
  /** Location code for the day, e.g. "BLR 13". */
  locCode: string | null;
}

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Read-only dialog that shows a single day's check-in / check-out proof for an
 * employee. The left panel always renders (a valid day requires isPresent / a
 * check-in). The right panel renders check-out details when present; otherwise
 * it shows a "records location only" note, mirroring the mobile app which does
 * not capture a photo at check-out.
 */
@Component({
  selector: 'app-attendance-detail-modal',
  imports: [],
  templateUrl: './attendance-detail-modal.html',
  styleUrl: './attendance-detail-modal.css',
})
export class AttendanceDetailModal {
  readonly open = input<boolean>(false);
  readonly header = input<AttendanceModalHeader | null>(null);
  readonly record = input<AttendanceRecord | null>(null);

  readonly close = output<void>();

  /** True once the check-in photo fails to load, so we fall back to the icon. */
  readonly imgFailed = signal(false);
  /** True while the check-in photo is downloading, so we show the spinner. */
  readonly imgLoading = signal(false);

  // ── Header ────────────────────────────────────────────────────────────────
  readonly titleLine = computed(() => {
    const h = this.header();
    if (!h) return '';
    return `${h.empName} · ${h.empId}`;
  });

  readonly metaLine = computed(() => {
    const h = this.header();
    if (!h) return '';
    const parts = [
      h.selectedDate,
      h.designationName,
      h.clientName,
      h.locCode,
    ].filter((p): p is string => !!p && p.trim().length > 0);
    return parts.join(' · ');
  });

  // ── Check-in (left) ─────────────────────────────────────────────────────
  /** True when the day was recorded as a compensatory off (compOff === 1). */
  readonly isCompOff = computed(() => this.record()?.compOff === 1);

  /** Badge label for the day: "Comp off", "Manual entry", or null (only one applies). */
  readonly entryType = computed<string | null>(() =>
    this.isCompOff() ? 'Comp off' : this.isManualEntry() ? 'Manual entry' : null,
  );

  /** Name of the person who made the manual entry / comp-off. */
  readonly approvedByName = computed(() =>
    this.entryType() ? this.record()?.approvedByName?.trim() || null : null,
  );

  readonly checkInTime = computed(() =>
    this.formatTime(this.record()?.checkinDatetime ?? null),
  );

  readonly checkInLocation = computed(
    () => this.record()?.checkInLocation?.trim() || '—',
  );

  readonly checkInCoords = computed(() =>
    this.formatCoords(
      this.record()?.checkinLatitude ?? null,
      this.record()?.checkinLongitude ?? null,
    ),
  );

  readonly photoUrl = computed<string | null>(() => {
    if (this.imgFailed()) return null;
    const path = this.record()?.imgSrcPath?.trim();
    return path ? path : null;
  });

  constructor() {
    // Reset the photo load/error state whenever the shown day's record changes,
    // so a previous day's "failed/loaded" state never carries over to the next
    // selfie. The modal component instance is reused across every "View" click
    // (its content is gated by @if, not recreated), so these signals MUST be
    // cleared on each new record or a day with no image latches imgFailed and
    // then hides every subsequent day's valid image.
    //
    // The effect keys off record() — NOT photoUrl() — on purpose: photoUrl()
    // reads imgFailed(), so resetting imgFailed() inside an effect that depends
    // on photoUrl() would re-trigger the effect in a feedback loop.
    effect(() => {
      // Establish the dependency on the current record so this re-runs per day.
      const rec = this.record();
      this.imgFailed.set(false);
      // Show the spinner while a photo is (re)loading; stays false when the day
      // has no image path at all.
      this.imgLoading.set(!!rec?.imgSrcPath?.trim());
    });
  }

  // ── Check-out (right) ─────────────────────────────────────────────────────
  readonly hasCheckOut = computed(() => !!this.record()?.checkoutDatetime);

  /** True when the check-out was logged manually (manualEntry === 1). */
  readonly isManualEntry = computed(() => this.record()?.manualEntry === 1);

  readonly checkOutTime = computed(() =>
    this.formatTime(this.record()?.checkoutDatetime ?? null),
  );

  readonly checkOutLocation = computed(
    () => this.record()?.checkOutLocation?.trim() || '—',
  );

  readonly checkOutCoords = computed(() =>
    this.formatCoords(
      this.record()?.checkoutLatitude ?? null,
      this.record()?.checkoutLongitude ?? null,
    ),
  );

  // ── Actions ───────────────────────────────────────────────────────────────
  onClose(): void {
    this.close.emit();
  }

  onBackdrop(): void {
    this.onClose();
  }

  onPhotoError(): void {
    this.imgLoading.set(false);
    this.imgFailed.set(true);
  }

  /** Hides the spinner once the selfie has finished downloading. */
  onPhotoLoad(): void {
    this.imgLoading.set(false);
  }

  // ── Formatting helpers ────────────────────────────────────────────────────
  /**
   * ISO datetime → "09:02 AM". The stored datetime is already IST wall-clock
   * (the trailing "Z" is nominal), so read the hour/minute straight from the
   * string without letting `new Date()` apply a timezone shift.
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

  /** Formats a lat/long pair as "12.9716° N, 77.5946° E". */
  private formatCoords(lat: number | null, long: number | null): string {
    if (lat == null || long == null || Number.isNaN(lat) || Number.isNaN(long)) {
      return '—';
    }
    const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`;
    const longStr = `${Math.abs(long).toFixed(4)}° ${long >= 0 ? 'E' : 'W'}`;
    return `${latStr}, ${longStr}`;
  }

  /** Expose the short-month table in case a caller needs it (unused in template). */
  protected readonly months = MONTHS_SHORT;
}

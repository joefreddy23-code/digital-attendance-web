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
    // Reset the photo load/error state whenever a new photo URL is shown, so
    // the spinner appears again for the next day's selfie instead of carrying
    // over the previous image's resolved state.
    effect(() => {
      const url = this.photoUrl();
      this.imgLoading.set(!!url);
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

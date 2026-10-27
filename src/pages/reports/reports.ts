import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { DatePicker } from '../../shared/components/date-picker/date-picker';
import {
  MultiSelect,
  MultiSelectOption,
} from '../../shared/components/multi-select/multi-select';
import { EmployeesService } from '../../shared/services/employees/employees';
import { ReportsService } from '../../shared/services/reports/reports';
import { apiErrorMessage } from '../../shared/utils/http/api-error-message';
import {
  MonthlyAttendanceRequest,
  MonthlyAttendanceRow,
} from '../../shared/utils/interface/reports-response.interface';

/** A month entry rendered in the Quick links list. */
interface QuickLink {
  /** e.g. "October 2026". */
  label: string;
  /** First day of the month, yyyy-mm-dd. */
  startDate: string;
  /** Last day of the month, yyyy-mm-dd. */
  endDate: string;
}

/** The fixed (non per-day) columns, in display order. */
const FIXED_COLUMNS = [
  'EmpNo',
  'EmpName',
  'DOJ',
  'Designation',
  'Client',
  'Location',
] as const;

/** Columns pinned to the right once the day columns have been laid out. */
const TRAILING_COLUMNS = ['Total Working Days', 'Days Worked'] as const;

/** Row keys that are never rendered as their own column in the table. */
const EXCLUDED_COLUMNS = new Set<string>(['Month']);

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

@Component({
  selector: 'app-reports',
  imports: [DatePicker, MultiSelect],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports implements OnInit {
  private readonly employeesService = inject(EmployeesService);
  private readonly reportsService = inject(ReportsService);

  /** Today as yyyy-mm-dd — used as the max selectable date (no future dates). */
  readonly today = this.toIso(new Date());

  // ── Date range (two-way bound to the date pickers) ──────────────────────────
  readonly startDate = signal<string>('');
  readonly endDate = signal<string>('');

  // ── Dropdown options from the get-fields API ────────────────────────────────
  readonly locationOptions = signal<MultiSelectOption[]>([]);
  readonly employeeOptions = signal<MultiSelectOption[]>([]);

  // ── Selections (empty = all) ────────────────────────────────────────────────
  readonly selectedLocations = signal<number[]>([]);
  readonly selectedEmployees = signal<number[]>([]);

  readonly fieldsError = signal<string>('');

  // ── Quick links (current month + previous four) ─────────────────────────────
  readonly quickLinks = signal<QuickLink[]>(this.buildQuickLinks());

  // ── Report state ────────────────────────────────────────────────────────────
  readonly loading = signal<boolean>(false);
  readonly reportError = signal<string>('');
  readonly reportRows = signal<MonthlyAttendanceRow[]>([]);
  /** Heading for the results view, e.g. "October 2026" or a custom range. */
  readonly reportTitle = signal<string>('');
  /** True once a report has been requested — switches to the results view. */
  readonly showReport = signal<boolean>(false);

  /** True while the .xlsx is being generated/downloaded. */
  readonly downloading = signal<boolean>(false);
  /** Error surfaced if the download fails. */
  readonly downloadError = signal<string>('');

  /**
   * The exact request behind the currently shown report. Reused — with
   * generateExcel flipped on — when the user clicks Download .xlsx so the file
   * matches the table on screen.
   */
  private activePayload: MonthlyAttendanceRequest | null = null;

  /**
   * The View Report button is only enabled once the mandatory date range is
   * set (both a start and an end date). Location/employee filters are optional.
   */
  readonly canGenerate = computed(() => !!this.startDate() && !!this.endDate());

  /**
   * The end date can never be before the start date. When a start date is
   * chosen, it becomes the minimum selectable end date.
   */
  readonly endMin = computed(() => this.startDate());

  /**
   * A chosen end date caps the start date's max so the range stays valid,
   * but never beyond today.
   */
  readonly startMax = computed(() => {
    const end = this.endDate();
    return end && end < this.today ? end : this.today;
  });

  /**
   * Ordered column keys for the results table: the six fixed columns, then one
   * column per day in the range (in the order the API returns them), then the
   * two trailing totals columns.
   */
  readonly columns = computed<string[]>(() => {
    const rows = this.reportRows();
    if (rows.length === 0) return [];

    const known = new Set<string>([
      ...FIXED_COLUMNS,
      ...TRAILING_COLUMNS,
      ...EXCLUDED_COLUMNS,
    ]);

    // Day columns come from the first row's keys, preserving API order.
    const dayColumns = Object.keys(rows[0]).filter((k) => !known.has(k));

    return [...FIXED_COLUMNS, ...dayColumns, ...TRAILING_COLUMNS];
  });

  /** Number of columns pinned (sticky) to the left of the table. */
  readonly stickyCount = FIXED_COLUMNS.length;

  /**
   * Pixel widths for the six sticky columns, in order. Kept tight so the six
   * fixed columns together occupy only a small slice of the table, leaving the
   * bulk of the width for the scrollable day columns. Day/total columns are
   * sized to content and so are not listed here.
   */
  private readonly stickyWidths = [48, 104, 66, 112, 60, 96];

  /** Width (px) for a sticky column by index. */
  stickyWidth(index: number): number {
    return this.stickyWidths[index] ?? 120;
  }

  /** Cumulative left offset (px) for a sticky column by index. */
  stickyLeft(index: number): number {
    let left = 0;
    for (let i = 0; i < index; i++) left += this.stickyWidths[i] ?? 120;
    return left;
  }

  /** True for the per-day/total columns that render as a centered short code. */
  isDayColumn(index: number): boolean {
    return index >= this.stickyCount;
  }

  /** Display label for a column header (the raw key is used to read values). */
  headerLabel(column: string): string {
    return column;
  }

  ngOnInit(): void {
    this.loadFields();
  }

  loadFields(): void {
    this.employeesService.getFields().subscribe({
      next: (res) => {
        if (!res.success || !res.data) {
          this.fieldsError.set(res.message?.trim() || 'Unable to load filters.');
          return;
        }
        this.fieldsError.set('');

        const locations = res.data.locations ?? [];

        this.locationOptions.set(
          locations.map((l) => ({
            value: l.locationId,
            label: l.locationCode
              ? `${l.locationName} (${l.locationCode})`
              : l.locationName,
          })),
        );

        this.employeeOptions.set(
          (res.data.employees ?? []).map((e) => ({
            value: e.employeeId,
            label: e.employeeName,
          })),
        );
      },
      error: (err) => {
        this.fieldsError.set(apiErrorMessage(err));
      },
    });
  }

  /** View Report — use the left-panel filters. Date range is mandatory. */
  onGenerate(): void {
    const startDate = this.startDate();
    const endDate = this.endDate();
    if (!startDate || !endDate) {
      this.reportError.set('Please choose a start and end date.');
      this.showReport.set(true);
      this.reportRows.set([]);
      this.reportTitle.set('Report');
      return;
    }

    const payload: MonthlyAttendanceRequest = {
      startDate,
      endDate,
      generateExcel: false,
    };

    // Only pass the id arrays when the user has narrowed away from "All".
    const locationIds = this.selectedLocations();
    const employeeIds = this.selectedEmployees();
    if (locationIds.length > 0) payload.locationIds = locationIds;
    if (employeeIds.length > 0) payload.employeeIds = employeeIds;

    this.fetchReport(payload, this.rangeTitle(startDate, endDate));
  }

  /** Quick link — a whole month, no employee/location filters. */
  onQuickLink(link: QuickLink): void {
    this.fetchReport(
      {
        startDate: link.startDate,
        endDate: link.endDate,
        generateExcel: false,
      },
      link.label,
    );
  }

  /** Return from the results view to the filter form. */
  onBack(): void {
    this.showReport.set(false);
    this.reportError.set('');
    this.downloadError.set('');
    this.activePayload = null;
  }

  /**
   * Download .xlsx — re-calls the report endpoint with the same filters as the
   * shown report plus `generateExcel: true`, then saves the returned file.
   */
  onDownload(): void {
    const payload = this.activePayload;
    if (!payload || this.downloading()) return;

    this.downloading.set(true);
    this.downloadError.set('');

    this.reportsService.downloadMonthlyAttendanceExcel(payload).subscribe({
      next: (base64) => {
        this.downloading.set(false);
        this.saveExcel(base64);
      },
      error: (err) => {
        this.downloading.set(false);
        this.downloadError.set(apiErrorMessage(err));
      },
    });
  }

  /** Read a cell value for a given row/column, rendering nullish as "—". */
  cell(row: MonthlyAttendanceRow, column: string): string {
    const value = row[column];
    if (value === null || value === undefined || value === '') return '—';

    // The DOJ comes back as an ISO datetime — show a readable date.
    if (column === 'DOJ') return this.formatDate(String(value));

    return String(value);
  }

  // ── Formatting helpers ─────────────────────────────────────────────────────

  private readonly monthAbbr = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  /** "2016-09-01T00:00:00.000Z" → "01-Sep-16" (empty-safe). */
  private formatDate(iso: string): string {
    // Use the date part directly to avoid timezone shifting the day.
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    if (!match) return iso;
    const [, year, month, day] = match;
    const monthName = this.monthAbbr[Number(month) - 1] ?? month;
    return `${day}-${monthName}-${year.slice(2)}`;
  }

  // ── Internals ────────────────────────────────────────────────────────────────

  private fetchReport(payload: MonthlyAttendanceRequest, title: string): void {
    this.showReport.set(true);
    this.loading.set(true);
    this.reportError.set('');
    this.downloadError.set('');
    this.reportRows.set([]);
    this.reportTitle.set(title);
    // Remember the request so Download .xlsx reuses the same filters.
    this.activePayload = { ...payload, generateExcel: false };

    this.reportsService.getMonthlyAttendance(payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (!res.success) {
          this.reportError.set(
            res.message?.trim() || 'Unable to generate the report.',
          );
          return;
        }
        this.reportRows.set(res.data ?? []);
      },
      error: (err) => {
        this.loading.set(false);
        this.reportError.set(apiErrorMessage(err));
      },
    });
  }

  /**
   * Saves the generated .xlsx. The backend returns the file as a raw base64
   * string, which we decode into a Blob and download.
   */
  private saveExcel(base64: string): void {
    const content = base64?.trim();
    if (!content) {
      this.downloadError.set('The server did not return a downloadable file.');
      return;
    }

    let blobUrl: string;
    try {
      blobUrl = this.base64ToBlobUrl(content);
    } catch {
      this.downloadError.set('The downloaded file was not valid. Please try again.');
      return;
    }

    this.triggerDownload(blobUrl, this.excelFileName());
    // Release the object URL after the download has had a chance to start.
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
  }

  /** Clicks a temporary anchor to download `url` as `fileName`. */
  private triggerDownload(url: string, fileName: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /** Converts a (possibly data-URL) base64 .xlsx string into a Blob object URL. */
  private base64ToBlobUrl(base64: string): string {
    // The text body may arrive JSON-quoted and/or with whitespace — clean it.
    let clean = base64.trim();
    if (clean.startsWith('"') && clean.endsWith('"')) {
      clean = clean.slice(1, -1);
    }
    clean = clean.replace(/\s/g, '');

    const comma = clean.indexOf(',');
    const raw = clean.startsWith('data:') && comma !== -1
      ? clean.slice(comma + 1)
      : clean;

    const bytes = atob(raw);
    const buffer = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i);

    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    return URL.createObjectURL(blob);
  }

  /** A sensible default download name, e.g. "attendance-2026-10-01_2026-10-31.xlsx". */
  private excelFileName(): string {
    const p = this.activePayload;
    if (p) return `attendance-${p.startDate}_${p.endDate}.xlsx`;
    return 'attendance-report.xlsx';
  }

  /**
   * Builds the quick-links list: the current month followed by the previous
   * four months (most recent first). Each entry carries the first/last day of
   * that month as yyyy-mm-dd.
   */
  private buildQuickLinks(): QuickLink[] {
    const now = new Date();
    const links: QuickLink[] = [];

    for (let i = 0; i < 5; i++) {
      const year = now.getFullYear();
      const monthIndex = now.getMonth() - i;
      // Date normalises negative/overflow month indices across year bounds.
      const first = new Date(year, monthIndex, 1);
      const last = new Date(year, monthIndex + 1, 0);

      links.push({
        label: `${MONTH_NAMES[first.getMonth()]} ${first.getFullYear()}`,
        startDate: this.toIso(first),
        endDate: this.toIso(last),
      });
    }

    return links;
  }

  private rangeTitle(start: string, end: string): string {
    return `${start} to ${end}`;
  }

  private toIso(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }
}

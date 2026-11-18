import {
  DayCell,
  MonthlyAttendanceRow,
} from '../interface/reports-response.interface';

/**
 * Builds the printable "Daily Attendance" sheet HTML, styled to mirror the
 * statutory register layout. One shared header is rendered once at the top and
 * every employee is appended as a repeating three-row block beneath it:
 *
 *   ┌──────┬──────┬──────────── DAILY ATTENDANCE FOR THE MONTH OF … ─────────────┬── No. of Days ──┬─────────┐
 *   │ Sl.  │ Name │  1  2  3 … (date number headers)                              │ P A L Late      │ Remarks │   ← standard header (once)
 *   ├──────┼──────┼──────────────────────────────────────────────────────────────┼─────────────────┼─────────┤
 *   │      │      │ Time-in   | per-day check-in / status                         │                 │         │
 *   │  n   │ Name │ Time-out  | per-day check-out                                 │  (blank)        │ (blank) │   ← repeats per employee
 *   │      │      │ Sig       | per-day signature image                           │                 │         │
 *   └──────┴──────┴──────────────────────────────────────────────────────────────┴─────────────────┴─────────┘
 *
 * The "No. of Days" group (Present / Absent / Leave / Late) and "Remarks" are
 * intentionally left blank per requirement.
 *
 * The returned string is a complete standalone HTML document ready to be
 * written into a new window and printed.
 */
export function buildAttendancePrintHtml(
  rows: MonthlyAttendanceRow[],
  rangeLabel: string,
): string {
  // The date range is identical across every row in a report, so the day
  // columns (and therefore the standard header) are derived once from the
  // first row and shared by all employee blocks below.
  const days = rows.length ? extractDays(rows[0]) : [];
  const dayCount = days.length;
  const monthLabel = rows.length ? String(rows[0]['Month'] ?? '').trim() : '';

  const dateHeaderCells = days
    .map((d) => `<th class="aps-day">${escapeHtml(d.label)}</th>`)
    .join('');

  const body = rows.map((row) => buildEmployeeRows(row)).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Daily Attendance ${escapeHtml(rangeLabel)}</title>
  <style>${PRINT_CSS}</style>
</head>
<body>
  <div class="aps-toolbar">
    <span class="aps-toolbar-title">Daily Attendance Register${monthLabel ? ' - ' + escapeHtml(monthLabel) : ''}</span>
    <button type="button" class="aps-print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
  <section class="aps-sheet">
    <table class="aps-table">
      <thead>
        <tr class="aps-head-top">
          <th class="aps-slno" rowspan="2">Emp.<br/>Id</th>
          <th class="aps-name" rowspan="2">Name</th>
          <th class="aps-rowlabel" rowspan="2"></th>
          <th class="aps-month" colspan="${dayCount}">
            DAILY ATTENDANCE FOR THE MONTH OF ${escapeHtml(monthLabel)}
          </th>
          <th class="aps-days-group" colspan="4">No. of Days</th>
          <th class="aps-remarks" rowspan="2">Remarks</th>
        </tr>
        <tr class="aps-head-dates">
          ${dateHeaderCells}
          <th class="aps-count">Present</th>
          <th class="aps-count">Absent</th>
          <th class="aps-count">Leave</th>
          <th class="aps-count">Late</th>
        </tr>
      </thead>
      <tbody>
${body}
      </tbody>
    </table>
  </section>
</body>
</html>`;
}

/**
 * Builds one employee's repeating four-row block for the shared table body:
 *   - Status   : P / L / WO / NA / -
 *   - Time-in  : check-in time, or "-" when there is none
 *   - Time-out : check-out time, or "-" when there is none
 *   - Sig      : signature image, shown only on present (P) days
 * The Emp.Id column shows the employee's id (EmpNo).
 */
function buildEmployeeRows(row: MonthlyAttendanceRow): string {
  const days = extractDays(row);
  const signatureUrl = cleanSignature(row['EmployeeSignature']);
  const empId = String(row['EmpNo'] ?? '').trim();

  const statusCells = days
    .map((d) => `<td class="aps-day">${escapeHtml(statusToken(d.cell))}</td>`)
    .join('');

  const timeInCells = days
    .map((d) => `<td class="aps-day">${escapeHtml(timeInToken(d.cell))}</td>`)
    .join('');

  const timeOutCells = days
    .map((d) => `<td class="aps-day">${escapeHtml(timeOutToken(d.cell))}</td>`)
    .join('');

  const locationCells = days
    .map((d) => `<td class="aps-day">${escapeHtml(locationToken(d.cell))}</td>`)
    .join('');

  const sigCells = days
    .map((d) => `<td class="aps-day aps-sig-cell">${signatureMark(d.cell, signatureUrl)}</td>`)
    .join('');

  return `        <tr class="aps-emp-start">
          <td class="aps-slno" rowspan="5">${escapeHtml(empId)}</td>
          <td class="aps-name" rowspan="5">${escapeHtml(String(row['EmpName'] ?? ''))}</td>
          <td class="aps-rowlabel">Status</td>
          ${statusCells}
          <td class="aps-count" rowspan="5"></td>
          <td class="aps-count" rowspan="5"></td>
          <td class="aps-count" rowspan="5"></td>
          <td class="aps-count" rowspan="5"></td>
          <td class="aps-remarks" rowspan="5"></td>
        </tr>
        <tr>
          <td class="aps-rowlabel">Time-in</td>
          ${timeInCells}
        </tr>
        <tr>
          <td class="aps-rowlabel">Time-out</td>
          ${timeOutCells}
        </tr>
        <tr>
          <td class="aps-rowlabel">Location</td>
          ${locationCells}
        </tr>
        <tr>
          <td class="aps-rowlabel">Sig.</td>
          ${sigCells}
        </tr>`;
}

// ── Day extraction ───────────────────────────────────────────────────────────

interface DayEntry {
  /** Full key, e.g. "3 Oct 26". */
  key: string;
  /** Short header label — the day number, e.g. "3". */
  label: string;
  cell: DayCell;
}

/** Keys on a row that are NOT per-day columns. */
const NON_DAY_KEYS = new Set<string>([
  'EmpNo',
  'EmpName',
  'DOJ',
  'Designation',
  'Client',
  'Location',
  'EmployeeSignature',
  'Month',
  'Total Working Days',
  'Days Worked',
]);

/** A row key is a day column when it starts with a day number, e.g. "3 Oct 26". */
function extractDays(row: MonthlyAttendanceRow): DayEntry[] {
  const days: DayEntry[] = [];

  for (const key of Object.keys(row)) {
    if (NON_DAY_KEYS.has(key)) continue;
    const value = row[key];
    if (!isDayCell(value)) continue;

    const dayNumber = /^(\d+)/.exec(key.trim());
    days.push({
      key,
      label: dayNumber ? dayNumber[1] : key,
      cell: value,
    });
  }

  return days;
}

function isDayCell(value: unknown): value is DayCell {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in (value as Record<string, unknown>)
  );
}

// ── Cell tokens ──────────────────────────────────────────────────────────────

/**
 * Status row content — the raw status code (P / L / WO / NA), falling back to
 * "-" when there is no status for the day.
 */
function statusToken(cell: DayCell): string {
  const status = (cell.status ?? '').trim().toUpperCase();
  return status || '-';
}

/** Time-in row content — the check-in time, or "-" when there is none. */
function timeInToken(cell: DayCell): string {
  return formatTime(cell.checkinDatetime) || '-';
}

/** Time-out row content — the check-out time, or "-" when there is none. */
function timeOutToken(cell: DayCell): string {
  return formatTime(cell.checkoutDatetime) || '-';
}

/** Location row content — the check-in location code, or "-" when there is none. */
function locationToken(cell: DayCell): string {
  const code = cell.checkinLocCode ?? cell.checkInLocation ?? cell.locCode ?? '';
  return String(code).trim() || '-';
}

/**
 * Signature cell content. A small signature image is placed on present (P)
 * days when a signature URL is available; otherwise the cell is empty.
 */
function signatureMark(cell: DayCell, signatureUrl: string): string {
  const status = (cell.status ?? '').trim().toUpperCase();
  if (status === 'P' && signatureUrl) {
    return `<img class="aps-sig-img" src="${escapeAttr(signatureUrl)}" alt="sig" />`;
  }
  return '';
}

// ── Formatting helpers ───────────────────────────────────────────────────────

/**
 * Converts a raw timestamp to a 12-hour clock time.
 * "2026-10-03 18:03:00.000000" → "6:03pm", "2026-10-03 09:30:…" → "9:30am".
 * Empty-safe.
 */
function formatTime(raw: string | null): string {
  if (!raw) return '';
  const match = /\d{4}-\d{2}-\d{2}[ T](\d{2}):(\d{2})/.exec(raw);
  if (!match) return '';

  const hours24 = Number(match[1]);
  const minutes = match[2];
  const suffix = hours24 >= 12 ? 'pm' : 'am';
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;

  return `${hours12}:${minutes}${suffix}`;
}

/** Normalises the signature value to a usable URL, or '' when absent. */
function cleanSignature(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

// ── Print stylesheet ─────────────────────────────────────────────────────────

const PRINT_CSS = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 16px;
    font-family: 'Times New Roman', Georgia, serif;
    color: #000;
    background: #f3f4f6;
  }
  .aps-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }
  .aps-toolbar-title {
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: #0f2137;
  }
  .aps-print-btn {
    padding: 8px 18px;
    border: 0;
    border-radius: 6px;
    background: #f5a623;
    color: #0f2137;
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }
  .aps-print-btn:hover { filter: brightness(0.96); }

  .aps-sheet {
    margin: 0 auto 18px;
    padding: 10px;
    background: #fff;
    overflow-x: auto;
  }

  /* Content-driven column widths (no fixed layout) so the time values claim
     the space they need instead of wrapping inside a rigid 26px column. */
  .aps-table {
    border-collapse: collapse;
    width: 100%;
  }
  .aps-table th,
  .aps-table td {
    border: 1px solid #000;
    font-size: 10px;
    text-align: center;
    padding: 1px 2px;
  }

  /* The standard header is shown once; repeat it on every printed page. */
  .aps-table thead { display: table-header-group; }
  .aps-head-top th { background: #f7f7f7; }
  .aps-month {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .aps-days-group { font-weight: 700; }

  /* Heavier top border marks the start of each employee's four-row block and
     keeps a block from splitting across a page break. */
  .aps-emp-start > td { border-top: 2px solid #000; }
  .aps-emp-start { page-break-inside: avoid; }

  .aps-slno   { width: 34px; font-weight: 700; white-space: nowrap; }
  .aps-name   { width: 108px; text-align: left; padding-left: 5px; }
  .aps-remarks{ width: 86px; }

  /* No. of Days count columns: keep each header label on a single line. */
  .aps-count {
    width: 30px;
    font-size: 8.5px;
    white-space: nowrap;
    padding-left: 1px;
    padding-right: 1px;
  }

  /* Row labels (Status / Time-in / Time-out / Sig) — kept compact so the day
     columns get the bulk of the width. */
  .aps-rowlabel {
    width: 42px;
    text-align: left;
    padding-left: 3px;
    font-size: 8px;
    white-space: nowrap;
  }

  /* Day columns size to their content; times never wrap. */
  .aps-day {
    min-width: 28px;
    height: 20px;
    white-space: nowrap;
  }
  td.aps-day { font-size: 8px; letter-spacing: -0.2px; }

  /* Signature cell: give the image more room and render it darker/crisper so
     faint pen strokes stay readable in print. */
  .aps-sig-cell { height: 40px; padding: 1px; }
  .aps-sig-img {
    max-width: 100%;
    max-height: 38px;
    object-fit: contain;
    display: inline-block;
    /* Darken light signatures: boost contrast and knock down brightness so
       pale strokes become clearly visible on the printed sheet. */
    filter: grayscale(1) contrast(2.4) brightness(0.5);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  @media print {
    body { background: #fff; padding: 0; }
    .aps-toolbar { display: none; }
    .aps-sheet { margin: 0; padding: 0; }
    @page { size: landscape; margin: 10mm; }
  }
`;

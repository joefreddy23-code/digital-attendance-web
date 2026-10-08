import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';

interface DayCell {
  day: number;
  iso: string;
  inMonth: boolean;
  disabled: boolean;
  isToday: boolean;
  isSelected: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

@Component({
  selector: 'app-date-picker',
  imports: [],
  templateUrl: './date-picker.html',
  styleUrl: './date-picker.css',
})
export class DatePicker {
  private readonly host = inject(ElementRef<HTMLElement>);

  /** Selected date as yyyy-mm-dd (two-way bindable). */
  readonly value = model<string>('');

  /** Optional max selectable date (yyyy-mm-dd). Future days are disabled. */
  readonly max = input<string>('');

  /** Optional min selectable date (yyyy-mm-dd). */
  readonly min = input<string>('');

  readonly placeholder = input<string>('mm/dd/yyyy');

  /** When true, the trigger is greyed out and the calendar cannot be opened. */
  readonly disabled = input<boolean>(false);

  readonly weekdays = WEEKDAYS;

  readonly isOpen = signal(false);

  // Month currently shown in the calendar grid.
  private readonly viewYear = signal(new Date().getFullYear());
  private readonly viewMonth = signal(new Date().getMonth());

  readonly monthLabel = computed(
    () => `${MONTHS[this.viewMonth()]} ${this.viewYear()}`,
  );

  readonly displayValue = computed(() => {
    const v = this.value();
    if (!v) return '';
    const [y, m, d] = v.split('-');
    return `${m}-${d}-${y}`;
  });

  readonly weeks = computed<DayCell[][]>(() => {
    const year = this.viewYear();
    const month = this.viewMonth();
    const todayIso = this.toIso(new Date());
    const selected = this.value();
    const maxIso = this.max();
    const minIso = this.min();

    const first = new Date(year, month, 1);
    const startOffset = first.getDay(); // 0 = Sunday
    const start = new Date(year, month, 1 - startOffset);

    const grid: DayCell[][] = [];
    const cursor = new Date(start);

    for (let w = 0; w < 6; w++) {
      const row: DayCell[] = [];
      for (let d = 0; d < 7; d++) {
        const iso = this.toIso(cursor);
        const beyondMax = maxIso ? iso > maxIso : false;
        const beforeMin = minIso ? iso < minIso : false;
        row.push({
          day: cursor.getDate(),
          iso,
          inMonth: cursor.getMonth() === month,
          disabled: beyondMax || beforeMin,
          isToday: iso === todayIso,
          isSelected: !!selected && iso === selected,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      grid.push(row);
    }
    return grid;
  });

  // ── Open / close ──────────────────────────────────────────────────────────
  toggle(): void {
    if (this.disabled()) {
      return;
    }
    if (this.isOpen()) {
      this.close();
    } else {
      this.syncViewToValue();
      this.isOpen.set(true);
    }
  }

  close(): void {
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  // ── Navigation ──────────────────────────────────────────────────────────
  prevMonth(): void {
    const m = this.viewMonth();
    if (m === 0) {
      this.viewMonth.set(11);
      this.viewYear.update((y) => y - 1);
    } else {
      this.viewMonth.set(m - 1);
    }
  }

  nextMonth(): void {
    const m = this.viewMonth();
    if (m === 11) {
      this.viewMonth.set(0);
      this.viewYear.update((y) => y + 1);
    } else {
      this.viewMonth.set(m + 1);
    }
  }

  // ── Selection ─────────────────────────────────────────────────────────────
  select(cell: DayCell): void {
    if (cell.disabled) return;
    this.value.set(cell.iso);
    this.close();
  }

  selectToday(): void {
    const todayIso = this.toIso(new Date());
    const maxIso = this.max();
    if (maxIso && todayIso > maxIso) return;
    this.value.set(todayIso);
    this.syncViewToValue();
    this.close();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private syncViewToValue(): void {
    const v = this.value();
    const base = v ? new Date(`${v}T00:00:00`) : new Date();
    this.viewYear.set(base.getFullYear());
    this.viewMonth.set(base.getMonth());
  }

  private toIso(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }
}

import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  model,
  output,
  signal,
} from '@angular/core';

type Mode = 'hour' | 'minute';

interface ClockLabel {
  text: string;
  value: number;
  x: number;
  y: number;
}

const SIZE = 250;
const CENTER = SIZE / 2;
const LABEL_RADIUS = 95;

function polar(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.sin(rad),
    y: CENTER - radius * Math.cos(rad),
  };
}

/**
 * Analog clock time picker (hour face, then minute face) with AM/PM toggle.
 * `value` is a 24-hour "HH:mm" string ('' when nothing is chosen). It is only
 * updated when the user presses OK.
 */
@Component({
  selector: 'app-clock-time-picker',
  imports: [],
  host: {
    '(click)': 'onBackdrop($event)',
    '(document:keydown.escape)': 'cancel()',
  },
  templateUrl: './clock-time-picker.html',
  styleUrl: './clock-time-picker.css',
})
export class ClockTimePicker implements OnInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly value = model<string>('');
  /** Emitted after OK (value already updated) or Cancel. */
  readonly closed = output<void>();

  readonly size = SIZE;
  readonly center = CENTER;

  readonly mode = signal<Mode>('hour');
  readonly hour = signal(12); // 1-12
  readonly minute = signal(0); // 0-59
  readonly meridiem = signal<'AM' | 'PM'>('AM');

  readonly hourText = computed(() => String(this.hour()));
  readonly minuteText = computed(() => String(this.minute()).padStart(2, '0'));

  readonly hourLabels: ClockLabel[] = Array.from({ length: 12 }, (_, i) => {
    const value = i + 1;
    return { text: String(value), value, ...polar(value * 30, LABEL_RADIUS) };
  });

  readonly minuteLabels: ClockLabel[] = Array.from({ length: 12 }, (_, i) => {
    const value = i * 5;
    return {
      text: String(value).padStart(2, '0'),
      value,
      ...polar(value * 6, LABEL_RADIUS),
    };
  });

  /** Hand angle in degrees for the active face. */
  private readonly angle = computed(() =>
    this.mode() === 'hour' ? (this.hour() % 12) * 30 : this.minute() * 6,
  );

  readonly handEnd = computed(() => polar(this.angle(), LABEL_RADIUS));

  readonly isOnLabel = computed(
    () => this.mode() === 'hour' || this.minute() % 5 === 0,
  );

  readonly bubbleText = computed(() =>
    this.mode() === 'hour' ? this.hourText() : this.minuteText(),
  );

  readonly labels = computed(() =>
    this.mode() === 'hour' ? this.hourLabels : this.minuteLabels,
  );

  private dragging = false;

  ngOnInit(): void {
    // Re-parent to <body> so no ancestor (transform, overflow, etc. on the review
    // modal) can clip or contain the fixed overlay.
    document.body.appendChild(this.host.nativeElement);
    const m = /^(\d{1,2}):(\d{2})/.exec(this.value());
    if (!m) {
      return;
    }
    const h24 = Number(m[1]);
    this.meridiem.set(h24 >= 12 ? 'PM' : 'AM');
    this.hour.set(h24 % 12 || 12);
    this.minute.set(Number(m[2]));
  }

  ngOnDestroy(): void {
    this.host.nativeElement.remove();
  }

  setMode(mode: Mode): void {
    this.mode.set(mode);
  }

  setMeridiem(m: 'AM' | 'PM'): void {
    this.meridiem.set(m);
  }

  onPointerDown(event: PointerEvent): void {
    this.dragging = true;
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
    this.pick(event);
  }

  onPointerMove(event: PointerEvent): void {
    if (this.dragging) {
      this.pick(event);
    }
  }

  onPointerUp(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    this.dragging = false;
    this.pick(event);
    // After choosing the hour, move on to the minutes.
    if (this.mode() === 'hour') {
      this.mode.set('minute');
    }
  }

  onKey(event: KeyboardEvent): void {
    const step =
      event.key === 'ArrowUp' || event.key === 'ArrowRight'
        ? 1
        : event.key === 'ArrowDown' || event.key === 'ArrowLeft'
          ? -1
          : 0;
    if (!step) {
      return;
    }
    event.preventDefault();
    if (this.mode() === 'hour') {
      this.hour.set(((this.hour() - 1 + step + 12) % 12) + 1);
    } else {
      this.minute.set((this.minute() + step + 60) % 60);
    }
  }

  confirm(): void {
    let h = this.hour() % 12;
    if (this.meridiem() === 'PM') {
      h += 12;
    }
    this.value.set(`${String(h).padStart(2, '0')}:${this.minuteText()}`);
    this.closed.emit();
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancel();
    }
  }

  cancel(): void {
    this.closed.emit();
  }

  private pick(event: PointerEvent): void {
    const rect = (event.currentTarget as Element).getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (deg < 0) {
      deg += 360;
    }
    if (this.mode() === 'hour') {
      this.hour.set(Math.round(deg / 30) % 12 || 12);
    } else {
      this.minute.set(Math.round(deg / 6) % 60);
    }
  }
}

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

export interface MultiSelectOption {
  value: number;
  label: string;
  /** Optional leading text rendered in bold before the label. */
  prefix?: string;
}

/**
 * A Bootstrap-styled multi-select dropdown with checkboxes.
 *
 * The selection is exposed as a two-way bindable array of option values.
 * An empty selection is rendered as the "all" label (e.g. "All locations").
 */
@Component({
  selector: 'app-multi-select',
  imports: [],
  templateUrl: './multi-select.html',
  styleUrl: './multi-select.css',
})
export class MultiSelect {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly options = input<MultiSelectOption[]>([]);

  /** Selected option values (two-way bindable). Empty means "all". */
  readonly value = model<number[]>([]);

  /** Shown when nothing is selected, e.g. "All locations". */
  readonly allLabel = input<string>('All');

  /** Shown as the control label for the "select all" row, e.g. "locations". */
  readonly itemNoun = input<string>('items');

  readonly disabled = input<boolean>(false);

  readonly isOpen = signal(false);

  readonly allSelected = computed(
    () => this.options().length > 0 && this.value().length === this.options().length,
  );

  readonly summary = computed(() => {
    const selected = this.value();
    if (selected.length === 0 || this.allSelected()) {
      return this.allLabel();
    }
    if (selected.length === 1) {
      const match = this.options().find((o) => o.value === selected[0]);
      return match?.label ?? this.allLabel();
    }
    return `${selected.length} ${this.itemNoun()} selected`;
  });

  toggle(): void {
    if (this.disabled()) return;
    this.isOpen.update((open) => !open);
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

  isChecked(optionValue: number): boolean {
    return this.value().includes(optionValue);
  }

  onOptionToggle(optionValue: number): void {
    const current = this.value();
    this.value.set(
      current.includes(optionValue)
        ? current.filter((v) => v !== optionValue)
        : [...current, optionValue],
    );
  }

  onToggleAll(): void {
    this.value.set(this.allSelected() ? [] : this.options().map((o) => o.value));
  }
}

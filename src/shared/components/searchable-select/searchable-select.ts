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

export interface SearchableSelectOption {
  value: string;
  label: string;
}

/**
 * Single-select dropdown with a search box. The popup is as wide as the
 * trigger; long labels wrap instead of overflowing the screen.
 */
@Component({
  selector: 'app-searchable-select',
  imports: [],
  templateUrl: './searchable-select.html',
  styleUrl: './searchable-select.css',
})
export class SearchableSelect {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly options = input<SearchableSelectOption[]>([]);
  readonly value = model<string>('');
  readonly inputId = input<string>('');
  readonly placeholder = input<string>('Search...');

  readonly isOpen = signal(false);
  readonly query = signal('');

  readonly selectedLabel = computed(
    () => this.options().find((o) => o.value === this.value())?.label ?? '',
  );

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q ? this.options().filter((o) => o.label.toLowerCase().includes(q)) : this.options();
  });

  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.query.set('');
      this.isOpen.set(true);
      setTimeout(() => this.host.nativeElement.querySelector('.ss__search')?.focus());
    }
  }

  close(): void {
    this.isOpen.set(false);
  }

  select(opt: SearchableSelectOption): void {
    this.value.set(opt.value);
    this.close();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target)) this.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }
}

import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { DatePicker } from '../../shared/components/date-picker/date-picker';
import {
  EmployeeFormInitial,
  EmployeeFormMode,
  EmployeeFormModal,
  EmployeeFormValue,
} from '../../shared/components/employee-form-modal/employee-form-modal';
import { Auth } from '../../shared/services/auth/auth';
import { EmployeesService } from '../../shared/services/employees/employees';
import {
  Employee,
  FieldLocation,
  FieldRole,
  GetFieldsData,
} from '../../shared/utils/interface/employees-response.interface';
import { apiErrorMessage } from '../../shared/utils/http/api-error-message';

interface FilterOption {
  value: string;
  label: string;
}

const ALL = 'All';

@Component({
  selector: 'app-employees',
  imports: [DatePicker, EmployeeFormModal],
  templateUrl: './employees.html',
  styleUrl: './employees.css',
})
export class Employees implements OnInit {
  private readonly employeesService = inject(EmployeesService);
  private readonly auth = inject(Auth);

  // ── Role ───────────────────────────────────────────────────────────────
  // Role 1 (Admin/HR) has full access. Role 2 (Account Manager) can only edit
  // the location allocations on an existing employee.
  get empRoleId(): number | null {
    return this.auth.getUser()?.empRoleId ?? null;
  }

  get isAdmin(): boolean {
    return this.empRoleId === 1;
  }

  // ── Filters ────────────────────────────────────────────────────────────
  readonly search = signal('');
  readonly location = signal(ALL);
  readonly role = signal(ALL);
  readonly date = signal(this.today());

  // Max selectable date is today — future dates are not allowed.
  readonly maxDate = this.today();

  // The date the currently displayed list was loaded for.
  // Status labels depend on whether this is today or a past date.
  private readonly appliedDate = signal(this.today());

  readonly isAppliedDateToday = computed(
    () => this.appliedDate() === this.today(),
  );

  // Dropdown options are populated from the get-fields API on init.
  readonly locationOptions = signal<FilterOption[]>([{ value: ALL, label: ALL }]);
  readonly roleOptions = signal<FilterOption[]>([{ value: ALL, label: ALL }]);

  // Raw master data for the Add/Edit modal dropdowns.
  readonly fieldsData = signal<GetFieldsData | null>(null);

  readonly fieldsError = signal('');

  // ── Data ───────────────────────────────────────────────────────────────
  readonly employees = signal<Employee[]>([]);
  readonly listError = signal('');
  readonly isLoading = signal(false);

  // ── Add / Edit modal state ─────────────────────────────────────────────
  readonly modalOpen = signal(false);
  readonly modalMode = signal<EmployeeFormMode>('add');
  readonly modalInitial = signal<EmployeeFormInitial | null>(null);
  readonly modalSubtitleName = signal('');
  readonly modalSubtitleEmployeeId = signal('');

  // ── Pagination ───────────────────────────────────────────────────────────
  readonly pageSize = 6;
  readonly currentPage = signal(1);

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.employees().length / this.pageSize)),
  );

  readonly pagedEmployees = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.employees().slice(start, start + this.pageSize);
  });

  readonly rangeStart = computed(() =>
    this.employees().length === 0
      ? 0
      : (this.currentPage() - 1) * this.pageSize + 1,
  );

  readonly rangeEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize, this.employees().length),
  );

  readonly pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1),
  );

  // ── Lifecycle ──────────────────────────────────────────────────────────
  ngOnInit(): void {
    // Defaults: today's date, empty search.
    this.date.set(this.today());
    this.search.set('');
    this.loadFields();
    // First call sends only the date — no role/location/search filters.
    this.loadEmployees(true);
  }

  loadFields(): void {
    this.employeesService.getFields().subscribe({
      next: (res) => {
        if (!res.success || !res.data) {
          this.fieldsError.set(res.message?.trim() || 'Unable to load filters.');
          return;
        }
        this.fieldsError.set('');
        this.fieldsData.set(res.data);
        this.setRoleOptions(res.data.roles);
        this.setLocationOptions(res.data.locations);
      },
      error: (err) => {
        this.fieldsError.set(apiErrorMessage(err));
      },
    });
  }

  /**
   * Loads the employees list.
   * @param dateOnly when true, only the date is sent (initial load);
   *                 otherwise the selected role/location/search are applied.
   */
  loadEmployees(dateOnly = false): void {
    this.isLoading.set(true);

    // Guard against future dates — never request beyond today.
    const requestedDate = this.clampDate(this.date());
    if (requestedDate !== this.date()) {
      this.date.set(requestedDate);
    }

    const role = this.role();
    const location = this.location();
    const searchText = this.search();

    this.employeesService
      .getEmployees({
        date: requestedDate,
        role: dateOnly || role === ALL ? null : role,
        locationId: dateOnly || location === ALL ? null : location,
        searchText: dateOnly ? null : searchText,
      })
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.currentPage.set(1);
          this.appliedDate.set(requestedDate);
          if (!res.success || !res.data) {
            this.employees.set([]);
            this.listError.set(res.message?.trim() || 'Unable to load employees.');
            return;
          }
          this.listError.set('');
          this.employees.set(res.data);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.employees.set([]);
          this.listError.set(apiErrorMessage(err));
        },
      });
  }

  private setRoleOptions(roles: FieldRole[]): void {
    const options: FilterOption[] = [{ value: ALL, label: ALL }];
    for (const r of roles) {
      options.push({ value: String(r.roleId), label: r.roleName });
    }
    this.roleOptions.set(options);
  }

  private setLocationOptions(locations: FieldLocation[]): void {
    const options: FilterOption[] = [{ value: ALL, label: ALL }];
    for (const l of locations) {
      options.push({
        value: String(l.locationId),
        label: `${l.locationCode} · ${l.locationName}`,
      });
    }
    this.locationOptions.set(options);
  }

  // ── Actions ────────────────────────────────────────────────────────────
  onSubmit(): void {
    // Apply all currently selected filters.
    this.loadEmployees(false);
  }

  onReset(): void {
    // Clear all filters back to defaults and reload with current date only.
    this.search.set('');
    this.location.set(ALL);
    this.role.set(ALL);
    this.date.set(this.today());
    this.loadEmployees(true);
  }

  onAddEmployee(): void {
    this.modalMode.set('add');
    this.modalInitial.set(null);
    this.modalSubtitleName.set('');
    this.modalSubtitleEmployeeId.set('');
    this.modalOpen.set(true);
  }

  onView(emp: Employee): void {
    // Static placeholder.
  }

  onEdit(emp: Employee): void {
    this.modalMode.set('edit');
    this.modalSubtitleName.set(emp.name);
    this.modalSubtitleEmployeeId.set(String(emp.id));
    // Map allocated location codes back to their ids from master data.
    const locs = this.fieldsData()?.locations ?? [];
    const locationIds = (emp.allocatedLocations ?? [])
      .map((code) => locs.find((l) => l.locationCode === code)?.locationId)
      .filter((id): id is number => id != null);
    // Prefill with the row's known values.
    this.modalInitial.set({
      employeeNo: String(emp.id),
      fullName: emp.name,
      email: emp.email,
      mobileNumber: emp.mobileNumber,
      roleId: emp.roleId,
      designationId: emp.designationId,
      locationIds,
    });
    this.modalOpen.set(true);
  }

  onToggleActive(emp: Employee): void {
    // Static placeholder — would disable/enable the employee.
  }

  // ── Modal callbacks ────────────────────────────────────────────────────
  onModalSave(value: EmployeeFormValue): void {
    // Static for now — API wiring comes later.
    this.modalOpen.set(false);
  }

  onModalCancel(): void {
    this.modalOpen.set(false);
  }

  onModalDeactivate(): void {
    // Static for now — would deactivate the employee.
    this.modalOpen.set(false);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }

  prevPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  // ── Template helpers ─────────────────────────────────────────────────────
  formatLocations(locations: string[]): string {
    return locations?.length ? locations.join(', ') : '—';
  }

  statusLabel(status: string): string {
    const code = (status || '').toUpperCase();
    if (this.isAppliedDateToday()) {
      // Today's view
      switch (code) {
        case 'P':
          return 'Checked In';
        case 'L':
          return 'Yet to check in';
        case 'WO':
          return 'Week off';
        default:
          return status || '—';
      }
    }
    // Past date view
    switch (code) {
      case 'P':
        return 'Present';
      case 'L':
        return 'Leave';
      case 'WO':
        return 'Week off';
      default:
        return status || '—';
    }
  }

  statusClass(status: string): string {
    const code = (status || '').toUpperCase();
    const today = this.isAppliedDateToday();
    switch (code) {
      case 'P':
        // Checked In (today) and Present (past) both read as positive.
        return 'emp-status--in';
      case 'L':
        // "Yet to check in" today is pending; "Leave" in the past is neutral.
        return today ? 'emp-status--pending' : 'emp-status--leave';
      case 'WO':
        return 'emp-status--leave';
      default:
        return 'emp-status--pending';
    }
  }

  // ── Date helpers ─────────────────────────────────────────────────────────
  private today(): string {
    // yyyy-mm-dd for the native date input, in local time.
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }

  /** Returns the given yyyy-mm-dd clamped so it never exceeds today. */
  private clampDate(value: string): string {
    const max = this.today();
    if (!value) {
      return max;
    }
    return value > max ? max : value;
  }

  onDateChange(value: string): void {
    this.date.set(this.clampDate(value));
  }
}

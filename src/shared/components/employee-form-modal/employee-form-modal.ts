import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { DatePicker } from '../date-picker/date-picker';
import {
  FieldClient,
  FieldDesignation,
  FieldLocation,
  FieldReportingEmployee,
  FieldRole,
  GetFieldsData,
} from '../../utils/interface/employees-response.interface';

export type EmployeeFormMode = 'add' | 'edit';

export interface EmployeeFormInitial {
  employeeNo?: string;
  fullName?: string;
  email?: string;
  mobileNumber?: string;
  dateOfJoining?: string;
  clientId?: number | null;
  roleId?: number | null;
  designationId?: number | null;
  locationIds?: number[];
  supervisorId?: number | null;
  accountManagerId?: number | null;
}

export interface EmployeeFormValue {
  employeeNo: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  dateOfJoining: string;
  clientId: number | null;
  roleId: number | null;
  designationId: number | null;
  locationIds: number[];
  supervisorId: number | null;
  accountManagerId: number | null;
}

const ROLE_ID_EMPLOYEE = 4;
const ROLE_ID_SUPERVISOR = 3;
const ROLE_ID_ACCOUNT_MANAGER = 2;

@Component({
  selector: 'app-employee-form-modal',
  imports: [ReactiveFormsModule, DatePicker],
  templateUrl: './employee-form-modal.html',
  styleUrl: './employee-form-modal.css',
})
export class EmployeeFormModal {
  private readonly fb = inject(FormBuilder);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly mode = input<EmployeeFormMode>('add');
  readonly subtitleName = input<string>('');
  readonly subtitleEmployeeId = input<string>('');
  readonly initial = input<EmployeeFormInitial | null>(null);

  /**
   * When true (Account Manager / role 2 editing), every field is locked
   * except the Locations multi-select. The user may only change allocations.
   */
  readonly restrictToLocations = input<boolean>(false);

  /** Master dropdown data from the get-fields API. */
  readonly fields = input<GetFieldsData | null>(null);

  readonly save = output<EmployeeFormValue>();
  readonly cancel = output<void>();
  readonly deactivate = output<void>();

  readonly today = this.toIso(new Date());

  readonly isEdit = computed(() => this.mode() === 'edit');

  // ── Derived dropdown data ──────────────────────────────────────────────
  readonly roles = computed<FieldRole[]>(() => this.fields()?.roles ?? []);
  readonly clients = computed<FieldClient[]>(() => this.fields()?.clients ?? []);
  readonly allLocations = computed<FieldLocation[]>(
    () => this.fields()?.locations ?? [],
  );

  readonly supervisors = computed<FieldReportingEmployee[]>(() =>
    (this.fields()?.reportingEmployees ?? []).filter(
      (e) => e.roleId === ROLE_ID_SUPERVISOR,
    ),
  );

  readonly accountManagers = computed<FieldReportingEmployee[]>(() =>
    (this.fields()?.reportingEmployees ?? []).filter(
      (e) => e.roleId === ROLE_ID_ACCOUNT_MANAGER,
    ),
  );

  // Selected role drives designation list + supervisor/AM rules.
  readonly selectedRoleId = signal<number | null>(null);

  readonly designations = computed<FieldDesignation[]>(() => {
    const roleId = this.selectedRoleId();
    if (roleId == null) return [];
    return (this.fields()?.designation ?? []).filter(
      (d) => d.roleId === roleId,
    );
  });

  readonly isRoleEmployee = computed(
    () => this.selectedRoleId() === ROLE_ID_EMPLOYEE,
  );
  readonly isRoleSupervisor = computed(
    () => this.selectedRoleId() === ROLE_ID_SUPERVISOR,
  );

  // ── Location multi-select ──────────────────────────────────────────────
  readonly locationDropdownOpen = signal(false);
  readonly locationSearch = signal('');
  readonly selectedLocationIds = signal<number[]>([]);

  readonly filteredLocations = computed<FieldLocation[]>(() => {
    const term = this.locationSearch().trim().toLowerCase();
    const list = this.allLocations();
    if (!term) return list;
    return list.filter(
      (l) =>
        l.locationCode.toLowerCase().includes(term) ||
        l.locationName.toLowerCase().includes(term),
    );
  });

  readonly selectedLocationLabel = computed(() => {
    const ids = this.selectedLocationIds();
    if (!ids.length) return '';
    const byId = new Map(this.allLocations().map((l) => [l.locationId, l]));
    const first = byId.get(ids[0]);
    const firstLabel = first ? first.locationCode : '';
    return ids.length > 1 ? `${firstLabel}  +${ids.length - 1}` : firstLabel;
  });

  // ── Form ───────────────────────────────────────────────────────────────
  readonly form = this.fb.group({
    employeeNo: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    mobileNumber: [
      '',
      [Validators.required, Validators.pattern(/^[+\d][\d\s-]{6,19}$/)],
    ],
    dateOfJoining: ['', [Validators.required]],
    clientId: [null as number | null, [Validators.required]],
    roleId: [null as number | null, [Validators.required]],
    designationId: [
      { value: null as number | null, disabled: true },
      [Validators.required],
    ],
    locationIds: [[] as number[], [this.requireAtLeastOne]],
    supervisorId: [null as number | null],
    accountManagerId: [null as number | null],
  });

  get f() {
    return this.form.controls;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────
  ngOnInit(): void {
    const init = this.initial();
    if (init) {
      this.selectedRoleId.set(init.roleId ?? null);
      this.selectedLocationIds.set(init.locationIds ?? []);

      this.form.patchValue({
        employeeNo: init.employeeNo ?? '',
        fullName: init.fullName ?? '',
        email: init.email ?? '',
        mobileNumber: init.mobileNumber ?? '',
        dateOfJoining: init.dateOfJoining ?? '',
        clientId: init.clientId ?? null,
        roleId: init.roleId ?? null,
        designationId: init.designationId ?? null,
        locationIds: init.locationIds ?? [],
        supervisorId: init.supervisorId ?? null,
        accountManagerId: init.accountManagerId ?? null,
      });
    }
    this.applyRoleRules(this.selectedRoleId(), false);

    // Role 2 (Account Manager) edit: lock everything except Locations.
    if (this.restrictToLocations()) {
      this.applyLocationOnlyRestriction();
    }

    // React to role changes from the form control itself so the value is
    // the actual roleId (ngValue), not the DOM option string.
    this.f.roleId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((roleId) => {
        const prev = this.selectedRoleId();
        this.selectedRoleId.set(roleId ?? null);
        if (roleId !== prev) {
          // Reset designation whenever the role actually changes.
          this.f.designationId.setValue(null);
        }
        this.applyRoleRules(roleId ?? null, true);
      });
  }

  private applyRoleRules(roleId: number | null, resetDependents: boolean): void {
    // Designation: enabled only once a role is picked.
    if (roleId == null) {
      this.f.designationId.disable();
    } else {
      this.f.designationId.enable();
    }

    // Supervisor: disabled when the person themselves is a Supervisor.
    if (roleId === ROLE_ID_SUPERVISOR) {
      if (resetDependents) this.f.supervisorId.setValue(null);
      this.f.supervisorId.disable();
    } else {
      this.f.supervisorId.enable();
    }

    // Supervisor + Account Manager are mandatory only for Employees.
    const employee = roleId === ROLE_ID_EMPLOYEE;
    this.setRequired(this.f.supervisorId, employee);
    this.setRequired(this.f.accountManagerId, employee);
  }

  /**
   * Disables every control except `locationIds` so an Account Manager can only
   * adjust the location allocations. Called once on init when restricted.
   */
  private applyLocationOnlyRestriction(): void {
    Object.entries(this.form.controls).forEach(([name, control]) => {
      if (name === 'locationIds') {
        control.enable({ emitEvent: false });
      } else {
        control.disable({ emitEvent: false });
      }
    });
  }

  private setRequired(control: typeof this.f.supervisorId, required: boolean): void {
    if (required) {
      control.addValidators(Validators.required);
    } else {
      control.removeValidators(Validators.required);
    }
    control.updateValueAndValidity({ emitEvent: false });
  }

  private requireAtLeastOne(control: {
    value: number[];
  }): ValidationErrors | null {
    return Array.isArray(control.value) && control.value.length > 0
      ? null
      : { required: true };
  }

  // ── Employee No: numbers only ──────────────────────────────────────────
  onEmployeeNoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '');
    if (digits !== input.value) {
      input.value = digits;
    }
    this.f.employeeNo.setValue(digits);
  }

  // ── Date of joining ────────────────────────────────────────────────────
  onDojChange(value: string): void {
    this.f.dateOfJoining.setValue(value);
    this.f.dateOfJoining.markAsTouched();
  }

  // ── Location multi-select ──────────────────────────────────────────────
  toggleLocationDropdown(): void {
    this.locationDropdownOpen.update((v) => !v);
  }

  isLocationSelected(id: number): boolean {
    return this.selectedLocationIds().includes(id);
  }

  toggleLocation(id: number): void {
    const current = this.selectedLocationIds();
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    this.selectedLocationIds.set(next);
    this.f.locationIds.setValue(next);
    this.f.locationIds.markAsTouched();
  }

  closeLocationDropdown(): void {
    this.locationDropdownOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const wrap = this.host.nativeElement.querySelector('.efm-loc');
    if (wrap && !wrap.contains(event.target as Node)) {
      this.closeLocationDropdown();
    }
  }

  // ── Submit / cancel ────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.form.getRawValue() as EmployeeFormValue);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onDeactivate(): void {
    this.deactivate.emit();
  }

  onBackdrop(): void {
    this.cancel.emit();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private toIso(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }
}

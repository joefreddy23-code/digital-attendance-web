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
  AbstractControl,
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
  /** Existing profile image path from the API, e.g. "profile_image/5/123.png". */
  profileImgPath?: string | null;
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
  /**
   * Base64 data URL of a newly picked profile image, or null when no new image
   * was chosen. When set, the parent must upload it (profile-img-url) before
   * the upsert and use the returned s3Key as profileImgPath.
   */
  profilePhotoBase64: string | null;
  /**
   * The existing profile image path from the API (edit mode), or null. Used by
   * the parent as profileImgPath when the image was NOT replaced.
   */
  existingProfileImgPath: string | null;
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

  // ── Profile photo (images only) ────────────────────────────────────────
  /** Name of the chosen image file (or existing one), shown in the picker. */
  readonly photoName = signal<string>('');
  /** Validation message shown when a non-image is selected. */
  readonly photoError = signal<string>('');
  /**
   * True when there is a photo already (an existing one from the API, or a
   * freshly picked file). Drives the "Replace" vs "Upload" button label.
   */
  readonly hasPhoto = signal<boolean>(false);
  /** The selected image File, converted to base64 on submit. */
  private photoFile: File | null = null;
  /** Existing profile image path from the API, if any. */
  private existingPhotoPath: string | null = null;

  // ── Location multi-select ──────────────────────────────────────────────
  readonly locationDropdownOpen = signal(false);
  readonly locationSearch = signal('');
  readonly selectedLocationIds = signal<number[]>([]);
  /** When true, the panel opens above the trigger so it stays inside the modal. */
  readonly locationDropUp = signal(false);

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
    mobileNumber: ['', [Validators.required, this.validMobileNumber]],
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

      // Seed the profile photo field from the existing image path, if present.
      const path = init.profileImgPath?.trim();
      if (path) {
        this.existingPhotoPath = path;
        this.photoName.set(this.fileNameFromPath(path));
        this.hasPhoto.set(true);
      }
    }
    this.applyRoleRules(this.selectedRoleId(), false);

    // Employee No and Date of Joining are immutable on edit. Their values are
    // still submitted because onSubmit() uses getRawValue(). Email stays
    // editable so it can be corrected on edit.
    if (this.isEdit()) {
      this.f.employeeNo.disable({ emitEvent: false });
      this.f.dateOfJoining.disable({ emitEvent: false });
    }

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
    // Account Manager (role 2): Supervisor and Account Manager do not apply —
    // they are always sent as null and the fields are locked. Designation IS
    // applicable (the get-fields API returns designations for role 2).
    const accountManager = roleId === ROLE_ID_ACCOUNT_MANAGER;

    // Designation: required for every role, enabled once a role is picked.
    if (roleId == null) {
      this.f.designationId.disable();
    } else {
      this.f.designationId.enable();
    }

    // Supervisor: disabled when the person themselves is a Supervisor, or an
    // Account Manager.
    if (roleId === ROLE_ID_SUPERVISOR || accountManager) {
      // For an Account Manager the value must always be null (even on initial
      // load of an edit), so clear it unconditionally in that case.
      if (resetDependents || accountManager) this.f.supervisorId.setValue(null);
      this.f.supervisorId.disable();
    } else {
      this.f.supervisorId.enable();
    }

    // Account Manager field: disabled when the person is an Account Manager
    // (their own supervisor/AM allocations do not apply), always sent as null.
    if (accountManager) {
      this.f.accountManagerId.setValue(null);
      this.f.accountManagerId.disable();
    } else {
      this.f.accountManagerId.enable();
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

  private setRequired(control: AbstractControl, required: boolean): void {
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

  /**
   * Validates a mobile number. Accepts an optional "+" and country code,
   * with spaces/dashes as separators. The 10-digit national number must be a
   * genuine mobile number: it has to start with 6-9 and cannot be a single
   * repeated digit (e.g. 0000000000 or 9999999999).
   */
  private validMobileNumber(control: {
    value: string;
  }): ValidationErrors | null {
    const raw = (control.value ?? '').toString().trim();
    if (!raw) return null; // `required` handles the empty case.

    // Only digits, spaces, dashes and an optional leading "+" are allowed.
    if (!/^\+?[\d\s-]+$/.test(raw)) return { mobile: true };

    const digits = raw.replace(/\D/g, '');

    // Drop a leading country code so we validate the 10-digit national number.
    // Handles "+91 98450 55555", "0091...", "091..." and plain 10-digit input.
    let national = digits;
    if (raw.startsWith('+') && national.length > 10) {
      national = national.slice(national.length - 10);
    } else if (national.length === 12 && national.startsWith('91')) {
      national = national.slice(2);
    } else if (national.length === 11 && national.startsWith('0')) {
      national = national.slice(1);
    }

    // Must be exactly 10 digits, start with 6-9, and not be all the same digit.
    if (!/^[6-9]\d{9}$/.test(national)) return { mobile: true };
    if (/^(\d)\1{9}$/.test(national)) return { mobile: true };

    return null;
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

  // ── Profile photo ──────────────────────────────────────────────────────
  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      // Nothing picked — fall back to any existing image from the API.
      this.photoFile = null;
      this.restoreExistingPhoto();
      this.photoError.set('');
      return;
    }

    // Accept image file types only.
    if (!file.type.startsWith('image/')) {
      this.photoFile = null;
      this.restoreExistingPhoto();
      this.photoError.set('Only image files are allowed.');
      input.value = '';
      return;
    }

    this.photoFile = file;
    this.photoName.set(file.name);
    this.hasPhoto.set(true);
    this.photoError.set('');
  }

  /**
   * Sets the "required" error when no photo is present (neither a freshly
   * picked file nor an existing image from the API). Leaves any existing
   * message (e.g. the non-image error) untouched. Returns true when a photo
   * is present.
   */
  private validatePhotoRequired(): boolean {
    const hasPhoto = !!this.photoFile || !!this.existingPhotoPath;
    if (!hasPhoto) {
      this.photoError.set('Profile photo is required.');
    }
    return hasPhoto;
  }

  /** Restores the display to the existing API image (or empty when none). */
  private restoreExistingPhoto(): void {
    if (this.existingPhotoPath) {
      this.photoName.set(this.fileNameFromPath(this.existingPhotoPath));
      this.hasPhoto.set(true);
    } else {
      this.photoName.set('');
      this.hasPhoto.set(false);
    }
  }

  /** "profile_image/5/1791806273717.png" → "1791806273717.png". */
  private fileNameFromPath(path: string): string {
    const segments = path.split(/[\\/]/);
    return segments[segments.length - 1] || path;
  }

  /** Reads the selected image File as a base64 data URL. */
  private readPhotoAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  // ── Date of joining ────────────────────────────────────────────────────
  onDojChange(value: string): void {
    this.f.dateOfJoining.setValue(value);
    this.f.dateOfJoining.markAsTouched();
  }

  // ── Location multi-select ──────────────────────────────────────────────
  /** Approximate panel height (px) used to decide drop direction. */
  private static readonly LOC_PANEL_HEIGHT = 320;

  toggleLocationDropdown(): void {
    const willOpen = !this.locationDropdownOpen();
    if (willOpen) {
      this.decideLocationDropDirection();
    }
    this.locationDropdownOpen.set(willOpen);
  }

  /**
   * Decides whether the location panel should open downward or upward so it
   * always stays within the scrollable modal. If the space below the trigger
   * (up to the modal's bottom edge) can't fit the panel but the space above
   * can, flip it upward.
   */
  private decideLocationDropDirection(): void {
    const trigger = this.host.nativeElement.querySelector(
      '.efm-loc__trigger',
    ) as HTMLElement | null;
    const modal = this.host.nativeElement.querySelector(
      '.efm-modal',
    ) as HTMLElement | null;
    if (!trigger || !modal) {
      this.locationDropUp.set(false);
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const modalRect = modal.getBoundingClientRect();
    const spaceBelow = modalRect.bottom - triggerRect.bottom;
    const spaceAbove = triggerRect.top - modalRect.top;
    const needed = EmployeeFormModal.LOC_PANEL_HEIGHT;

    this.locationDropUp.set(spaceBelow < needed && spaceAbove > spaceBelow);
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
  async onSubmit(): Promise<void> {
    // Profile photo is mandatory. It is satisfied by a freshly picked image
    // (add, or edit with a replacement) or an existing image carried over from
    // the API (edit). Validate it before the form so the error always shows,
    // even when the rest of the form is valid.
    this.validatePhotoRequired();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Reject submit if the photo is missing or an invalid (non-image) file is
    // still flagged.
    if (this.photoError()) {
      return;
    }

    // Convert a freshly picked image to base64 so the parent can upload it.
    // When no new image was chosen we send null and surface the existing path
    // instead, letting the parent reuse it unchanged.
    let profilePhotoBase64: string | null = null;
    if (this.photoFile) {
      try {
        profilePhotoBase64 = await this.readPhotoAsBase64(this.photoFile);
      } catch {
        this.photoError.set('Could not read the selected image. Please try again.');
        return;
      }
    }

    const value: EmployeeFormValue = {
      ...(this.form.getRawValue() as Omit<
        EmployeeFormValue,
        'profilePhotoBase64' | 'existingProfileImgPath'
      >),
      profilePhotoBase64,
      existingProfileImgPath: this.existingPhotoPath,
    };

    this.save.emit(value);
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

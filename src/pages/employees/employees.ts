import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { DatePicker } from '../../shared/components/date-picker/date-picker';
import {
  EmployeeFormInitial,
  EmployeeFormMode,
  EmployeeFormModal,
  EmployeeFormValue,
} from '../../shared/components/employee-form-modal/employee-form-modal';
import { ResultModal } from '../../shared/components/result-modal/result-modal';
import type { ResultModalVariant } from '../../shared/components/result-modal/result-modal';
import { DeactivateEmployeeModal } from '../../shared/components/deactivate-employee-modal/deactivate-employee-modal';
import { Auth } from '../../shared/services/auth/auth';
import { EmployeesService } from '../../shared/services/employees/employees';
import {
  Employee,
  FieldLocation,
  FieldRole,
  GetFieldsData,
  UpsertEmployeeRequest,
} from '../../shared/utils/interface/employees-response.interface';
import { apiErrorMessage } from '../../shared/utils/http/api-error-message';
import { switchMap } from 'rxjs/operators';
import { of, throwError } from 'rxjs';

interface FilterOption {
  value: string;
  label: string;
}

const ALL = 'All';

@Component({
  selector: 'app-employees',
  imports: [DatePicker, EmployeeFormModal, ResultModal, DeactivateEmployeeModal],
  templateUrl: './employees.html',
  styleUrl: './employees.css',
})
export class Employees implements OnInit {
  private readonly employeesService = inject(EmployeesService);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

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

  // Edit details fetch (get-one-employee) state.
  readonly isEditLoading = signal(false);
  readonly editError = signal('');

  // The real id of the employee being edited (null in add mode).
  private readonly editingEmployeeId = signal<number | null>(null);

  // Save (upsert) state.
  readonly isSaving = signal(false);

  // Common result modal (success / error) shown after an upsert.
  readonly resultModalOpen = signal(false);
  readonly resultModalVariant = signal<ResultModalVariant>('success');
  readonly resultModalTitle = signal('');
  readonly resultModalMessage = signal('');
  // Whether the last upsert succeeded — drives the list refresh on modal close.
  private readonly lastSaveSucceeded = signal(false);

  // ── Deactivate (relieve) employee modal state ───────────────────────────
  readonly deactivateModalOpen = signal(false);
  readonly deactivateEmployeeName = signal('');
  readonly isDeactivating = signal(false);
  readonly deactivateError = signal('');
  // The id of the employee queued for deactivation (null when idle).
  private readonly deactivateEmployeeId = signal<number | null>(null);

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
    this.editingEmployeeId.set(null);
    this.modalOpen.set(true);
  }

  onView(emp: Employee): void {
    // Open the single-employee detail screen (with recent attendance). Carry
    // the date the list is currently filtered on so the detail screen fetches
    // the attendance window ending on that same date.
    void this.router.navigate(['/employees/view', emp.id], {
      queryParams: { date: this.appliedDate() },
    });
  }

  onEdit(emp: Employee): void {
    this.modalMode.set('edit');
    this.modalSubtitleName.set(emp.name);
    this.modalSubtitleEmployeeId.set(String(emp.id));
    this.editingEmployeeId.set(emp.id);
    this.editError.set('');
    this.isEditLoading.set(true);

    // Fetch the full employee details and open the modal only once they arrive,
    // so the form can patch every field (joining date, client, supervisor, AM,
    // allocated locations) rather than just the list-row values.
    this.employeesService.getEmployee({ employeeId: emp.id }).subscribe({
      next: (res) => {
        this.isEditLoading.set(false);
        if (!res.success || !res.data) {
          this.editError.set(
            res.message?.trim() || 'Unable to load employee details.',
          );
          return;
        }

        const e = res.data.employee;

        // Location ids come back as strings (e.g. ["2", "13"]); the form uses
        // numeric ids for the multi-select.
        const locationIds = (e.allocatedLocationIds ?? [])
          .map((id) => Number(id))
          .filter((id) => !Number.isNaN(id));

        this.modalInitial.set({
          employeeNo: String(e.id),
          fullName: e.name,
          email: e.email,
          mobileNumber: e.mobileNumber,
          dateOfJoining: this.toIsoDate(e.joiningDate),
          clientId: e.clientId,
          roleId: e.roleId,
          designationId: e.designationId,
          locationIds,
          supervisorId: e.supervisorId,
          accountManagerId: e.accountManagerId,
          profileImgPath: e.profileImgPath,
        });
        this.modalOpen.set(true);
      },
      error: (err) => {
        this.isEditLoading.set(false);
        this.editError.set(apiErrorMessage(err));
      },
    });
  }

  /** Normalises an ISO datetime (e.g. "2016-09-01T00:00:00.000Z") to "YYYY-MM-DD". */
  private toIsoDate(value: string | null): string {
    if (!value) return '';
    const idx = value.indexOf('T');
    return idx > 0 ? value.slice(0, idx) : value;
  }

  onToggleActive(emp: Employee): void {
    // Open the relieving-date confirmation modal for this employee.
    this.openDeactivateModal(emp.id, emp.name);
  }

  // ── Modal callbacks ────────────────────────────────────────────────────
  onModalSave(value: EmployeeFormValue): void {
    // Add + edit share one endpoint. For edit we send the real employee id
    // captured when the modal opened; for add we use the employee number the
    // user typed. The backend decides insert vs update from `empId`.
    const empId =
      this.editingEmployeeId() ?? Number(value.employeeNo);

    if (Number.isNaN(empId)) {
      this.showResultModal('error', 'Something went wrong', 'Invalid employee number.');
      return;
    }

    this.isSaving.set(true);

    // Two-step, dependent sequence:
    //   1. If a new image was picked, upload it (profile-img-url) and take the
    //      returned s3Key as the profileImgPath.
    //   2. Otherwise (edit without replacing the image, or add without a photo)
    //      send profileImgPath as null so the backend leaves the stored image
    //      untouched — never re-saving the returned presigned URL as the key.
    // The upsert ALWAYS waits for step 1 to succeed; any image failure aborts
    // the chain and surfaces an error modal — the upsert is never called.
    const needsImageUpload = !!value.profilePhotoBase64;

    const resolveProfilePath$ = needsImageUpload
      ? this.employeesService
          .uploadProfileImage({
            empId,
            imageBase64: value.profilePhotoBase64 as string,
          })
          .pipe(
            switchMap((imgRes) => {
              if (!imgRes.success || !imgRes.data?.s3Key) {
                // Image upload failed — stop here, do not call upsert.
                return throwError(
                  () =>
                    new Error(
                      imgRes.message?.trim() ||
                        'Failed to upload the profile image.',
                    ),
                );
              }
              return of<string | null>(imgRes.data.s3Key);
            }),
          )
      : of<string | null>(null);

    resolveProfilePath$
      .pipe(
        switchMap((profileImgPath) => {
          const payload: UpsertEmployeeRequest = {
            empId,
            fullName: value.fullName.trim(),
            joiningDate: value.dateOfJoining,
            email: value.email.trim(),
            mobileNumber: value.mobileNumber.trim(),
            roleId: Number(value.roleId),
            // designationId is null for an Account Manager (role 2); keep it
            // null rather than coercing to 0.
            designationId:
              value.designationId == null ? null : Number(value.designationId),
            supervisorId: value.supervisorId ?? null,
            accountManagerId: value.accountManagerId ?? null,
            // The s3Key from the image upload, or the existing path on an edit
            // where the photo was not replaced.
            profileImgPath,
            clientId: Number(value.clientId),
            locationIds: value.locationIds ?? [],
          };
          return this.employeesService.upsertEmployee(payload);
        }),
      )
      .subscribe({
        next: (res) => {
          this.isSaving.set(false);
          if (!res.success) {
            // API responded but the operation failed — show the message.
            this.lastSaveSucceeded.set(false);
            this.showResultModal(
              'error',
              'Something went wrong',
              res.message?.trim() || 'Failed to save employee.',
            );
            return;
          }
          // Success — close the form, remember to refresh, and surface the
          // backend message (e.g. "Employee saved successfully").
          this.modalOpen.set(false);
          this.editingEmployeeId.set(null);
          this.lastSaveSucceeded.set(true);
          this.showResultModal(
            'success',
            'Success',
            res.data?.message?.trim() || 'Employee saved successfully.',
          );
        },
        error: (err) => {
          this.isSaving.set(false);
          this.lastSaveSucceeded.set(false);
          // An image-upload failure arrives here as a plain Error (thrown in
          // the switchMap above); use its message directly. HTTP errors from
          // either call fall back to the shared formatter.
          const message =
            err instanceof Error && !(err as { status?: unknown }).status
              ? err.message
              : apiErrorMessage(err);
          this.showResultModal('error', 'Something went wrong', message);
        },
      });
  }

  onModalCancel(): void {
    this.modalOpen.set(false);
  }

  onModalDeactivate(): void {
    // Triggered from the edit form's "Deactivate employee" button. The real
    // employee id was captured when the edit modal opened.
    const id = this.editingEmployeeId();
    if (id == null) {
      return;
    }
    // Close the edit form and open the relieving-date confirmation modal.
    this.modalOpen.set(false);
    this.openDeactivateModal(id, this.modalSubtitleName());
  }

  // ── Deactivate (relieve) employee ───────────────────────────────────────
  private openDeactivateModal(employeeId: number, employeeName: string): void {
    this.deactivateEmployeeId.set(employeeId);
    this.deactivateEmployeeName.set(employeeName);
    this.deactivateError.set('');
    this.isDeactivating.set(false);
    this.deactivateModalOpen.set(true);
  }

  onDeactivateCancel(): void {
    if (this.isDeactivating()) {
      return;
    }
    this.deactivateModalOpen.set(false);
    this.deactivateEmployeeId.set(null);
    this.deactivateError.set('');
  }

  onDeactivateConfirm(relievingDate: string): void {
    const id = this.deactivateEmployeeId();
    if (id == null || !relievingDate) {
      return;
    }

    this.isDeactivating.set(true);
    this.deactivateError.set('');

    this.employeesService
      .deactivateEmployee({ employeeId: id, relievingDate })
      .subscribe({
        next: (res) => {
          this.isDeactivating.set(false);
          if (!res.success) {
            this.deactivateError.set(
              res.message?.trim() || 'Unable to deactivate employee.',
            );
            return;
          }
          // Close the confirmation modal, surface the success message, and
          // flag a refresh so the list reflects the change on dismissal.
          this.deactivateModalOpen.set(false);
          this.deactivateEmployeeId.set(null);
          this.lastSaveSucceeded.set(true);
          this.showResultModal(
            'success',
            'Success',
            res.message?.trim() || 'Employee deactivated successfully.',
          );
        },
        error: (err) => {
          this.isDeactivating.set(false);
          this.deactivateError.set(apiErrorMessage(err));
        },
      });
  }

  // ── Result modal (common success / error dialog) ────────────────────────
  private showResultModal(
    variant: ResultModalVariant,
    title: string,
    message: string,
  ): void {
    this.resultModalVariant.set(variant);
    this.resultModalTitle.set(title);
    this.resultModalMessage.set(message);
    this.resultModalOpen.set(true);
  }

  onResultModalClosed(): void {
    this.resultModalOpen.set(false);
    // After a successful save, refresh the list so the new/updated employee
    // is reflected (the "redirect" back to the up-to-date list).
    if (this.lastSaveSucceeded()) {
      this.lastSaveSucceeded.set(false);
      this.loadEmployees();
    }
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

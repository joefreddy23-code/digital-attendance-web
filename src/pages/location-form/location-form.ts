import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { LocationsService } from '../../shared/services/locations/locations';
import { UpsertLocationRequest } from '../../shared/utils/interface/locations-response.interface';

@Component({
  selector: 'app-location-form',
  imports: [ReactiveFormsModule],
  templateUrl: './location-form.html',
  styleUrl: './location-form.css',
})
export class LocationForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly locationsService = inject(LocationsService);

  /** null = add mode, number = edit mode */
  locationId: number | null = null;
  isEditMode = false;

  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  form = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(20)]],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    city: ['', [Validators.required, Validators.maxLength(60)]],
    radiusInMeters: [
      null as number | null,
      [Validators.required, Validators.min(1), Validators.max(50000)],
    ],
    latitude: [
      '',
      [
        Validators.required,
        Validators.pattern(/^-?([1-8]?\d(\.\d+)?|90(\.0+)?)$/),
      ],
    ],
    longitude: [
      '',
      [
        Validators.required,
        Validators.pattern(/^-?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/),
      ],
    ],
  });

  // ── Convenience field accessors ──────────────────────────────────────────────
  get f() {
    return this.form.controls;
  }

  get pageTitle(): string {
    return this.isEditMode ? 'Edit location' : 'Add a work location';
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const parsed = Number(idParam);
      if (!Number.isNaN(parsed) && parsed > 0) {
        this.locationId = parsed;
        this.isEditMode = true;
        this.fetchLocation(parsed);
      }
    }
  }

  private fetchLocation(id: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.locationsService.getLocation({ locationId: id }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (!res.success || !res.data) {
          this.errorMessage =
            res.message?.trim() || 'Unable to load location details.';
          return;
        }
        const loc = res.data.location;
        this.form.patchValue({
          code: loc.code,
          name: loc.physicalAddress,
          city: loc.city,
          radiusInMeters: loc.radiusInMeters,
          latitude: loc.latitude,
          longitude: loc.longitude,
        });
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Unable to load location details.';
      },
    });
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const payload: UpsertLocationRequest = {
      locationId: this.locationId,
      code: v.code!.trim(),
      name: v.name!.trim(),
      city: v.city!.trim(),
      radiusInMeters: Number(v.radiusInMeters),
      latitude: v.latitude!.trim(),
      longitude: v.longitude!.trim(),
    };

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.locationsService.upsertLocation(payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (!res.success || !res.data) {
          this.errorMessage =
            res.message?.trim() || 'Failed to save location.';
          return;
        }
        this.successMessage = res.data.message;
        // Brief pause so user sees the success message, then go back
        setTimeout(() => void this.router.navigate(['/locations']), 1200);
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'Failed to save location. Please try again.';
      },
    });
  }

  onCancel(): void {
    void this.router.navigate(['/locations']);
  }
}

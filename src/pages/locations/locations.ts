import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import { Auth } from '../../shared/services/auth/auth';
import { LocationsService } from '../../shared/services/locations/locations';
import { Location } from '../../shared/utils/interface/locations-response.interface';
import { apiErrorMessage } from '../../shared/utils/http/api-error-message';

// Modal states
type ModalState = 'confirm' | 'success' | 'error';

@Component({
  selector: 'app-locations',
  imports: [],
  templateUrl: './locations.html',
  styleUrl: './locations.css',
})
export class Locations implements OnInit {
  private readonly auth = inject(Auth);
  private readonly locationsService = inject(LocationsService);
  private readonly router = inject(Router);

  locations: Location[] = [];
  errorMessage = '';

  // ── Disable modal state ───────────────────────────────────────────────────
  disableModalOpen = false;
  disableModalState: ModalState = 'confirm';
  disableModalMessage = '';
  disablingLocation: Location | null = null;
  isDisabling = false;

  // ── Role ─────────────────────────────────────────────────────────────────
  get empRoleId(): number | null {
    return this.auth.getUser()?.empRoleId ?? null;
  }

  get isAdmin(): boolean {
    return this.empRoleId === 1;
  }

  // ── Computed summary ─────────────────────────────────────────────────────
  get totalEmployees(): number {
    return this.locations.reduce((sum, l) => sum + l.totalemployeeCount, 0);
  }

  get uniqueCities(): number {
    const cities = new Set(this.locations.map((l) => l.code.split('-')[0]));
    return cities.size;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadLocations();
  }

  loadLocations(): void {
    this.locationsService.getLocations().subscribe({
      next: (res) => {
        if (!res.success || !res.data) {
          this.locations = [];
          this.errorMessage = res.message?.trim() || 'Unable to load locations.';
          return;
        }
        this.errorMessage = '';
        this.locations = res.data.locations;
      },
      error: () => {
        this.locations = [];
        this.errorMessage = 'Unable to load locations.';
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  formatRadius(meters: number): string {
    return meters >= 1000 ? `${meters / 1000} km` : `${meters} m`;
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  onEdit(location: Location): void {
    void this.router.navigate(['/locations/edit', location.id]);
  }

  onAddLocation(): void {
    void this.router.navigate(['/locations/new']);
  }

  // ── Disable modal flow ────────────────────────────────────────────────────
  onDisable(location: Location): void {
    this.disablingLocation = location;
    this.disableModalState = 'confirm';
    this.disableModalMessage = '';
    this.disableModalOpen = true;
  }

  confirmDisable(): void {
    if (!this.disablingLocation) return;
    this.isDisabling = true;

    this.locationsService
      .deactivateLocation({ locationId: this.disablingLocation.id })
      .subscribe({
        next: (res) => {
          this.isDisabling = false;
          if (!res.success) {
            // API returned success:false — show error inside modal
            this.disableModalState = 'error';
            this.disableModalMessage =
              res.message?.trim() ||
              'Cannot deactivate this location.';
            return;
          }
          // Success
          this.disableModalState = 'success';
          this.disableModalMessage =
            res.data?.message ?? 'Location deactivated successfully.';
          // Remove the card from the list
          this.locations = this.locations.filter(
            (l) => l.id !== this.disablingLocation!.id,
          );
        },
        error: (err) => {
          this.isDisabling = false;
          this.disableModalState = 'error';
          this.disableModalMessage = apiErrorMessage(err);
        },
      });
  }

  closeDisableModal(): void {
    this.disableModalOpen = false;
    this.disablingLocation = null;
  }
}

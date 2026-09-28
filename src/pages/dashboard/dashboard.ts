import { Component, inject } from '@angular/core';

import { Auth } from '../../shared/services/auth/auth';

export interface OverviewLocationRow {
  city: string;
  present: number;
  total: number;
}

export interface OverviewReviewItem {
  name: string;
  location: string;
  status: string;
}

export interface OverviewModalItem {
  name: string;
  location: string;
  supervisor: string;
  note: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly auth = inject(Auth);

  readonly summary = {
    totalEmployees: 207,
    checkedIn: 188,
    yetToCheckIn: 19,
  };

  readonly locations: OverviewLocationRow[] = [
    { city: 'Bangalore', present: 72, total: 78 },
    { city: 'Chennai', present: 34, total: 36 },
    { city: 'Mumbai', present: 28, total: 32 },
    { city: 'Pune', present: 21, total: 23 },
    { city: 'Hyderabad', present: 19, total: 22 },
    { city: 'Gurgaon', present: 14, total: 16 },
  ];

  readonly reviewItems: OverviewReviewItem[] = [
    {
      name: 'John Mathew',
      location: 'Bangalore · BLR 3',
      status: 'Missed check-out',
    },
    {
      name: 'Vikram R',
      location: 'Chennai · CHN 1',
      status: 'Missed check-out',
    },
    {
      name: 'Deepa Nair',
      location: 'Mumbai · BOM 2',
      status: 'Missed check-out',
    },
  ];

  readonly modalItems: OverviewModalItem[] = [
    {
      name: 'John Mathew',
      location: 'Bangalore · BLR 3',
      supervisor: 'Sneha Iyer',
      note: 'Left site at 6:15 PM for a client call. Confirmed by gate register.',
    },
    {
      name: 'Vikram R',
      location: 'Chennai · CHN 1',
      supervisor: 'Karthik Menon',
      note: 'Phone battery died on site. Verified by team lead.',
    },
    {
      name: 'Deepa Nair',
      location: 'Mumbai · BOM 2',
      supervisor: 'Priya Desai',
      note: 'Left early for a family emergency. Approved verbally.',
    },
  ];

  isModalOpen = false;

  get empRoleId(): number | null {
    return this.auth.getUser()?.empRoleId ?? null;
  }

  get showNeedsReview(): boolean {
    return this.empRoleId === 2;
  }

  percentPresent(present: number, total: number): number {
    if (total <= 0) {
      return 0;
    }
    return Math.round((present / total) * 100);
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }
}

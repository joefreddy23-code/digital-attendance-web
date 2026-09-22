import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth',
  imports: [RouterOutlet],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class Auth {
  readonly features = [
    {
      title: 'Employees',
      detail: 'add, edit and assign roles and sites',
      icon: 'employees',
    },
    {
      title: 'Locations',
      detail: 'approved sites and attendance area',
      icon: 'locations',
    },
    {
      title: 'Reports',
      detail: 'Shops & Establishment export',
      icon: 'reports',
    },
  ] as const;
}

import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-auth',
  imports: [RouterOutlet],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class Auth {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

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

  private readonly childData$ = this.router.events.pipe(
    filter((e): e is NavigationEnd => e instanceof NavigationEnd),
    startWith(null),
    map(() => {
      let child = this.route.firstChild;
      while (child?.firstChild) {
        child = child.firstChild;
      }
      return child?.snapshot?.data ?? {};
    }),
  );

  readonly headline = toSignal(
    this.childData$.pipe(map((d) => (d['headline'] as string) ?? '')),
    { initialValue: '' },
  );

  readonly description = toSignal(
    this.childData$.pipe(map((d) => (d['description'] as string) ?? '')),
    { initialValue: '' },
  );
}

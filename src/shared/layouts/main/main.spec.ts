import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Routes } from '@angular/router';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';

import { Auth } from '../../services/auth/auth';
import { LoginUserData } from '../../utils/interface/auth-response.interface';
import { Main } from './main';

@Component({ standalone: true, template: `<p>page</p>` })
class StubPage {}

const routes: Routes = [
  {
    path: '',
    component: Main,
    children: [{ path: 'dashboard', component: StubPage }],
  },
];

describe('Main', () => {
  let fixture: ComponentFixture<Main>;
  let auth: jasmine.SpyObj<Auth>;

  const userData: LoginUserData = {
    empId: 1,
    empName: 'Vijay Sam',
    empEmail: 'joe_f@trigent.com',
    empRoleId: 1,
    empRole: 'Human Resource/ Admin',
    token: 'test-token',
    tokenType: 'Bearer',
    expiresIn: 86400,
    expiryTime: '2026-09-26T03:59:19.118Z',
  };

  beforeEach(async () => {
    auth = jasmine.createSpyObj<Auth>('Auth', ['getUser']);
    auth.getUser.and.returnValue(userData);

    await TestBed.configureTestingModule({
      imports: [Main],
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        { provide: Auth, useValue: auth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Main);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render sidebar and topbar', () => {
    expect(fixture.debugElement.query(By.css('app-sidebar'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('app-topbar'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('router-outlet'))).toBeTruthy();
  });
});

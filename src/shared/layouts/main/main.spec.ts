import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Routes } from '@angular/router';
import { By } from '@angular/platform-browser';

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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Main],
      providers: [provideRouter(routes)],
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

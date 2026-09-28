import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { Auth } from '../../shared/services/auth/auth';
import { LoginUserData } from '../../shared/utils/interface/auth-response.interface';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let auth: jasmine.SpyObj<Auth>;

  const baseUser: LoginUserData = {
    empId: 1,
    empName: 'Joseph J',
    empEmail: 'joe_f@trigent.com',
    empRoleId: 1,
    empRole: 'Human Resource/ Admin',
    token: 'test-token',
    tokenType: 'Bearer',
    expiresIn: 86400,
    expiryTime: '2026-09-26T03:59:19.118Z',
  };

  async function setup(user: LoginUserData | null): Promise<void> {
    TestBed.resetTestingModule();
    auth = jasmine.createSpyObj<Auth>('Auth', ['getUser']);
    auth.getUser.and.returnValue(user);

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [{ provide: Auth, useValue: auth }],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setup(baseUser);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show summary and locations for role 1 and hide needs review', async () => {
    await setup({ ...baseUser, empRoleId: 1 });

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('207');
    expect(text).toContain('Total Employees');
    expect(text).toContain('188');
    expect(text).toContain('Checked In');
    expect(text).toContain('19');
    expect(text).toContain('Yet to Check In');
    expect(text).toContain('Attendance by location');
    expect(text).toContain('Bangalore');
    expect(text).toContain('72 of 78 present');
    expect(text).not.toContain('Needs review today');
    expect(text).not.toContain('Take action');
  });

  it('should hide needs review when user is missing', async () => {
    await setup(null);

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Attendance by location');
    expect(text).not.toContain('Needs review today');
  });

  it('should show needs review for role 2 and open/close modal', async () => {
    await setup({
      ...baseUser,
      empRoleId: 2,
      empRole: 'Account Manager',
    });

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Needs review today');
    expect(text).toContain('John Mathew');
    expect(text).toContain('Missed check-out');

    expect(fixture.debugElement.query(By.css('.overview-modal'))).toBeNull();

    const takeAction = fixture.debugElement.query(By.css('button.overview-review__action'));
    takeAction.triggerEventHandler('click', {});
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.overview-modal'))).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'Missed check-outs · supervisor notes',
    );
    expect(fixture.nativeElement.textContent).toContain('Sneha Iyer');

    const closeBtn = fixture.debugElement.query(By.css('button.overview-modal__close'));
    closeBtn.triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.overview-modal'))).toBeNull();
  });

  it('should close modal when backdrop is clicked', async () => {
    await setup({
      ...baseUser,
      empRoleId: 2,
      empRole: 'Account Manager',
    });

    fixture.componentInstance.openModal();
    fixture.detectChanges();

    const backdrop = fixture.debugElement.query(By.css('.overview-modal-backdrop'));
    backdrop.triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.overview-modal'))).toBeNull();
  });
});

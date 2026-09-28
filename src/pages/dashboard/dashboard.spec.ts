import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { Auth } from '../../shared/services/auth/auth';
import { Overview } from '../../shared/services/overview/overview';
import { LoginUserData } from '../../shared/utils/interface/auth-response.interface';
import { OverviewResponse } from '../../shared/utils/interface/overview-response.interface';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let auth: jasmine.SpyObj<Auth>;
  let overview: jasmine.SpyObj<Overview>;

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

  const overviewFixture: OverviewResponse = {
    success: true,
    data: {
      totalEmployees: 18,
      totalCheckedIn: 1,
      yettoCheckIn: 17,
      employeesByCity: [
        {
          city: 'Bengaluru',
          totalemployeeCount: 9,
          employeeCount: 1,
        },
        {
          city: 'Chennai',
          totalemployeeCount: 13,
          employeeCount: 0,
        },
      ],
      supervisorQueries: [
        {
          exceptionId: 8,
          employeeId: 3,
          employeeName: 'Joe Rosario freddy',
          attendanceId: 22,
          issueNote: 'Left early because of personal reasons,',
          checkinDatetime: '2026-09-28T04:00:00.000Z',
        },
      ],
    },
  };

  async function setup(
    user: LoginUserData | null,
    response: OverviewResponse | null = overviewFixture,
  ): Promise<void> {
    TestBed.resetTestingModule();
    auth = jasmine.createSpyObj<Auth>('Auth', ['getUser']);
    auth.getUser.and.returnValue(user);
    overview = jasmine.createSpyObj<Overview>('Overview', ['getOverview']);
    if (response) {
      overview.getOverview.and.returnValue(of(response));
    } else {
      overview.getOverview.and.returnValue(
        throwError(() => new Error('network')),
      );
    }

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        { provide: Auth, useValue: auth },
        { provide: Overview, useValue: overview },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
  }

  it('should create and load overview', async () => {
    await setup(baseUser);
    expect(fixture.componentInstance).toBeTruthy();
    expect(overview.getOverview).toHaveBeenCalled();
  });

  it('should show API summary and cities for role 1 and hide needs review', async () => {
    await setup({ ...baseUser, empRoleId: 1 });

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('18');
    expect(text).toContain('Total Employees');
    expect(text).toContain('1');
    expect(text).toContain('Checked In');
    expect(text).toContain('17');
    expect(text).toContain('Yet to Check In');
    expect(text).toContain('Bengaluru');
    expect(text).toContain('1 of 9 present');
    expect(text).toContain('Chennai');
    expect(text).not.toContain('Needs review today');
    expect(text).not.toContain('Take action');
  });

  it('should hide needs review when user is missing', async () => {
    await setup(null);

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Attendance by location');
    expect(text).not.toContain('Needs review today');
  });

  it('should show needs review for role 2 from supervisorQueries and open modal', async () => {
    await setup({
      ...baseUser,
      empRoleId: 2,
      empRole: 'Account Manager',
    });

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Needs review today');
    expect(text).toContain('Joe Rosario freddy');
    expect(text).toContain('Left early because of personal reasons,');

    const takeAction = fixture.debugElement.query(
      By.css('button.overview-review__action'),
    );
    takeAction.triggerEventHandler('click', {});
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.overview-modal'))).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'Missed check-outs · supervisor notes',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Left early because of personal reasons,',
    );
    expect(fixture.nativeElement.textContent).not.toContain('SUPERVISOR ·');

    const closeBtn = fixture.debugElement.query(
      By.css('button.overview-modal__close'),
    );
    closeBtn.triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.overview-modal'))).toBeNull();
  });

  it('should show needs review badge 0 when supervisorQueries empty for role 2', async () => {
    await setup(
      {
        ...baseUser,
        empRoleId: 2,
        empRole: 'Account Manager',
      },
      {
        success: true,
        data: {
          totalEmployees: 18,
          totalCheckedIn: 1,
          yettoCheckIn: 17,
          employeesByCity: [],
          supervisorQueries: [],
        },
      },
    );

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Needs review today');
    const badge = fixture.debugElement.query(By.css('.overview-review__badge'));
    expect(badge.nativeElement.textContent.trim()).toBe('0');
  });

  it('should close modal when backdrop is clicked', async () => {
    await setup({
      ...baseUser,
      empRoleId: 2,
      empRole: 'Account Manager',
    });

    fixture.componentInstance.openModal();
    fixture.detectChanges();

    const backdrop = fixture.debugElement.query(
      By.css('.overview-modal-backdrop'),
    );
    backdrop.triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.overview-modal'))).toBeNull();
  });

  it('should keep empty defaults when overview request fails', async () => {
    await setup({ ...baseUser, empRoleId: 1 }, null);

    expect(fixture.componentInstance.totalEmployees).toBe(0);
    expect(fixture.componentInstance.employeesByCity.length).toBe(0);
  });
});

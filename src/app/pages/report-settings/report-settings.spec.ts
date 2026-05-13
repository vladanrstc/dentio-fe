import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, beforeEach, expect, it, vi } from 'vitest';

import { ReportsApi } from '../../core/services/reports-api.service';
import { ReportSettings } from './report-settings';

describe('ReportSettings', () => {
  let component: ReportSettings;
  let fixture: ComponentFixture<ReportSettings>;
  let reportsApi: {
    getCompanyReportSubscriptions: ReturnType<typeof vi.fn>;
    saveCompanyReportSubscription: ReturnType<typeof vi.fn>;
    getAdminReportSubscriptions: ReturnType<typeof vi.fn>;
    saveAdminReportSubscription: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    reportsApi = {
      getCompanyReportSubscriptions: vi.fn(() =>
        of({
          data: [
            {
              report: 'patients',
              frequency: 'weekly',
              format: 'xlsx',
            },
          ],
        }),
      ),
      saveCompanyReportSubscription: vi.fn(() => of({ data: { report: 'patients', frequency: 'daily', format: 'csv' } })),
      getAdminReportSubscriptions: vi.fn(() => of({ data: [] })),
      saveAdminReportSubscription: vi.fn(() => of({ data: { report: 'companies', frequency: 'monthly', format: 'pdf' } })),
    };

    await TestBed.configureTestingModule({
      imports: [ReportSettings],
      providers: [
        provideRouter([
          {
            path: 'reports/settings',
            component: ReportSettings,
            data: { reportMode: 'company' },
          },
        ]),
        { provide: ReportsApi, useValue: reportsApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportSettings);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('učitava company report podešavanja', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(reportsApi.getCompanyReportSubscriptions).toHaveBeenCalledOnce();
    expect(compiled.textContent).toContain('Pacijenti');
    expect(compiled.textContent).toContain('Termini');
    expect(compiled.textContent).toContain('Intervencije i finansije');
    expect(compiled.textContent).not.toContain('Platformski pregled ordinacija');
  });

  it('primenjuje postojeći izbor učestalosti i formata u formi', () => {
    const testComponent = component as unknown as {
      settingsControls: { at(index: number): { getRawValue(): unknown } };
    };

    expect(testComponent.settingsControls.at(0).getRawValue()).toEqual({
      report: 'patients',
      frequency: 'weekly',
      format: 'xlsx',
    });
  });

  it.each(['off', 'daily', 'weekly', 'monthly'] as const)('čuva učestalost %s za pojedinačan report', (frequency) => {
    const testComponent = component as unknown as {
      settingsControls: { at(index: number): { patchValue(value: unknown): void } };
      saveSetting(index: number): void;
    };

    testComponent.settingsControls.at(0).patchValue({
      frequency,
      format: 'pdf',
    });
    testComponent.saveSetting(0);

    expect(reportsApi.saveCompanyReportSubscription).toHaveBeenCalledWith('patients', {
      frequency,
      format: 'pdf',
    });
  });
});

describe('ReportSettings admin mode', () => {
  let fixture: ComponentFixture<ReportSettings>;
  let reportsApi: {
    getCompanyReportSubscriptions: ReturnType<typeof vi.fn>;
    saveCompanyReportSubscription: ReturnType<typeof vi.fn>;
    getAdminReportSubscriptions: ReturnType<typeof vi.fn>;
    saveAdminReportSubscription: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    reportsApi = {
      getCompanyReportSubscriptions: vi.fn(() => of({ data: [] })),
      saveCompanyReportSubscription: vi.fn(() => of({ data: { report: 'patients', frequency: 'daily', format: 'csv' } })),
      getAdminReportSubscriptions: vi.fn(() =>
        of({
          data: [
            {
              report: 'companies',
              frequency: 'monthly',
              format: 'pdf',
            },
          ],
        }),
      ),
      saveAdminReportSubscription: vi.fn(() => of({ data: { report: 'companies', frequency: 'monthly', format: 'pdf' } })),
    };

    await TestBed.configureTestingModule({
      imports: [ReportSettings],
      providers: [
        provideRouter([]),
        { provide: ReportsApi, useValue: reportsApi },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { reportMode: 'admin' },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportSettings);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('superadmin vidi samo companies report i koristi admin subscription rute', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(reportsApi.getAdminReportSubscriptions).toHaveBeenCalledOnce();
    expect(reportsApi.getCompanyReportSubscriptions).not.toHaveBeenCalled();
    expect(compiled.textContent).toContain('Kompanije');
    expect(compiled.textContent).not.toContain('Pacijenti');
    expect(compiled.textContent).not.toContain('Termini');
    expect(compiled.textContent).not.toContain('Intervencije i finansije');
  });
});

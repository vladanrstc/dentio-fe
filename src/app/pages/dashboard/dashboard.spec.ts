import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FileDownloadService } from '../../core/services/file-download.service';
import { PatientsApi } from '../../core/services/patients-api.service';
import { ReportsApi } from '../../core/services/reports-api.service';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let reportsApi: {
    exportAppointments: ReturnType<typeof vi.fn>;
    exportInterventionsFinancial: ReturnType<typeof vi.fn>;
  };
  let fileDownload: { download: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    reportsApi = {
      exportAppointments: vi.fn(() => of(new Blob(['appointments']))),
      exportInterventionsFinancial: vi.fn(() => of(new Blob(['interventions']))),
    };
    fileDownload = {
      download: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        {
          provide: PatientsApi,
          useValue: {
            getDashboard: vi.fn(() => of({ patients_total: 1, upcoming_appointments: [] })),
            getStaff: vi.fn(() => of([{ id: 5, name: 'Dr Dent' }])),
          },
        },
        { provide: ReportsApi, useValue: reportsApi },
        { provide: FileDownloadService, useValue: fileDownload },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('export termina šalje backend filtere i skida CSV fajl', () => {
    const testComponent = component as unknown as {
      reportForm: { patchValue(value: unknown): void };
    };
    testComponent.reportForm.patchValue({
      date_from: '2026-05-01',
      date_to: '2026-05-13',
      assigned_user_id: '5',
      type: 'checkup',
      status: 'scheduled',
      format: 'csv',
    });

    const button = fixture.debugElement
      .queryAll(By.css('button'))
      .find((item) => item.nativeElement.textContent.includes('Export termina'));

    button?.nativeElement.click();

    expect(reportsApi.exportAppointments).toHaveBeenCalledWith({
      format: 'csv',
      date_from: '2026-05-01',
      date_to: '2026-05-13',
      assigned_user_id: '5',
      type: 'checkup',
      status: 'scheduled',
    });
    expect(fileDownload.download).toHaveBeenCalledWith(expect.any(Blob), 'termini.csv');
  });

  it('export intervencija šalje finansijske filtere i skida CSV fajl', () => {
    const testComponent = component as unknown as {
      reportForm: { patchValue(value: unknown): void };
    };
    testComponent.reportForm.patchValue({
      date_from: '2026-05-01',
      date_to: '2026-05-13',
      performed_by_user_id: '5',
      has_outstanding: '1',
      format: 'csv',
    });

    const button = fixture.debugElement
      .queryAll(By.css('button'))
      .find((item) => item.nativeElement.textContent.includes('Export intervencija'));

    button?.nativeElement.click();

    expect(reportsApi.exportInterventionsFinancial).toHaveBeenCalledWith({
      format: 'csv',
      date_from: '2026-05-01',
      date_to: '2026-05-13',
      performed_by_user_id: '5',
      has_outstanding: '1',
    });
    expect(fileDownload.download).toHaveBeenCalledWith(expect.any(Blob), 'intervencije-finansije.csv');
  });

  it('prikazuje PDF export poruku kada export termina nije dostupan', () => {
    reportsApi.exportAppointments.mockReturnValue(throwError(() => ({ status: 501 })));
    const testComponent = component as unknown as {
      reportForm: { patchValue(value: unknown): void };
    };
    testComponent.reportForm.patchValue({ format: 'pdf' });
    fixture.detectChanges();

    const button = fixture.debugElement
      .queryAll(By.css('button'))
      .find((item) => item.nativeElement.textContent.includes('Export termina'));

    button?.nativeElement.click();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('PDF export trenutno nije dostupan.');
  });
});

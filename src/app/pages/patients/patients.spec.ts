import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FileDownloadService } from '../../core/services/file-download.service';
import { PatientsApi } from '../../core/services/patients-api.service';
import { ReportsApi } from '../../core/services/reports-api.service';
import { Patients } from './patients';

describe('Patients', () => {
  let component: Patients;
  let fixture: ComponentFixture<Patients>;
  let patientsApi: {
    getStaff: ReturnType<typeof vi.fn>;
    getPatients: ReturnType<typeof vi.fn>;
    createPatient: ReturnType<typeof vi.fn>;
    updatePatient: ReturnType<typeof vi.fn>;
    deletePatient: ReturnType<typeof vi.fn>;
  };
  let reportsApi: { exportPatients: ReturnType<typeof vi.fn> };
  let fileDownload: { download: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    patientsApi = {
      getStaff: vi.fn(() => of([])),
      getPatients: vi.fn(() =>
        of([
          {
            id: 1,
            first_name: 'Ana',
            last_name: 'Anić',
            address: 'Adresa 1',
            email: 'ana@test.rs',
            phone: '060',
          },
        ]),
      ),
      createPatient: vi.fn(() => of({ data: { id: 2 } })),
      updatePatient: vi.fn(() => of({ data: { id: 1 } })),
      deletePatient: vi.fn(() => of({ message: 'ok' })),
    };

    reportsApi = {
      exportPatients: vi.fn(() => of(new Blob(['patients']))),
    };

    fileDownload = {
      download: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Patients],
      providers: [
        provideRouter([]),
        { provide: PatientsApi, useValue: patientsApi },
        { provide: ReportsApi, useValue: reportsApi },
        { provide: FileDownloadService, useValue: fileDownload },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Patients);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('učitava i prikazuje pacijente', () => {
    expect(patientsApi.getPatients).toHaveBeenCalledWith('');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Ana Anić');
  });

  it('search poziva load sa unetom vrednošću', async () => {
    vi.useFakeTimers();
    const testComponent = component as unknown as {
      searchControl: { setValue(value: string): void };
    };

    testComponent.searchControl.setValue('ana');
    await vi.advanceTimersByTimeAsync(351);

    expect(patientsApi.getPatients).toHaveBeenCalledWith('ana');
    vi.useRealTimers();
  });

  it('delete traži potvrdu i uklanja pacijenta iz liste', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const deleteButton = fixture.debugElement
      .queryAll(By.css('button'))
      .find((button) => button.nativeElement.textContent.includes('Obri'));

    deleteButton?.nativeElement.click();
    fixture.detectChanges();

    expect(confirmSpy).toHaveBeenCalled();
    expect(patientsApi.deletePatient).toHaveBeenCalledWith(1);
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Ana Anić');

    confirmSpy.mockRestore();
  });

  it('klik na export pacijenata poziva report servis i download helper', () => {
    const exportButton = fixture.debugElement
      .queryAll(By.css('button'))
      .find((button) => button.nativeElement.textContent.includes('Export pacijenata'));

    expect(exportButton).toBeTruthy();

    exportButton?.nativeElement.click();

    expect(reportsApi.exportPatients).toHaveBeenCalledWith({
      format: 'csv',
      search: '',
      status: '',
      primary_dentist_id: '',
      has_open_tasks: '',
      has_debt: '',
    });
    expect(fileDownload.download).toHaveBeenCalledWith(expect.any(Blob), 'pacijenti.csv');
  });

  it('forma pacijenta šalje datum rođenja kao ISO datum', () => {
    const testComponent = component as unknown as {
      patientForm: {
        patchValue(value: unknown): void;
      };
      submit(): void;
    };

    testComponent.patientForm.patchValue({
      first_name: 'Petar',
      last_name: 'Petrović',
      address: 'Adresa 2',
      email: '',
      phone: '',
      date_of_birth: '13.05.2026.',
      primary_dentist_id: '',
    });

    testComponent.submit();

    expect(patientsApi.createPatient).toHaveBeenCalledWith(
      expect.objectContaining({
        date_of_birth: '2026-05-13',
      }),
    );
  });

  it('prikazuje jasnu poruku kada PDF export nije dostupan', () => {
    reportsApi.exportPatients.mockReturnValue(throwError(() => ({ status: 501 })));

    const testComponent = component as unknown as {
      exportFormatControl: { setValue(value: 'pdf'): void };
    };
    testComponent.exportFormatControl.setValue('pdf');
    fixture.detectChanges();

    const exportButton = fixture.debugElement
      .queryAll(By.css('button'))
      .find((button) => button.nativeElement.textContent.includes('Export pacijenata'));

    exportButton?.nativeElement.click();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('PDF export trenutno nije dostupan.');
    expect(fileDownload.download).not.toHaveBeenCalled();
  });

  it('prikazuje jasnu poruku kada Excel export nije dostupan', () => {
    reportsApi.exportPatients.mockReturnValue(throwError(() => ({ status: 501 })));

    const testComponent = component as unknown as {
      exportFormatControl: { setValue(value: 'xlsx'): void };
    };
    testComponent.exportFormatControl.setValue('xlsx');
    fixture.detectChanges();

    const exportButton = fixture.debugElement
      .queryAll(By.css('button'))
      .find((button) => button.nativeElement.textContent.includes('Export pacijenata'));

    exportButton?.nativeElement.click();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Excel export trenutno nije dostupan.');
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminApi } from '../../core/services/admin-api.service';
import { FileDownloadService } from '../../core/services/file-download.service';
import { ReportsApi } from '../../core/services/reports-api.service';
import { AdminCompanies } from './admin-companies';

describe('AdminCompanies', () => {
  let fixture: ComponentFixture<AdminCompanies>;
  let reportsApi: { exportCompanies: ReturnType<typeof vi.fn> };
  let fileDownload: { download: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    reportsApi = {
      exportCompanies: vi.fn(() => of(new Blob(['companies']))),
    };
    fileDownload = {
      download: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AdminCompanies],
      providers: [
        provideRouter([]),
        {
          provide: AdminApi,
          useValue: {
            getAdminCompanies: vi.fn(() =>
              of([
                {
                  id: 1,
                  name: 'Test Ordinacija',
                  email: 'test@dentio.rs',
                },
              ]),
            ),
            deleteAdminCompany: vi.fn(() => of({ data: { deleted: true, id: 1 } })),
          },
        },
        { provide: ReportsApi, useValue: reportsApi },
        { provide: FileDownloadService, useValue: fileDownload },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCompanies);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('CSV export kompanija poziva download helper', () => {
    const exportButton = fixture.debugElement
      .queryAll(By.css('button'))
      .find((button) => button.nativeElement.textContent.includes('Export kompanija'));

    exportButton?.nativeElement.click();

    expect(reportsApi.exportCompanies).toHaveBeenCalledWith({ format: 'csv' });
    expect(fileDownload.download).toHaveBeenCalledWith(expect.any(Blob), 'kompanije.csv');
  });

  it('prikazuje Excel error poruku bez tehničkog teksta', () => {
    reportsApi.exportCompanies.mockReturnValue(throwError(() => ({ status: 501 })));
    const component = fixture.componentInstance as unknown as {
      reportFormatControl: { setValue(value: 'xlsx'): void };
    };
    component.reportFormatControl.setValue('xlsx');
    fixture.detectChanges();

    const exportButton = fixture.debugElement
      .queryAll(By.css('button'))
      .find((button) => button.nativeElement.textContent.includes('Export kompanija'));

    exportButton?.nativeElement.click();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Excel export trenutno nije dostupan.');
  });
});

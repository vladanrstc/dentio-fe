import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AdminCompany, ReportFormat } from '../../core/models/api.models';
import { AdminApi } from '../../core/services/admin-api.service';
import { FileDownloadService } from '../../core/services/file-download.service';
import { ReportsApi } from '../../core/services/reports-api.service';
import { unwrapCollection } from '../../core/utils/http-helpers';
import { reportExportErrorMessage, reportFilename } from '../../core/utils/report-utils';

@Component({
  selector: 'app-admin-companies',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-companies.html',
  styleUrl: './admin-companies.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCompanies {
  private readonly adminApi = inject(AdminApi);
  private readonly reportsApi = inject(ReportsApi);
  private readonly fileDownload = inject(FileDownloadService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly companies = signal<AdminCompany[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly reportError = signal('');
  protected readonly exportingCompanies = signal(false);
  protected readonly reportFormatControl = this.formBuilder.nonNullable.control<ReportFormat>('csv');

  constructor() {
    this.adminApi.getAdminCompanies().subscribe({
      next: (response) => {
        this.companies.set(unwrapCollection(response));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Lista kompanija trenutno nije dostupna.');
        this.loading.set(false);
      },
    });
  }

  protected deleteCompany(company: AdminCompany): void {
    const confirmed = confirm(`Da li ste sigurni da želite da obrišete kompaniju ${company.name}?`);

    if (!confirmed) {
      return;
    }

    this.success.set('');
    this.error.set('');

    this.adminApi.deleteAdminCompany(company.id).subscribe({
      next: () => {
        this.success.set('Kompanija je obrisana.');
        this.companies.update((companies) => companies.filter((item) => item.id !== company.id));
      },
      error: () => {
        this.error.set('Brisanje kompanije nije uspelo.');
      },
    });
  }

  protected exportCompanies(): void {
    this.reportError.set('');
    this.exportingCompanies.set(true);

    const format = this.reportFormatControl.value;

    this.reportsApi.exportCompanies({ format }).subscribe({
      next: (blob) => {
        this.fileDownload.download(blob, reportFilename('kompanije', format));
        this.exportingCompanies.set(false);
      },
      error: () => {
        this.reportError.set(
          reportExportErrorMessage(format, 'Export kompanija trenutno nije uspeo. Pokušajte ponovo.'),
        );
        this.exportingCompanies.set(false);
      },
    });
  }
}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminCompany } from '../../core/models/api.models';
import { AdminApi } from '../../core/services/admin-api.service';
import { unwrapCollection } from '../../core/utils/http-helpers';

@Component({
  selector: 'app-admin-companies',
  imports: [RouterLink],
  templateUrl: './admin-companies.html',
  styleUrl: './admin-companies.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCompanies {
  private readonly adminApi = inject(AdminApi);

  protected readonly companies = signal<AdminCompany[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly success = signal('');

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
}

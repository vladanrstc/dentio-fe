import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AdminCompanyDetail as AdminCompanyDetailModel, Api } from '../../core/services/api';
import { roleLabel, statusLabel } from '../../core/utils/role-label';

@Component({
  selector: 'app-admin-company-detail',
  imports: [RouterLink],
  templateUrl: './admin-company-detail.html',
  styleUrl: './admin-company-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCompanyDetail {
  private readonly api = inject(Api);
  private readonly route = inject(ActivatedRoute);

  protected readonly roleLabel = roleLabel;
  protected readonly statusLabel = statusLabel;

  protected readonly company = signal<AdminCompanyDetailModel | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly success = signal('');

  protected readonly kpiCards = computed(() => {
    const company = this.company();
    const kpi = company?.kpi;

    return [
      { label: 'Osoblje', value: kpi?.staff_count ?? company?.staff_count ?? 0 },
      { label: 'Pacijenti', value: kpi?.patients_count ?? company?.patients_count ?? 0 },
      { label: 'Aktivni termini', value: kpi?.active_appointments_count ?? company?.active_appointments_count ?? 0 },
      { label: 'Intervencije', value: kpi?.interventions_count ?? 0 },
      { label: 'Pozivnice na čekanju', value: kpi?.pending_invites_count ?? company?.pending_invites_count ?? 0 },
    ];
  });

  constructor() {
    this.loadCompany();
  }

  protected formatDate(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    return new Intl.DateTimeFormat('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: value.includes('T') ? '2-digit' : undefined,
      minute: value.includes('T') ? '2-digit' : undefined,
    }).format(new Date(value));
  }

  protected ownerName(createdBy: AdminCompanyDetailModel['created_by']): string {
    if (!createdBy) {
      return '-';
    }

    return typeof createdBy === 'string' ? createdBy : createdBy.name;
  }

  protected canDeleteInvite(invite: { status?: string | null }): boolean {
    return invite.status === 'pending' || invite.status === 'expired';
  }

  protected deleteInvite(invite: { id: number; email: string }): void {
    const confirmed = confirm(`Da li ste sigurni da želite da obrišete pozivnicu za ${invite.email}?`);

    if (!confirmed) {
      return;
    }

    this.success.set('');
    this.error.set('');

    this.api.deleteAdminInvite(invite.id).subscribe({
      next: () => {
        this.success.set('Pozivnica je obrisana.');
        this.company.update((company) =>
          company
            ? {
                ...company,
                latest_invites: company.latest_invites?.filter((item) => item.id !== invite.id) ?? [],
              }
            : company,
        );
      },
      error: () => {
        this.error.set('Brisanje pozivnice nije uspelo.');
      },
    });
  }

  private loadCompany(): void {
    const companyId = Number(this.route.snapshot.paramMap.get('id'));

    if (!companyId) {
      this.error.set('Kompanija nije pronađena.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.api.getAdminCompany(companyId).subscribe({
      next: (company) => {
        this.company.set(company);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Podaci o kompaniji trenutno nisu dostupni.');
        this.loading.set(false);
      },
    });
  }
}

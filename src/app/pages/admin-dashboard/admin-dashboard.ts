import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminDashboardData, AdminInvite, Api } from '../../core/services/api';
import { statusLabel } from '../../core/utils/role-label';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard {
  private readonly api = inject(Api);

  protected readonly dashboard = signal<AdminDashboardData | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly statusLabel = statusLabel;

  protected readonly cards = computed(() => {
    const data = this.dashboard();

    return [
      { label: 'Kompanije', value: data?.companies_total ?? 0 },
      { label: 'Osoblje', value: data?.staff_total ?? 0 },
      { label: 'Pacijenti', value: data?.patients_total ?? 0 },
      { label: 'Aktivni termini', value: data?.active_appointments_count ?? 0 },
      { label: 'Pozivnice na čekanju', value: data?.pending_invites_count ?? 0 },
    ];
  });

  protected readonly activeInvites = computed(() => {
    return (this.dashboard()?.latest_invites ?? []).filter((invite) => {
      if (invite.status !== 'pending' && invite.status !== 'expired') {
        return false;
      }

      if (invite.company_id || invite.company_name) {
        return true;
      }

      return invite.status === 'pending';
    });
  });

  constructor() {
    this.api.getAdminDashboard().subscribe({
      next: (dashboard) => {
        this.dashboard.set(dashboard);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Administratorski pregled trenutno nije dostupan.');
        this.loading.set(false);
      },
    });
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

  protected canDeleteInvite(invite: AdminInvite): boolean {
    return invite.status === 'pending' || invite.status === 'expired';
  }

  protected inviteContext(invite: AdminInvite): string {
    if (invite.company_name) {
      return invite.company_name;
    }

    if (!invite.company_id && invite.status === 'pending') {
      return 'Poziv za novog vlasnika';
    }

    return 'Pozivnica';
  }

  protected deleteInvite(invite: AdminInvite): void {
    const confirmed = confirm(`Da li ste sigurni da želite da obrišete pozivnicu za ${invite.email}?`);

    if (!confirmed) {
      return;
    }

    this.success.set('');
    this.error.set('');

    this.api.deleteAdminInvite(invite.id).subscribe({
      next: () => {
        this.success.set('Pozivnica je obrisana.');
        this.dashboard.update((dashboard) =>
          dashboard
            ? {
                ...dashboard,
                latest_invites: dashboard.latest_invites?.filter((item) => item.id !== invite.id) ?? [],
              }
            : dashboard,
        );
      },
      error: () => {
        this.error.set('Brisanje pozivnice nije uspelo.');
      },
    });
  }
}

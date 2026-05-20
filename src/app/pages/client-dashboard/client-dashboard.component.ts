import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { ActiveItem, Appointment, ClientDashboardData, Intervention, StaffMember } from '../../core/models/api.models';
import { ClientPortalApi } from '../../core/services/client-portal-api.service';
import { AuthStore } from '../../core/state/auth.store';
import { appointmentTitle } from '../../core/utils/appointment-labels';
import { formatDate, formatMoney } from '../../core/utils/formatters';

@Component({
  selector: 'app-client-dashboard',
  templateUrl: './client-dashboard.component.html',
  styleUrl: './client-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientDashboard {
  private readonly clientApi = inject(ClientPortalApi);
  protected readonly authStore = inject(AuthStore);

  protected readonly dashboard = signal<ClientDashboardData | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  constructor() {
    this.loadDashboard();
  }

  protected loadDashboard(): void {
    this.loading.set(true);
    this.error.set('');

    this.clientApi.dashboard().subscribe({
      next: (dashboard) => {
        this.dashboard.set(dashboard);
      },
      error: () => {
        this.error.set('Podaci trenutno nisu dostupni. Pokušajte ponovo za nekoliko trenutaka.');
        this.loading.set(false);
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  protected patientName(): string {
    const patient = this.dashboard()?.patient ?? this.authStore.patient();
    return patient?.full_name ?? (`${patient?.first_name ?? ''} ${patient?.last_name ?? ''}`.trim() || 'Pacijent');
  }

  protected appointments(): Appointment[] {
    return this.dashboard()?.appointments ?? [];
  }

  protected interventions(): Intervention[] {
    return this.dashboard()?.interventions ?? [];
  }

  protected tasks(): ActiveItem[] {
    return this.dashboard()?.tasks ?? [];
  }

  protected financialValue(key: 'total_cost' | 'paid_amount' | 'outstanding_amount'): string {
    return formatMoney(this.dashboard()?.financials?.[key] ?? 0);
  }

  protected formatDate(value: string | null | undefined): string {
    return formatDate(value);
  }

  protected formatMoney(value: number | string | null | undefined): string {
    return formatMoney(value);
  }

  protected appointmentTime(appointment: Appointment): string {
    return formatDate(appointment.starts_at ?? appointment.appointment_at ?? appointment.date);
  }

  protected appointmentTitle(appointment: Appointment): string {
    return appointmentTitle(appointment);
  }

  protected interventionTitle(intervention: Intervention): string {
    return intervention.title || intervention.name || 'Intervencija';
  }

  protected taskTitle(task: ActiveItem): string {
    return task.title || task.description || 'Zadatak';
  }

  protected staffName(member: StaffMember | string | null | undefined): string {
    if (!member) {
      return '-';
    }

    return typeof member === 'string' ? member : member.name;
  }
}

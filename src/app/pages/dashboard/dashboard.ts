import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { Appointment, DashboardData } from '../../core/models/api.models';
import { PatientsApi } from '../../core/services/patients-api.service';
import { formatDate, formatMoney } from '../../core/utils/formatters';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly patientsApi = inject(PatientsApi);

  protected readonly dashboard = signal<DashboardData | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly formatDate = formatDate;

  protected readonly cards = computed(() => {
    const data = this.dashboard();

    return [
      {
        label: 'Ukupno pacijenata',
        value: this.readNumber(data, ['patients_total', 'total_patients', 'patients_count']),
        hint: 'Aktivni kartoni u ordinaciji',
      },
      {
        label: 'Otvoreni zadaci',
        value: this.readNumber(data, ['patients_with_open_tasks', 'open_tasks_patients', 'open_tasks_count']),
        hint: 'Pacijenti sa stavkama za obradu',
      },
      {
        label: 'Termini danas',
        value: this.readNumber(data, ['appointments_today', 'today_appointments']),
        hint: 'Zakazani termini za danas',
      },
      {
        label: 'Podsetnici',
        value: this.readNumber(data, ['reminders_due', 'reminders', 'reminders_count']),
        hint: 'Podsetnici koji čekaju akciju',
      },
      {
        label: 'Dugovanja',
        value: formatMoney(this.readNumber(data, ['outstanding_amount', 'debt_total', 'debts', 'total_debt'])),
        hint: 'Ukupno neizmireno',
      },
    ];
  });

  protected readonly upcomingAppointments = computed(() => {
    return this.dashboard()?.upcoming_appointments ?? [];
  });

  constructor() {
    this.loadDashboard();
  }

  protected appointmentPatient(appointment: Appointment): string {
    if (appointment.patient_name) {
      return appointment.patient_name;
    }

    if (appointment.patient?.name) {
      return appointment.patient.name;
    }

    const fullName = [appointment.patient?.first_name, appointment.patient?.last_name].filter(Boolean).join(' ');
    return fullName || 'Nepoznat pacijent';
  }

  protected appointmentTime(appointment: Appointment): string {
    return this.formatDate(appointment.starts_at ?? appointment.appointment_at ?? appointment.date ?? appointment.time);
  }

  private loadDashboard(): void {
    this.loading.set(true);
    this.error.set('');

    this.patientsApi.getDashboard().subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Podaci za pregled trenutno nisu dostupni.');
        this.loading.set(false);
      },
    });
  }

  private readNumber(data: DashboardData | null, keys: string[]): number {
    if (!data) {
      return 0;
    }

    const record = data as Record<string, unknown>;
    const value = keys.map((key) => record[key]).find((item) => typeof item === 'number' || typeof item === 'string');

    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      return Number(value) || 0;
    }

    return 0;
  }
}

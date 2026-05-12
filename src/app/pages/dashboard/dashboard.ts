import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { Appointment, DashboardData, ReportFormat, StaffMember } from '../../core/models/api.models';
import { FileDownloadService } from '../../core/services/file-download.service';
import { PatientsApi } from '../../core/services/patients-api.service';
import { ReportsApi } from '../../core/services/reports-api.service';
import { formatDate, formatMoney } from '../../core/utils/formatters';
import { unwrapCollection } from '../../core/utils/http-helpers';
import { reportExportErrorMessage, reportFilename } from '../../core/utils/report-utils';

@Component({
  selector: 'app-dashboard',
  imports: [ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly patientsApi = inject(PatientsApi);
  private readonly reportsApi = inject(ReportsApi);
  private readonly fileDownload = inject(FileDownloadService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly dashboard = signal<DashboardData | null>(null);
  protected readonly staff = signal<StaffMember[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly reportError = signal('');
  protected readonly exportingAppointments = signal(false);
  protected readonly exportingInterventions = signal(false);
  protected readonly formatDate = formatDate;
  protected readonly reportForm = this.formBuilder.nonNullable.group({
    date_from: [''],
    date_to: [''],
    user_id: [''],
    type: [''],
    status: [''],
    format: ['csv' as ReportFormat],
  });

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
    this.loadStaff();
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

  protected exportAppointments(): void {
    this.reportError.set('');
    this.exportingAppointments.set(true);

    const value = this.reportForm.getRawValue();

    this.reportsApi
      .exportAppointments({
        format: value.format,
        date_from: value.date_from,
        date_to: value.date_to,
        user_id: value.user_id,
        type: value.type,
      })
      .subscribe({
        next: (blob) => {
          this.fileDownload.download(blob, reportFilename('termini', value.format));
          this.exportingAppointments.set(false);
        },
        error: () => {
          this.reportError.set(
            reportExportErrorMessage(value.format, 'Export termina trenutno nije uspeo. Pokušajte ponovo.'),
          );
          this.exportingAppointments.set(false);
        },
      });
  }

  protected exportInterventionsFinancial(): void {
    this.reportError.set('');
    this.exportingInterventions.set(true);

    const value = this.reportForm.getRawValue();

    this.reportsApi
      .exportInterventionsFinancial({
        format: value.format,
        date_from: value.date_from,
        date_to: value.date_to,
        user_id: value.user_id,
        status: value.status,
      })
      .subscribe({
        next: (blob) => {
          this.fileDownload.download(blob, reportFilename('intervencije-finansije', value.format));
          this.exportingInterventions.set(false);
        },
        error: () => {
          this.reportError.set(
            reportExportErrorMessage(
              value.format,
              'Export intervencija i finansija trenutno nije uspeo. Pokušajte ponovo.',
            ),
          );
          this.exportingInterventions.set(false);
        },
      });
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

  private loadStaff(): void {
    this.patientsApi.getStaff().subscribe({
      next: (response) => {
        this.staff.set(unwrapCollection(response));
      },
      error: () => {
        this.staff.set([]);
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

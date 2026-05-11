import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ActiveItem, Api, Appointment, Intervention, Patient } from '../../core/services/api';

@Component({
  selector: 'app-patient-detail',
  imports: [RouterLink],
  templateUrl: './patient-detail.html',
  styleUrl: './patient-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientDetail {
  private readonly api = inject(Api);
  private readonly route = inject(ActivatedRoute);

  protected readonly patient = signal<Patient | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  protected readonly patientName = computed(() => {
    const patient = this.patient();
    return patient ? this.fullName(patient) : 'Pacijent';
  });

  protected readonly appointments = computed(() => {
    const patient = this.patient();
    return patient?.appointments ?? patient?.upcoming_appointments ?? [];
  });

  protected readonly activeItems = computed(() => {
    const patient = this.patient();
    return patient?.active_items ?? patient?.next_steps ?? [];
  });

  protected readonly interventions = computed(() => {
    return this.patient()?.interventions ?? [];
  });

  constructor() {
    this.loadPatient();
  }

  protected fullName(patient: Patient): string {
    return patient.full_name || `${patient.first_name} ${patient.last_name}`.trim();
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

  protected formatMoney(value: number | string | null | undefined): string {
    const amount = Number(value ?? 0);

    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      maximumFractionDigits: 0,
    }).format(Number.isFinite(amount) ? amount : 0);
  }

  protected appointmentTitle(appointment: Appointment): string {
    return appointment.note || appointment.patient_name || 'Termin';
  }

  protected appointmentTime(appointment: Appointment): string {
    return this.formatDate(appointment.starts_at ?? appointment.appointment_at ?? appointment.date ?? appointment.time);
  }

  protected interventionTitle(intervention: Intervention): string {
    return intervention.title || intervention.name || 'Intervencija';
  }

  protected activeItemTitle(item: ActiveItem): string {
    return item.title || item.description || 'Aktivna stavka';
  }

  protected dentistName(patient: Patient): string {
    if (typeof patient.primary_dentist === 'string') {
      return patient.primary_dentist;
    }

    return patient.primary_dentist?.name ?? '-';
  }

  private loadPatient(): void {
    const patientId = Number(this.route.snapshot.paramMap.get('id'));

    if (!patientId) {
      this.error.set('Pacijent nije pronadjen.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.api.getPatient(patientId).subscribe({
      next: (patient) => {
        this.patient.set(patient);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Podaci o pacijentu trenutno nisu dostupni.');
        this.loading.set(false);
      },
    });
  }
}

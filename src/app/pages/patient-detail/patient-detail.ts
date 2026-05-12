import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import {
  ActiveItem,
  Api,
  Appointment,
  CollectionResponse,
  Intervention,
  Patient,
  StaffMember,
} from '../../core/services/api';
import { statusLabel } from '../../core/utils/role-label';

type FormName = 'appointment' | 'intervention' | 'task' | 'status' | 'completeTask';

@Component({
  selector: 'app-patient-detail',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './patient-detail.html',
  styleUrl: './patient-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientDetail {
  private readonly api = inject(Api);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly patientId = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly patient = signal<Patient | null>(null);
  protected readonly staff = signal<StaffMember[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly formError = signal('');
  protected readonly validationErrors = signal<string[]>([]);
  protected readonly statusLabel = statusLabel;
  protected readonly appointmentSubmitting = signal(false);
  protected readonly interventionSubmitting = signal(false);
  protected readonly taskSubmitting = signal(false);
  protected readonly statusSubmitting = signal(false);
  protected readonly completingTaskId = signal<number | null>(null);

  protected readonly statusOptions = [
    { value: 'active', label: 'Aktivan' },
    { value: 'inactive', label: 'Neaktivan' },
    { value: 'transferred', label: 'Prebačen' },
    { value: 'completed', label: 'Završen' },
  ] as const;

  protected readonly appointmentTypeOptions = [
    { value: 'checkup', label: 'Pregled' },
    { value: 'intervention', label: 'Intervencija' },
    { value: 'control', label: 'Kontrola' },
  ] as const;

  protected readonly appointmentForm = this.formBuilder.group({
    starts_at: ['', [Validators.required]],
    ends_at: ['', [Validators.required]],
    type: ['', [Validators.required]],
    assigned_user_id: ['', [Validators.required]],
    notes: [''],
    reminder_staff_at: [''],
    reminder_patient_at: [''],
  });

  protected readonly interventionForm = this.formBuilder.group({
    title: ['', [Validators.required]],
    description: [''],
    next_step: [''],
    intervention_date: ['', [Validators.required]],
    appointment_id: [''],
    performed_by_user_id: ['', [Validators.required]],
    assigned_to_user_id: ['', [Validators.required]],
    task_due_date: [''],
    total_cost: [0, [Validators.required, Validators.min(0)]],
    paid_amount: [0, [Validators.required, Validators.min(0)]],
    reminder_staff_at: [''],
    reminder_patient_at: [''],
  });

  protected readonly taskForm = this.formBuilder.group({
    description: ['', [Validators.required]],
    due_date: [''],
    assigned_to_user_id: ['', [Validators.required]],
  });

  protected readonly statusForm = this.formBuilder.group({
    manual_status: ['active', [Validators.required]],
    manual_status_reason: [''],
  });

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
    return patient?.active_tasks ?? patient?.active_items ?? patient?.next_steps ?? [];
  });

  protected readonly interventions = computed(() => {
    return this.patient()?.interventions ?? [];
  });

  constructor() {
    this.loadStaff();
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
      hour: value.includes('T') || value.includes(':') ? '2-digit' : undefined,
      minute: value.includes('T') || value.includes(':') ? '2-digit' : undefined,
    }).format(new Date(value.replace(' ', 'T')));
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
    return appointment.type || appointment.notes || appointment.note || appointment.patient_name || 'Termin';
  }

  protected appointmentTime(appointment: Appointment): string {
    return this.formatDate(appointment.starts_at ?? appointment.appointment_at ?? appointment.date ?? appointment.time);
  }

  protected appointmentRange(appointment: Appointment): string {
    const start = this.appointmentTime(appointment);
    const end = appointment.ends_at ? this.formatDate(appointment.ends_at) : '';
    return end ? `${start} - ${end}` : start;
  }

  protected interventionTitle(intervention: Intervention): string {
    return intervention.title || intervention.name || 'Intervencija';
  }

  protected interventionCost(intervention: Intervention): string {
    return this.formatMoney(intervention.total_cost ?? intervention.price);
  }

  protected activeItemTitle(item: ActiveItem): string {
    return item.title || item.description || 'Aktivna stavka';
  }

  protected activeItemDueDate(item: ActiveItem): string {
    return this.formatDate(item.due_date ?? item.due_at);
  }

  protected dentistName(patient: Patient): string {
    if (typeof patient.primary_dentist === 'string') {
      return patient.primary_dentist;
    }

    return patient.primary_dentist?.name ?? '-';
  }

  protected staffName(staff: StaffMember | string | null | undefined): string {
    if (!staff) {
      return '-';
    }

    return typeof staff === 'string' ? staff : staff.name;
  }

  protected fieldInvalid(formName: FormName, fieldName: string): boolean {
    const field =
      formName === 'appointment'
        ? this.appointmentForm.get(fieldName)
        : formName === 'intervention'
          ? this.interventionForm.get(fieldName)
          : formName === 'task'
            ? this.taskForm.get(fieldName)
            : this.statusForm.get(fieldName);

    return !!field && field.invalid && (field.dirty || field.touched);
  }

  protected submitAppointment(): void {
    this.clearMessages();

    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      return;
    }

    const value = this.appointmentForm.getRawValue();
    this.appointmentSubmitting.set(true);

    this.api
      .createAppointment(this.patientId, {
        starts_at: this.toApiDateTime(value.starts_at),
        ends_at: this.toApiDateTime(value.ends_at),
        type: value.type ?? '',
        assigned_user_id: this.toNumberOrNull(value.assigned_user_id),
        notes: this.emptyToNull(value.notes),
        reminder_staff_at: this.toApiDateTimeOrNull(value.reminder_staff_at),
        reminder_patient_at: this.toApiDateTimeOrNull(value.reminder_patient_at),
      })
      .subscribe({
        next: () => {
          this.success.set('Termin je sačuvan.');
          this.appointmentSubmitting.set(false);
          this.appointmentForm.reset();
          this.loadPatient(false);
        },
        error: (error: HttpErrorResponse) => {
          this.handleFormError(error, 'Termin nije sačuvan.');
          this.appointmentSubmitting.set(false);
        },
      });
  }

  protected submitIntervention(): void {
    this.clearMessages();

    if (this.interventionForm.invalid) {
      this.interventionForm.markAllAsTouched();
      return;
    }

    const value = this.interventionForm.getRawValue();
    this.interventionSubmitting.set(true);

    this.api
      .createIntervention(this.patientId, {
        title: value.title ?? '',
        description: this.emptyToNull(value.description),
        next_step: this.emptyToNull(value.next_step),
        intervention_date: value.intervention_date ?? '',
        appointment_id: this.toNumberOrNull(value.appointment_id),
        performed_by_user_id: this.toNumberOrNull(value.performed_by_user_id),
        assigned_to_user_id: this.toNumberOrNull(value.assigned_to_user_id),
        task_due_date: this.emptyToNull(value.task_due_date),
        total_cost: Number(value.total_cost ?? 0),
        paid_amount: Number(value.paid_amount ?? 0),
        reminder_staff_at: this.toApiDateTimeOrNull(value.reminder_staff_at),
        reminder_patient_at: this.toApiDateTimeOrNull(value.reminder_patient_at),
      })
      .subscribe({
        next: () => {
          this.success.set('Intervencija je sačuvana.');
          this.interventionSubmitting.set(false);
          this.interventionForm.reset({ total_cost: 0, paid_amount: 0 });
          this.loadPatient(false);
        },
        error: (error: HttpErrorResponse) => {
          this.handleFormError(error, 'Intervencija nije sačuvana.');
          this.interventionSubmitting.set(false);
        },
      });
  }

  protected submitTask(): void {
    this.clearMessages();

    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const value = this.taskForm.getRawValue();
    this.taskSubmitting.set(true);

    this.api
      .createPatientTask(this.patientId, {
        description: value.description ?? '',
        due_date: this.emptyToNull(value.due_date),
        assigned_to_user_id: this.toNumberOrNull(value.assigned_to_user_id),
      })
      .subscribe({
        next: () => {
          this.success.set('Zadatak je sačuvan.');
          this.taskSubmitting.set(false);
          this.taskForm.reset();
          this.loadPatient(false);
        },
        error: (error: HttpErrorResponse) => {
          this.handleFormError(error, 'Zadatak nije sačuvan.');
          this.taskSubmitting.set(false);
        },
      });
  }

  protected submitStatus(): void {
    this.clearMessages();

    if (this.statusForm.invalid) {
      this.statusForm.markAllAsTouched();
      return;
    }

    const value = this.statusForm.getRawValue();
    this.statusSubmitting.set(true);

    this.api
      .updatePatientStatus(this.patientId, {
        manual_status: value.manual_status as 'active' | 'inactive' | 'transferred' | 'completed',
        manual_status_reason: this.emptyToNull(value.manual_status_reason),
      })
      .subscribe({
        next: () => {
          this.success.set('Stanje pacijenta je sačuvano.');
          this.statusSubmitting.set(false);
          this.loadPatient(false);
        },
        error: (error: HttpErrorResponse) => {
          this.handleFormError(error, 'Stanje nije sačuvano.');
          this.statusSubmitting.set(false);
        },
      });
  }

  protected completeTask(taskId: number): void {
    this.clearMessages();
    this.completingTaskId.set(taskId);

    this.api.completePatientTask(this.patientId, taskId).subscribe({
      next: () => {
        this.success.set('Zadatak je završen.');
        this.completingTaskId.set(null);
        this.loadPatient(false);
      },
      error: (error: HttpErrorResponse) => {
        this.handleFormError(error, 'Zadatak nije završen.');
        this.completingTaskId.set(null);
      },
    });
  }

  private loadPatient(showLoading = true): void {
    if (!this.patientId) {
      this.error.set('Pacijent nije pronađen.');
      this.loading.set(false);
      return;
    }

    if (showLoading) {
      this.loading.set(true);
    }

    this.error.set('');

    this.api.getPatient(this.patientId).subscribe({
      next: (patient) => {
        this.patient.set(patient);
        this.statusForm.patchValue({
          manual_status: patient.manual_status ?? 'active',
          manual_status_reason: patient.manual_status_reason ?? '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Podaci o pacijentu trenutno nisu dostupni.');
        this.loading.set(false);
      },
    });
  }

  private loadStaff(): void {
    this.api.getStaff().subscribe({
      next: (response) => {
        this.staff.set(this.unwrapCollection(response));
      },
      error: () => {
        this.staff.set([]);
      },
    });
  }

  private clearMessages(): void {
    this.success.set('');
    this.formError.set('');
    this.validationErrors.set([]);
  }

  private handleFormError(error: HttpErrorResponse, fallback: string): void {
    const response = error.error as { message?: string; errors?: Record<string, string[]> } | null;
    this.formError.set(response?.message || fallback);
    this.validationErrors.set(response?.errors ? Object.values(response.errors).flat() : []);
  }

  private emptyToNull(value: string | null | undefined): string | null {
    const trimmedValue = value?.trim() ?? '';
    return trimmedValue || null;
  }

  private toApiDateTime(value: string | null | undefined): string {
    return (value ?? '').replace('T', ' ');
  }

  private toApiDateTimeOrNull(value: string | null | undefined): string | null {
    const convertedValue = this.toApiDateTime(value);
    return convertedValue || null;
  }

  private toNumberOrNull(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    return Number(value);
  }

  private unwrapCollection<T>(response: CollectionResponse<T>): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }

    return response.data.data;
  }
}

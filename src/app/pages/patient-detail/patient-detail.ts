import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import {
  ActiveItem,
  Appointment,
  Intervention,
  Patient,
  StaffMember,
} from '../../core/models/api.models';
import { PatientsApi } from '../../core/services/patients-api.service';
import { formatDate, formatMoney, toApiDate, toApiDateTime as formatToApiDateTime } from '../../core/utils/formatters';
import { extractValidationErrors, unwrapCollection } from '../../core/utils/http-helpers';
import { statusLabel } from '../../core/utils/role-label';
import { SerbianDatePicker } from '../../shared/components/serbian-date-picker/serbian-date-picker';

type FormName = 'appointment' | 'intervention' | 'task' | 'status' | 'completeTask';
type PatientDetailModal = 'appointment' | 'intervention' | 'task' | 'status';
const APPOINTMENT_LABEL_MAX_LENGTH = 60;

@Component({
  selector: 'app-patient-detail',
  imports: [RouterLink, ReactiveFormsModule, SerbianDatePicker],
  templateUrl: './patient-detail.html',
  styleUrl: './patient-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientDetail {
  private readonly patientsApi = inject(PatientsApi);
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
  protected readonly formatDate = formatDate;
  protected readonly formatMoney = formatMoney;
  protected readonly appointmentSubmitting = signal(false);
  protected readonly interventionSubmitting = signal(false);
  protected readonly taskSubmitting = signal(false);
  protected readonly statusSubmitting = signal(false);
  protected readonly completingTaskId = signal<number | null>(null);
  protected readonly activeModal = signal<PatientDetailModal | null>(null);
  protected readonly selectedAppointment = signal<Appointment | null>(null);

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
    return this.patient()?.appointments ?? [];
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

  protected appointmentTitle(appointment: Appointment): string {
    return this.truncateLabel(this.appointmentFullTitle(appointment), APPOINTMENT_LABEL_MAX_LENGTH);
  }

  protected appointmentFullTitle(appointment: Appointment): string {
    const typeLabel = this.appointmentTypeOptions.find((type) => type.value === appointment.type)?.label;
    return typeLabel || appointment.type || appointment.notes || appointment.note || appointment.patient_name || 'Termin';
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

  protected appointmentStaff(appointment: Appointment): StaffMember | string | null | undefined {
    return appointment.assigned_to ?? appointment.assigned_user;
  }

  protected activeItemStaff(item: ActiveItem): StaffMember | string | null | undefined {
    return item.assigned_to ?? item.assigned_to_user;
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

  protected openModal(modal: PatientDetailModal): void {
    this.clearMessages();

    if (modal === 'intervention') {
      this.openInterventionModal();
      return;
    }

    this.activeModal.set(modal);
  }

  protected closeModal(): void {
    if (
      this.appointmentSubmitting() ||
      this.interventionSubmitting() ||
      this.taskSubmitting() ||
      this.statusSubmitting()
    ) {
      return;
    }

    this.resetModalForms();
    this.activeModal.set(null);
  }

  protected openAppointmentDetails(appointment: Appointment): void {
    this.selectedAppointment.set(appointment);
  }

  protected closeAppointmentDetails(): void {
    this.selectedAppointment.set(null);
  }

  protected submitAppointment(): void {
    this.clearMessages();

    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      return;
    }

    const value = this.appointmentForm.getRawValue();
    this.appointmentSubmitting.set(true);

    this.patientsApi
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
          this.activeModal.set(null);
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
    const appointmentId = this.toNumberOrNull(value.appointment_id);

    if (appointmentId && !this.appointments().some((appointment) => appointment.id === appointmentId)) {
      this.formError.set('Izabrani termin više nije dostupan. Otvorite formu ponovo i izaberite drugi termin.');
      return;
    }

    this.interventionSubmitting.set(true);

    this.patientsApi
      .createIntervention(this.patientId, {
        title: value.title ?? '',
        description: this.emptyToNull(value.description),
        next_step: this.emptyToNull(value.next_step),
        intervention_date: toApiDate(value.intervention_date),
        appointment_id: appointmentId,
        performed_by_user_id: this.toNumberOrNull(value.performed_by_user_id),
        assigned_to_user_id: this.toNumberOrNull(value.assigned_to_user_id),
        task_due_date: this.emptyToNull(toApiDate(value.task_due_date)),
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
          this.activeModal.set(null);
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

    this.patientsApi
      .createPatientTask(this.patientId, {
        description: value.description ?? '',
        due_date: this.emptyToNull(toApiDate(value.due_date)),
        assigned_to_user_id: this.toNumberOrNull(value.assigned_to_user_id),
      })
      .subscribe({
        next: () => {
          this.success.set('Zadatak je sačuvan.');
          this.taskSubmitting.set(false);
          this.taskForm.reset();
          this.activeModal.set(null);
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

    this.patientsApi
      .updatePatientStatus(this.patientId, {
        manual_status: value.manual_status as 'active' | 'inactive' | 'transferred' | 'completed',
        manual_status_reason: this.emptyToNull(value.manual_status_reason),
      })
      .subscribe({
        next: () => {
          this.success.set('Stanje pacijenta je sačuvano.');
          this.statusSubmitting.set(false);
          this.activeModal.set(null);
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

    this.patientsApi.completePatientTask(this.patientId, taskId).subscribe({
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

    this.patientsApi.getPatient(this.patientId).subscribe({
      next: (patient) => {
        this.setPatient(patient);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Podaci o pacijentu trenutno nisu dostupni.');
        this.loading.set(false);
      },
    });
  }

  private openInterventionModal(): void {
    this.interventionForm.patchValue({ appointment_id: '' });

    this.patientsApi.getPatient(this.patientId).subscribe({
      next: (patient) => {
        this.setPatient(patient);
        this.activeModal.set('intervention');
      },
      error: () => {
        this.formError.set('Termini trenutno nisu dostupni.');
        this.activeModal.set('intervention');
      },
    });
  }

  private setPatient(patient: Patient): void {
    this.patient.set(patient);
    this.statusForm.patchValue({
      manual_status: patient.manual_status ?? 'active',
      manual_status_reason: patient.manual_status_reason ?? '',
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

  private clearMessages(): void {
    this.success.set('');
    this.formError.set('');
    this.validationErrors.set([]);
  }

  private resetModalForms(): void {
    this.appointmentForm.reset();
    this.interventionForm.reset({ total_cost: 0, paid_amount: 0 });
    this.taskForm.reset();

    const patient = this.patient();
    this.statusForm.reset({
      manual_status: patient?.manual_status ?? 'active',
      manual_status_reason: patient?.manual_status_reason ?? '',
    });
    this.validationErrors.set([]);
  }

  private handleFormError(error: HttpErrorResponse, fallback: string): void {
    const validationErrors = extractValidationErrors(error);
    this.formError.set(validationErrors[0] || fallback);
    this.validationErrors.set(validationErrors);
  }

  private emptyToNull(value: string | null | undefined): string | null {
    const trimmedValue = value?.trim() ?? '';
    return trimmedValue || null;
  }

  private toApiDateTime(value: string | null | undefined): string {
    return formatToApiDateTime(value);
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

  private truncateLabel(value: string, maxLength: number): string {
    return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
  }
}

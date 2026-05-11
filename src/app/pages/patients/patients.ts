import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { Api, CollectionResponse, Patient, PatientPayload, StaffMember } from '../../core/services/api';

@Component({
  selector: 'app-patients',
  imports: [ReactiveFormsModule],
  templateUrl: './patients.html',
  styleUrl: './patients.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Patients {
  private readonly api = inject(Api);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly patients = signal<Patient[]>([]);
  protected readonly staff = signal<StaffMember[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly editingPatient = signal<Patient | null>(null);

  protected readonly searchControl = this.formBuilder.nonNullable.control('');
  protected readonly patientForm = this.formBuilder.group({
    first_name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    address: ['', [Validators.required]],
    email: [''],
    phone: [''],
    date_of_birth: [''],
    primary_dentist_id: [''],
  });

  constructor() {
    this.loadStaff();
    this.loadPatients();

    this.searchControl.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((search) => {
        this.loadPatients(search);
      });
  }

  protected submit(): void {
    this.success.set('');
    this.error.set('');

    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    const editingPatient = this.editingPatient();
    const request = editingPatient
      ? this.api.updatePatient(editingPatient.id, payload)
      : this.api.createPatient(payload);

    this.saving.set(true);

    request.subscribe({
      next: () => {
        this.success.set(editingPatient ? 'Pacijent je izmenjen.' : 'Pacijent je dodat.');
        this.saving.set(false);
        this.cancelEdit();
        this.loadPatients(this.searchControl.value);
      },
      error: () => {
        this.error.set('Cuvanje pacijenta nije uspelo. Proverite podatke i pokusajte ponovo.');
        this.saving.set(false);
      },
    });
  }

  protected startEdit(patient: Patient): void {
    this.editingPatient.set(patient);
    this.success.set('');
    this.error.set('');

    this.patientForm.patchValue({
      first_name: patient.first_name ?? '',
      last_name: patient.last_name ?? '',
      email: patient.email ?? '',
      address: patient.address ?? '',
      phone: patient.phone ?? '',
      date_of_birth: patient.date_of_birth ?? '',
      primary_dentist_id: this.resolveDentistId(patient),
    });
  }

  protected cancelEdit(): void {
    this.editingPatient.set(null);
    this.patientForm.reset({
      first_name: '',
      last_name: '',
      address: '',
      email: '',
      phone: '',
      date_of_birth: '',
      primary_dentist_id: '',
    });
  }

  protected dentistName(patient: Patient): string {
    if (typeof patient.primary_dentist === 'string') {
      return patient.primary_dentist;
    }

    if (patient.primary_dentist?.name) {
      return patient.primary_dentist.name;
    }

    const dentist = this.staff().find((item) => item.id === patient.primary_dentist_id);
    return dentist?.name ?? '-';
  }

  protected fieldInvalid(fieldName: keyof typeof this.patientForm.controls): boolean {
    const field = this.patientForm.controls[fieldName];
    return field.invalid && (field.dirty || field.touched);
  }

  private loadPatients(search = ''): void {
    this.loading.set(true);
    this.error.set('');

    this.api.getPatients(search).subscribe({
      next: (response) => {
        this.patients.set(this.unwrapCollection(response));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Lista pacijenata trenutno nije dostupna.');
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

  private buildPayload(): PatientPayload {
    const value = this.patientForm.getRawValue();

    return {
      first_name: (value.first_name ?? '').trim(),
      last_name: (value.last_name ?? '').trim(),
      address: (value.address ?? '').trim(),
      email: this.emptyToNull(value.email),
      phone: this.emptyToNull(value.phone),
      date_of_birth: this.emptyToNull(value.date_of_birth),
      primary_dentist_id: value.primary_dentist_id ? Number(value.primary_dentist_id) : null,
    };
  }

  private emptyToNull(value: string | null | undefined): string | null {
    const trimmedValue = value?.trim() ?? '';
    return trimmedValue || null;
  }

  private resolveDentistId(patient: Patient): string {
    if (patient.primary_dentist_id) {
      return String(patient.primary_dentist_id);
    }

    if (typeof patient.primary_dentist === 'string') {
      const dentist = this.staff().find((item) => item.name === patient.primary_dentist);
      return dentist ? String(dentist.id) : '';
    }

    if (patient.primary_dentist?.id) {
      return String(patient.primary_dentist.id);
    }

    return '';
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

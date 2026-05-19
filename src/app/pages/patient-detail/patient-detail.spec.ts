import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Patient, StaffMember } from '../../core/models/api.models';
import { PatientsApi } from '../../core/services/patients-api.service';
import { PatientDetail } from './patient-detail';

describe('PatientDetail', () => {
  let fixture: ComponentFixture<PatientDetail>;
  let component: PatientDetail;
  let patientsApi: {
    getPatient: ReturnType<typeof vi.fn>;
    getStaff: ReturnType<typeof vi.fn>;
    createAppointment: ReturnType<typeof vi.fn>;
    createIntervention: ReturnType<typeof vi.fn>;
    createPatientTask: ReturnType<typeof vi.fn>;
    updatePatientStatus: ReturnType<typeof vi.fn>;
    completePatientTask: ReturnType<typeof vi.fn>;
  };

  const patient: Patient = {
    id: 1,
    first_name: 'Ana',
    last_name: 'Anić',
    address: 'Adresa 1',
    email: 'ana@test.rs',
    phone: '060',
    manual_status: 'active',
    manual_status_reason: '',
    financials: {
      total_cost: 1000,
      paid_amount: 400,
      outstanding_amount: 600,
    },
    appointments: [
      {
        id: 21,
        type: 'checkup',
        starts_at: '2026-05-15 09:00',
        ends_at: '2026-05-15 09:30',
        notes: 'Kontrola posle intervencije',
        assigned_to: {
          id: 7,
          name: 'Dr Petar Petrović',
        },
      },
    ],
    interventions: [],
    active_tasks: [
      {
        id: 31,
        description: 'Pozvati pacijenta',
        due_date: '2026-05-20',
        status: 'open',
        assigned_to: {
          id: 7,
          name: 'Dr Petar Petrović',
        },
      },
    ],
  };

  const staff: StaffMember[] = [
    {
      id: 7,
      name: 'Dr Petar Petrović',
      email: 'petar@test.rs',
    },
  ];

  beforeEach(async () => {
    patientsApi = {
      getPatient: vi.fn(() => of(patient)),
      getStaff: vi.fn(() => of(staff)),
      createAppointment: vi.fn(() => of({ data: { id: 11 } })),
      createIntervention: vi.fn(() => of({ data: { id: 12 } })),
      createPatientTask: vi.fn(() => of({ data: { id: 13 } })),
      updatePatientStatus: vi.fn(() => of({ data: { id: 1 } })),
      completePatientTask: vi.fn(() => of({ data: { completed: true } })),
    };

    await TestBed.configureTestingModule({
      imports: [PatientDetail],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '1',
              },
            },
          },
        },
        { provide: PatientsApi, useValue: patientsApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('ne prikazuje forme dok modal nije otvoren', () => {
    expect(fixture.debugElement.query(By.css('.modal-card'))).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Sačuvaj termin');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Sačuvaj intervenciju');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Sačuvaj zadatak');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Sačuvaj stanje');
  });

  it('otvara svaki modal preko akcijskog dugmeta', () => {
    const cases = [
      ['Termini pacijenta', 'Novi termin', 'Sačuvaj termin'],
      ['Intervencije pacijenta', 'Nova intervencija', 'Sačuvaj intervenciju'],
      ['Aktivni zadaci', 'Novi zadatak', 'Sačuvaj zadatak'],
      ['Stanje pacijenta', 'Promena stanja', 'Sačuvaj stanje'],
    ];

    for (const [cardTitle, buttonText, submitText] of cases) {
      clickCardButton(cardTitle, buttonText);
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('.modal-card'))).toBeTruthy();
      expect((fixture.nativeElement as HTMLElement).textContent).toContain(submitText);

      closeModal();
    }
  });

  it('Odustani zatvara modal bez slanja forme', () => {
    clickButton('Novi zadatak');
    fixture.detectChanges();

    clickButton('Odustani');
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.modal-card'))).toBeNull();
    expect(patientsApi.createPatientTask).not.toHaveBeenCalled();
  });

  it('termin ostaje klikabilan i otvara detalje', () => {
    const appointmentButton = fixture.debugElement.query(By.css('.appointment-row'));

    expect(appointmentButton).toBeTruthy();

    appointmentButton.nativeElement.click();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Detalji termina');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Pregled');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Dr Petar Petrović');
  });

  it('skrati appointment label kada je fallback duga napomena', () => {
    const testComponent = component as unknown as {
      appointmentTitle(appointment: { id: number; notes: string }): string;
    };
    const longNotes = 'Kontrola posle intervencije sa veoma dugom napomenom koja ne treba da razvuce label u listi';

    const label = testComponent.appointmentTitle({
      id: 99,
      notes: longNotes,
    });

    expect(label.length).toBeLessThanOrEqual(60);
    expect(label).toContain('…');
  });

  it('zadatak prikazuje zaduženog člana osoblja', () => {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Zadužen: Dr Petar Petrović');
  });

  it('greška pri čuvanju ostaje prikazana u modalu', () => {
    patientsApi.createIntervention.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: {
              message: 'Intervencija nije sačuvana.',
              errors: {
                title: ['Naziv intervencije je obavezan.'],
              },
            },
          }),
      ),
    );

    clickButton('Nova intervencija');
    fixture.detectChanges();

    const testComponent = component as unknown as {
      interventionForm: {
        patchValue(value: unknown): void;
      };
      submitIntervention(): void;
    };

    testComponent.interventionForm.patchValue({
      title: 'Plomba',
      intervention_date: '15.05.2026.',
      performed_by_user_id: '7',
      assigned_to_user_id: '7',
      total_cost: 3000,
      paid_amount: 0,
    });
    testComponent.submitIntervention();
    fixture.detectChanges();

    const modal = fixture.debugElement.query(By.css('.modal-card'));

    expect(modal).toBeTruthy();
    expect(modal.nativeElement.textContent).toContain('Naziv intervencije je obavezan.');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sačuvaj intervenciju');
  });

  it('osvežava termine pre otvaranja intervencija modala', () => {
    patientsApi.getPatient.mockReturnValueOnce(
      of({
        ...patient,
        appointments: [],
      }),
    );

    clickButton('Nova intervencija');
    fixture.detectChanges();

    const modal = fixture.debugElement.query(By.css('.modal-card'));

    expect(patientsApi.getPatient).toHaveBeenCalledTimes(2);
    expect(modal).toBeTruthy();
    expect(modal.nativeElement.textContent).toContain('Bez povezanog termina');
    expect(modal.nativeElement.textContent).not.toContain('Pregled -');
  });

  it('intervencija sa povezanim terminom šalje appointment_id iz sveže liste', () => {
    clickButton('Nova intervencija');
    fixture.detectChanges();

    const testComponent = component as unknown as {
      interventionForm: {
        patchValue(value: unknown): void;
      };
      submitIntervention(): void;
    };

    testComponent.interventionForm.patchValue({
      title: 'Plomba',
      intervention_date: '15.05.2026.',
      appointment_id: '21',
      performed_by_user_id: '7',
      assigned_to_user_id: '7',
      total_cost: 3000,
      paid_amount: 0,
    });
    testComponent.submitIntervention();
    fixture.detectChanges();

    expect(patientsApi.createIntervention).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        appointment_id: 21,
        assigned_to_user_id: 7,
      }),
    );
  });

  it('uspešno čuvanje termina zatvara modal i osvežava podatke', () => {
    clickButton('Novi termin');
    fixture.detectChanges();

    const testComponent = component as unknown as {
      appointmentForm: {
        patchValue(value: unknown): void;
      };
      submitAppointment(): void;
    };

    testComponent.appointmentForm.patchValue({
      starts_at: '15.05.2026. 09:00',
      ends_at: '15.05.2026. 09:30',
      type: 'checkup',
      assigned_user_id: '7',
      notes: '',
      reminder_staff_at: '',
      reminder_patient_at: '',
    });
    testComponent.submitAppointment();
    fixture.detectChanges();

    expect(patientsApi.createAppointment).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        starts_at: '2026-05-15 09:00',
        ends_at: '2026-05-15 09:30',
        type: 'checkup',
        assigned_user_id: 7,
      }),
    );
    expect(fixture.debugElement.query(By.css('.modal-card'))).toBeNull();
    expect(patientsApi.getPatient).toHaveBeenCalledTimes(2);
  });

  function clickButton(text: string): void {
    const button = fixture.debugElement
      .queryAll(By.css('button'))
      .find((item) => item.nativeElement.textContent.includes(text));

    expect(button).toBeTruthy();
    button?.nativeElement.click();
  }

  function clickCardButton(cardTitle: string, buttonText: string): void {
    const card = fixture.debugElement
      .queryAll(By.css('article.card'))
      .find((item) => item.nativeElement.textContent.includes(cardTitle));

    expect(card).toBeTruthy();

    const button = card
      ?.queryAll(By.css('button'))
      .find((item) => item.nativeElement.textContent.includes(buttonText));

    expect(button).toBeTruthy();
    button?.nativeElement.click();
  }

  function closeModal(): void {
    (component as unknown as { closeModal(): void }).closeModal();
    fixture.detectChanges();
  }
});

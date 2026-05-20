import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ClientPortalApi } from '../../core/services/client-portal-api.service';
import { AuthStore } from '../../core/state/auth.store';
import { ClientDashboard } from './client-dashboard.component';

describe('ClientDashboard', () => {
  let fixture: ComponentFixture<ClientDashboard>;
  let clientApi: { dashboard: ReturnType<typeof vi.fn> };
  let authStore: { patient: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    clientApi = {
      dashboard: vi.fn(() =>
        of({
          patient: {
            id: 7,
            first_name: 'Petar',
            last_name: 'Petrovic',
            full_name: 'Petar Petrovic',
            email: 'pacijent@test.rs',
            phone: '060',
            address: 'Adresa 1',
          },
          appointments: [{ id: 10, type: 'checkup', starts_at: '2026-05-20 09:00' }],
          interventions: [{ id: 20, title: 'Plomba', intervention_date: '2026-05-18', total_cost: 5000 }],
          tasks: [{ id: 30, description: 'Doneti snimak', due_date: '2026-05-22' }],
          financials: { total_cost: 5000, paid_amount: 2000, outstanding_amount: 3000 },
        }),
      ),
    };
    authStore = {
      patient: vi.fn(() => null),
    };

    await TestBed.configureTestingModule({
      imports: [ClientDashboard],
      providers: [
        { provide: ClientPortalApi, useValue: clientApi },
        { provide: AuthStore, useValue: authStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientDashboard);
    fixture.detectChanges();
  });

  it('prikazuje pacijent dashboard podatke', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Petar Petrovic');
    expect(text).toContain('Pregled');
    expect(text).not.toContain('checkup');
    expect(text).toContain('Plomba');
    expect(text).toContain('Doneti snimak');
    expect(text).toContain('3.000');
  });

  it('za termin koristi naziv ili napomenu pre prevedenog type fallback-a', async () => {
    clientApi.dashboard.mockReturnValue(
      of({
        patient: {
          id: 7,
          first_name: 'Petar',
          last_name: 'Petrovic',
          full_name: 'Petar Petrovic',
        },
        appointments: [{ id: 10, type: 'checkup', starts_at: '2026-05-20 09:00', notes: 'Redovna kontrola' }],
        interventions: [],
        tasks: [],
        financials: null,
      }),
    );

    fixture = TestBed.createComponent(ClientDashboard);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Redovna kontrola');
    expect(text).not.toContain('checkup');
  });

  it('prikazuje error stanje kada dashboard ne moze da se ucita', async () => {
    clientApi.dashboard.mockReturnValue(throwError(() => ({ status: 500 })));
    fixture = TestBed.createComponent(ClientDashboard);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Podaci trenutno nisu dostupni.');
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import { ClientPortalApi } from './client-portal-api.service';

describe('ClientPortalApi', () => {
  let service: ClientPortalApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ClientPortalApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('ucitava client me podatke', () => {
    service.me().subscribe((patient) => {
      expect(patient.id).toBe(7);
      expect(patient.email).toBe('pacijent@test.rs');
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/client/me`);
    expect(request.request.method).toBe('GET');

    request.flush({
      data: {
        id: 7,
        first_name: 'Petar',
        last_name: 'Petrovic',
        email: 'pacijent@test.rs',
      },
    });
  });

  it('ucitava client dashboard i unwrap-uje data response', () => {
    service.dashboard().subscribe((dashboard) => {
      expect(dashboard.patient.id).toBe(7);
      expect(dashboard.appointments).toHaveLength(1);
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/client/dashboard`);
    expect(request.request.method).toBe('GET');

    request.flush({
      data: {
        patient: { id: 7, first_name: 'Petar', last_name: 'Petrovic' },
        appointments: [{ id: 10, type: 'Kontrola' }],
        interventions: [],
        tasks: [],
        financials: null,
      },
    });
  });

  it('proverava client invite token', () => {
    service.showClientInvite('token-123').subscribe((invite) => {
      expect(invite.id).toBe(3);
      expect(invite.valid).toBe(true);
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/client/invites/token-123`);
    expect(request.request.method).toBe('GET');

    request.flush({
      data: {
        id: 3,
        email: 'pacijent@test.rs',
        valid: true,
        expired: false,
        accepted: false,
      },
    });
  });

  it('prihvata client invite i salje password confirmation', () => {
    service.acceptClientInvite('token-123', 'Password123!', 'Password123!').subscribe((response) => {
      expect(response.data.patient.id).toBe(7);
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/client/invites/token-123/accept`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      password: 'Password123!',
      password_confirmation: 'Password123!',
    });

    request.flush({
      data: {
        patient: {
          id: 7,
          first_name: 'Petar',
          last_name: 'Petrovic',
          email: 'pacijent@test.rs',
        },
      },
    });
  });
});

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import { PatientPortalInviteApi } from './patient-portal-invite-api.service';

describe('PatientPortalInviteApi', () => {
  let service: PatientPortalInviteApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(PatientPortalInviteApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('salje company pozivnicu za portal pacijenta', () => {
    service.sendPatientPortalInvite('pacijent@test.rs').subscribe((invite) => {
      expect(invite.email).toBe('pacijent@test.rs');
      expect(invite.valid).toBe(true);
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/company/patients/portal-invites`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'pacijent@test.rs' });

    request.flush({
      data: {
        id: 3,
        email: 'pacijent@test.rs',
        valid: true,
        expired: false,
        accepted: false,
        revoked: false,
      },
    });
  });
});

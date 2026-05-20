import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import { ClientPatient } from '../models/api.models';
import { ClientAuthStore } from './client-auth.store';

const patient: ClientPatient = {
  id: 7,
  first_name: 'Petar',
  last_name: 'Petrovic',
  full_name: 'Petar Petrovic',
  email: 'pacijent@test.rs',
};

describe('ClientAuthStore', () => {
  let store: InstanceType<typeof ClientAuthStore>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => {
    httpMock?.verify();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('inicijalizuje client auth state iz localStorage-a', () => {
    localStorage.setItem('dentio_client_token', 'stored-client-token');
    localStorage.setItem('dentio_client_patient', JSON.stringify(patient));

    initStore();

    expect(store.token()).toBe('stored-client-token');
    expect(store.patient()).toEqual(patient);
    expect(store.isAuthenticated()).toBe(true);
    expect(store.hasPatient()).toBe(true);
    expect(store.patientName()).toBe('Petar Petrovic');
  });

  it('setAuth upisuje state i clearAuth cisti client sesiju', () => {
    initStore();

    store.setAuth('client-token', patient);

    expect(store.token()).toBe('client-token');
    expect(localStorage.getItem('dentio_client_token')).toBe('client-token');
    expect(store.patient()).toEqual(patient);

    store.clearAuth();

    expect(store.token()).toBeNull();
    expect(store.patient()).toBeNull();
    expect(localStorage.getItem('dentio_client_token')).toBeNull();
    expect(localStorage.getItem('dentio_client_patient')).toBeNull();
  });

  it('checkAuth preko /client/me ucitava trenutnog pacijenta', () => {
    localStorage.setItem('dentio_client_token', 'stored-client-token');
    initStore();

    let currentPatient: ClientPatient | null = null;
    store.checkAuth().subscribe((response: ClientPatient | null) => {
      currentPatient = response;
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/client/me`);
    expect(request.request.method).toBe('GET');
    request.flush({ data: patient });

    expect(currentPatient).toEqual(patient);
    expect(store.patient()).toEqual(patient);
    expect(localStorage.getItem('dentio_client_patient')).toBe(JSON.stringify(patient));
  });

  it('checkAuth failure cisti client token i pacijenta', () => {
    localStorage.setItem('dentio_client_token', 'stored-client-token');
    localStorage.setItem('dentio_client_patient', JSON.stringify(patient));
    initStore();

    store.checkAuth().subscribe();

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/client/me`);
    request.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(store.token()).toBeNull();
    expect(store.patient()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('dentio_client_token')).toBeNull();
  });

  function initStore(): void {
    store = TestBed.inject(ClientAuthStore);
    httpMock = TestBed.inject(HttpTestingController);
  }
});

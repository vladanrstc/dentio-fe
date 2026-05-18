import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import { AuthUser } from '../models/api.models';
import { AuthStore } from './auth.store';

const user: AuthUser = {
  id: 1,
  company_id: 10,
  name: 'Dejan Dent',
  email: 'owner@test.rs',
  role: 'company_admin',
};

describe('AuthStore', () => {
  let store: AuthStore;
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

  it('inicijalizuje auth state iz localStorage-a', () => {
    localStorage.setItem('dentio_token', 'stored-token');
    localStorage.setItem('dentio_user', JSON.stringify(user));

    initStore();

    expect(store.token()).toBe('stored-token');
    expect(store.user()).toEqual(user);
    expect(store.isAuthenticated()).toBe(true);
    expect(store.role()).toBe('company_admin');
    expect(store.isCompanyAdmin()).toBe(true);
    expect(store.isCompanyUser()).toBe(true);
  });

  it('setAuth upisuje signal state i localStorage, a logout cisti sesiju', () => {
    initStore();

    store.setAuth('new-token', user);

    expect(store.token()).toBe('new-token');
    expect(store.user()).toEqual(user);
    expect(localStorage.getItem('dentio_token')).toBe('new-token');

    store.logout().subscribe();

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/logout`);
    expect(request.request.method).toBe('POST');
    request.flush({});

    expect(store.token()).toBeNull();
    expect(store.user()).toBeNull();
    expect(localStorage.getItem('dentio_token')).toBeNull();
    expect(localStorage.getItem('dentio_user')).toBeNull();
  });

  it('checkAuth preko /me ucitava trenutnog korisnika', () => {
    localStorage.setItem('dentio_token', 'stored-token');
    initStore();

    let currentUser: AuthUser | null = null;
    store.checkAuth().subscribe((response) => {
      currentUser = response;
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/me`);
    expect(request.request.method).toBe('GET');
    request.flush({ data: user });

    expect(currentUser).toEqual(user);
    expect(store.user()).toEqual(user);
    expect(localStorage.getItem('dentio_user')).toBe(JSON.stringify(user));
  });

  it('checkAuth podrzava /me response koji vraca user property', () => {
    localStorage.setItem('dentio_token', 'stored-token');
    initStore();

    store.checkAuth().subscribe();

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/me`);
    request.flush({ user });

    expect(store.user()).toEqual(user);
    expect(store.isCompanyUser()).toBe(true);
  });

  it('checkAuth failure cisti token i user-a', () => {
    localStorage.setItem('dentio_token', 'stored-token');
    localStorage.setItem('dentio_user', JSON.stringify(user));
    initStore();

    store.checkAuth().subscribe();

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/me`);
    request.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(store.token()).toBeNull();
    expect(store.user()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('dentio_token')).toBeNull();
  });

  function initStore(): void {
    store = TestBed.inject(AuthStore);
    httpMock = TestBed.inject(HttpTestingController);
  }
});

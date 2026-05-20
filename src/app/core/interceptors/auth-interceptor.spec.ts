import { HttpErrorResponse, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthStore } from '../state/auth.store';
import { authInterceptor } from './auth-interceptor';

describe('authInterceptor', () => {
  let router: { navigate: ReturnType<typeof vi.fn> };
  let authStore: { token: ReturnType<typeof vi.fn>; clearAuth: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    router = { navigate: vi.fn() };
    authStore = {
      token: vi.fn(() => null),
      clearAuth: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthStore, useValue: authStore },
      ],
    });
  });

  it('dodaje Authorization header kada postoji token', () => {
    authStore.token.mockReturnValue('abc');

    const next: HttpHandlerFn = vi.fn((request: HttpRequest<unknown>) => {
      expect(request.headers.get('Authorization')).toBe('Bearer abc');
      expect(request.headers.get('Accept')).toBe('application/json');
      return of(new HttpResponse({ status: 200 }));
    });

    TestBed.runInInjectionContext(() => {
      authInterceptor(new HttpRequest('GET', '/test'), next).subscribe();
    });

    expect(next).toHaveBeenCalledOnce();
  });

  it('za client rute koristi isti jedinstveni auth token', () => {
    authStore.token.mockReturnValue('shared-token');

    const next: HttpHandlerFn = vi.fn((request: HttpRequest<unknown>) => {
      expect(request.headers.get('Authorization')).toBe('Bearer shared-token');
      return of(new HttpResponse({ status: 200 }));
    });

    TestBed.runInInjectionContext(() => {
      authInterceptor(new HttpRequest('GET', '/api/v1/client/dashboard'), next).subscribe();
    });

    expect(next).toHaveBeenCalledOnce();
  });

  it('na 401 cisti sesiju i preusmerava na login', () => {
    authStore.token.mockReturnValue('abc');
    const error = new HttpErrorResponse({ status: 401 });
    const next: HttpHandlerFn = vi.fn(() => throwError(() => error));

    TestBed.runInInjectionContext(() => {
      authInterceptor(new HttpRequest('GET', '/test'), next).subscribe({
        error: () => undefined,
      });
    });

    expect(authStore.clearAuth).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('na 401 za client rutu cisti client sesiju i preusmerava na client login', () => {
    authStore.token.mockReturnValue('client-token');
    const error = new HttpErrorResponse({ status: 401 });
    const next: HttpHandlerFn = vi.fn(() => throwError(() => error));

    TestBed.runInInjectionContext(() => {
      authInterceptor(new HttpRequest('GET', '/api/v1/client/dashboard'), next).subscribe({
        error: () => undefined,
      });
    });

    expect(authStore.clearAuth).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/client/login']);
  });

  it('na 403 postavlja korisnicku poruku bez tehnickog teksta', () => {
    const error = new HttpErrorResponse({ status: 403 });
    const next: HttpHandlerFn = vi.fn(() => throwError(() => error));

    TestBed.runInInjectionContext(() => {
      authInterceptor(new HttpRequest('GET', '/test'), next).subscribe({
        error: () => undefined,
      });
    });

    expect(sessionStorage.getItem('dentio_auth_error')).toBe('Nemate dozvolu za ovu akciju.');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});

import { HttpErrorResponse, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authInterceptor } from './auth-interceptor';

describe('authInterceptor', () => {
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: router }],
    });
  });

  it('dodaje Authorization header kada postoji token', () => {
    localStorage.setItem('dentio_token', 'abc');

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

  it('na 401 briše sesiju i preusmerava na login', () => {
    localStorage.setItem('dentio_token', 'abc');
    localStorage.setItem('dentio_user', '{"id":1}');
    const error = new HttpErrorResponse({ status: 401 });
    const next: HttpHandlerFn = vi.fn(() => throwError(() => error));

    TestBed.runInInjectionContext(() => {
      authInterceptor(new HttpRequest('GET', '/test'), next).subscribe({
        error: () => undefined,
      });
    });

    expect(localStorage.getItem('dentio_token')).toBeNull();
    expect(localStorage.getItem('dentio_user')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('na 403 postavlja korisničku poruku bez tehničkog teksta', () => {
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

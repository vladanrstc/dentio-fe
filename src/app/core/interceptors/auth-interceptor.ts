import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthStore } from '../state/auth.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authStore = inject(AuthStore);
  const isClientRequest = req.url.includes('/client/');
  const token = authStore.token();

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return next(
    req.clone({
      setHeaders: headers,
    }),
  ).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        authStore.clearAuth();
        router.navigate([isClientRequest ? '/client/login' : '/login']);
      }

      if (error instanceof HttpErrorResponse && error.status === 403) {
        sessionStorage.setItem('dentio_auth_error', 'Nemate dozvolu za ovu akciju.');
      }

      return throwError(() => error);
    }),
  );
};

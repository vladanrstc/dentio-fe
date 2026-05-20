import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthStore } from '../state/auth.store';
import { ClientAuthStore } from '../state/client-auth.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authStore = inject(AuthStore);
  const clientAuthStore = inject(ClientAuthStore);
  const isClientRequest = req.url.includes('/client/');
  const token = isClientRequest ? clientAuthStore.token() : authStore.token();

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
        if (isClientRequest) {
          clientAuthStore.clearAuth();
          router.navigate(['/client/login']);
        } else {
          authStore.clearAuth();
          router.navigate(['/login']);
        }
      }

      if (error instanceof HttpErrorResponse && error.status === 403) {
        sessionStorage.setItem('dentio_auth_error', 'Nemate dozvolu za ovu akciju.');
      }

      return throwError(() => error);
    }),
  );
};

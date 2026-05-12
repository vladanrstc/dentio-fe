import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('dentio_token');

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
        localStorage.removeItem('dentio_token');
        localStorage.removeItem('dentio_user');
        router.navigate(['/login']);
      }

      if (error instanceof HttpErrorResponse && error.status === 403) {
        sessionStorage.setItem('dentio_auth_error', 'Nemate dozvolu za ovu akciju.');
      }

      return throwError(() => error);
    }),
  );
};

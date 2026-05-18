import { Injectable, inject } from '@angular/core';
import { Observable, of, switchMap, throwError } from 'rxjs';

import { AuthUser, LoginResponse } from '../models/api.models';
import { AuthStore } from '../state/auth.store';
import { AuthApi } from './auth-api.service';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly api = inject(AuthApi);
  private readonly store = inject(AuthStore);

  login(email: string, password: string): Observable<LoginResponse> {
    this.store.clearAuth();

    return this.api.login(email, password).pipe(
      switchMap((response) => {
        if (response.user) {
          this.store.setAuth(response.token, response.user);
          return of(response);
        }

        this.store.setToken(response.token);

        return this.store.checkAuth().pipe(
          switchMap((user) => {
            if (!user) {
              return throwError(() => new Error('Current user is not available.'));
            }

            return of({
              ...response,
              user,
            });
          }),
        );
      }),
    );
  }

  logout(): Observable<unknown> {
    return this.store.logout();
  }

  currentUser(): AuthUser | null {
    return this.store.user();
  }

  homePathFor(user: AuthUser | null = this.currentUser()): string {
    return user?.role === 'platform_admin' ? '/admin/dashboard' : '/dashboard';
  }
}

import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';

import { AuthUser } from '../models/api.models';
import { AuthApi } from '../services/auth-api.service';

const TOKEN_KEY = 'dentio_token';
const USER_KEY = 'dentio_user';

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  private readonly authApi = inject(AuthApi);
  private readonly tokenState = signal<string | null>(null);
  private readonly userState = signal<AuthUser | null>(null);
  private readonly loadingState = signal(false);

  readonly token = this.tokenState.asReadonly();
  readonly user = this.userState.asReadonly();
  readonly loading = this.loadingState.asReadonly();

  readonly isAuthenticated = computed(() => !!this.tokenState());
  readonly hasUser = computed(() => !!this.userState());
  readonly role = computed(() => this.userState()?.role ?? null);
  readonly isPlatformAdmin = computed(() => this.role() === 'platform_admin');
  readonly isCompanyAdmin = computed(() => this.role() === 'company_admin');
  readonly isDentist = computed(() => this.role() === 'dentist');
  readonly isNurse = computed(() => this.role() === 'nurse');
  readonly isCompanyUser = computed(() => this.isCompanyAdmin() || this.isDentist() || this.isNurse());

  constructor() {
    this.restoreFromStorage();
  }

  setToken(token: string | null): void {
    const normalizedToken = token?.trim() || null;
    this.tokenState.set(normalizedToken);

    if (normalizedToken) {
      localStorage.setItem(TOKEN_KEY, normalizedToken);
      return;
    }

    localStorage.removeItem(TOKEN_KEY);
  }

  setUser(user: AuthUser | null): void {
    this.userState.set(user);

    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return;
    }

    localStorage.removeItem(USER_KEY);
  }

  setLoading(value: boolean): void {
    this.loadingState.set(value);
  }

  setAuth(token: string, user: AuthUser | null): void {
    this.setToken(token);
    this.setUser(user);
  }

  restoreFromStorage(): void {
    this.tokenState.set(localStorage.getItem(TOKEN_KEY));
    this.userState.set(this.readStoredUser());
  }

  checkAuth(): Observable<AuthUser | null> {
    if (!this.tokenState()) {
      this.clearAuth();
      return of(null);
    }

    this.setLoading(true);

    return this.authApi.me().pipe(
      tap((user) => {
        this.setUser(user);
      }),
      map((user) => user),
      catchError(() => {
        this.clearAuth();
        return of(null);
      }),
      finalize(() => {
        this.setLoading(false);
      }),
    );
  }

  logout(): Observable<unknown> {
    if (!this.tokenState()) {
      this.clearAuth();
      return of(null);
    }

    this.setLoading(true);

    return this.authApi.logout().pipe(
      catchError(() => of(null)),
      finalize(() => {
        this.clearAuth();
        this.setLoading(false);
      }),
    );
  }

  clearAuth(): void {
    this.tokenState.set(null);
    this.userState.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private readStoredUser(): AuthUser | null {
    const userJson = localStorage.getItem(USER_KEY);

    if (!userJson) {
      return null;
    }

    try {
      return JSON.parse(userJson) as AuthUser;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }
}

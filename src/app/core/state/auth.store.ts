import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';

import { AuthRole } from '../models/auth.models';
import { AuthUser } from '../models/api.models';
import { AuthApi } from '../services/auth-api.service';

const TOKEN_KEY = 'dentio_token';
const USER_KEY = 'dentio_user';

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
};

const initialState: AuthState = {
  token: null,
  user: null,
  loading: false,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ token, user }) => ({
    isAuthenticated: computed(() => !!token()),
    hasUser: computed(() => !!user()),
    hasPrincipal: computed(() => !!user()),
    role: computed(() => user()?.role ?? null),
    isPlatformAdmin: computed(() => user()?.role === AuthRole.PlatformAdmin),
    isCompanyAdmin: computed(() => user()?.role === AuthRole.CompanyAdmin),
    isDentist: computed(() => user()?.role === AuthRole.Dentist),
    isNurse: computed(() => user()?.role === AuthRole.Nurse),
    isClientPatient: computed(() => user()?.role === AuthRole.Client),
    isPatientClient: computed(() => user()?.role === AuthRole.Client),
    principalName: computed(() => user()?.name ?? 'Korisnik'),
    isCompanyUser: computed(() => {
      const currentRole = user()?.role;
      return currentRole === AuthRole.CompanyAdmin || currentRole === AuthRole.Dentist || currentRole === AuthRole.Nurse;
    }),
  })),
  withMethods((store, authApi = inject(AuthApi)) => {
    function setTokenState(token: string | null): void {
      const normalizedToken = token?.trim() || null;

      patchState(store, { token: normalizedToken });

      if (normalizedToken) {
        localStorage.setItem(TOKEN_KEY, normalizedToken);
        return;
      }

      localStorage.removeItem(TOKEN_KEY);
    }

    function setUserState(user: AuthUser | null): void {
      patchState(store, { user });

      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        return;
      }

      localStorage.removeItem(USER_KEY);
    }

    function clearAuthState(): void {
      patchState(store, { token: null, user: null });
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }

    function readStoredUser(): AuthUser | null {
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

    return {
      setToken(token: string | null): void {
        setTokenState(token);
      },

      setUser(user: AuthUser | null): void {
        setUserState(user);
      },

      setAuth(token: string, user: AuthUser | null): void {
        setTokenState(token);
        setUserState(user);
      },

      restoreFromStorage(): void {
        patchState(store, {
          token: localStorage.getItem(TOKEN_KEY),
          user: readStoredUser(),
        });
      },

      checkAuth(): Observable<AuthUser | null> {
        if (!store.token()) {
          clearAuthState();
          return of(null);
        }

        patchState(store, { loading: true });

        return authApi.me().pipe(
          tap((user) => {
            setUserState(user);
          }),
          map((user) => user),
          catchError(() => {
            clearAuthState();
            return of(null);
          }),
          finalize(() => {
            patchState(store, { loading: false });
          }),
        );
      },

      logout(): Observable<unknown> {
        if (!store.token()) {
          clearAuthState();
          return of(null);
        }

        patchState(store, { loading: true });

        return authApi.logout().pipe(
          catchError(() => of(null)),
          finalize(() => {
            clearAuthState();
            patchState(store, { loading: false });
          }),
        );
      },

      clearAuth(): void {
        clearAuthState();
      },
    };
  }),
  withHooks({
    onInit(store) {
      store.restoreFromStorage();
    },
  }),
);

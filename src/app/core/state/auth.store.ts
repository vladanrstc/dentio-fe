import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';

import { AuthType, AuthUser, ClientPatient } from '../models/api.models';
import { AuthApi } from '../services/auth-api.service';

const TOKEN_KEY = 'dentio_token';
const AUTH_TYPE_KEY = 'dentio_auth_type';
const PRINCIPAL_KEY = 'dentio_principal';
const LEGACY_USER_KEY = 'dentio_user';
const LEGACY_CLIENT_TOKEN_KEY = 'dentio_client_token';
const LEGACY_CLIENT_PATIENT_KEY = 'dentio_client_patient';

type AuthState = {
  token: string | null;
  authType: AuthType | null;
  user: AuthUser | null;
  patient: ClientPatient | null;
  loading: boolean;
};

const initialState: AuthState = {
  token: null,
  authType: null,
  user: null,
  patient: null,
  loading: false,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ token, authType, user, patient }) => ({
    isAuthenticated: computed(() => !!token()),
    hasUser: computed(() => !!user()),
    hasPatient: computed(() => !!patient()),
    hasPrincipal: computed(() => !!user() || !!patient()),
    role: computed(() => (authType() === 'client' ? 'client' : user()?.role ?? null)),
    isPlatformAdmin: computed(() => user()?.role === 'platform_admin'),
    isCompanyAdmin: computed(() => user()?.role === 'company_admin'),
    isDentist: computed(() => user()?.role === 'dentist'),
    isNurse: computed(() => user()?.role === 'nurse'),
    isClientPatient: computed(() => authType() === 'client' && !!patient()),
    isPatientClient: computed(() => authType() === 'client' && !!patient()),
    principalName: computed(() => {
      if (authType() === 'client') {
        return patient()?.full_name ?? patient()?.first_name ?? 'Pacijent';
      }

      return user()?.name ?? 'Korisnik';
    }),
    isCompanyUser: computed(() => {
      const currentRole = user()?.role;
      return currentRole === 'company_admin' || currentRole === 'dentist' || currentRole === 'nurse';
    }),
  })),
  withMethods((store, authApi = inject(AuthApi)) => {
    function setTokenState(token: string | null, authType: AuthType | null = store.authType() ?? 'user'): void {
      const normalizedToken = token?.trim() || null;

      patchState(store, { token: normalizedToken, authType: normalizedToken ? authType : null });

      if (normalizedToken) {
        localStorage.setItem(TOKEN_KEY, normalizedToken);
        localStorage.setItem(AUTH_TYPE_KEY, authType ?? 'user');
        return;
      }

      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(AUTH_TYPE_KEY);
    }

    function setUserState(user: AuthUser | null): void {
      patchState(store, { authType: user ? 'user' : store.authType(), user, patient: null });

      if (user) {
        localStorage.setItem(AUTH_TYPE_KEY, 'user');
        localStorage.setItem(PRINCIPAL_KEY, JSON.stringify(user));
        localStorage.removeItem(LEGACY_USER_KEY);
        return;
      }

      localStorage.removeItem(PRINCIPAL_KEY);
    }

    function setPatientState(patient: ClientPatient | null): void {
      patchState(store, { authType: patient ? 'client' : store.authType(), user: null, patient });

      if (patient) {
        localStorage.setItem(AUTH_TYPE_KEY, 'client');
        localStorage.setItem(PRINCIPAL_KEY, JSON.stringify(patient));
        localStorage.removeItem(LEGACY_USER_KEY);
        return;
      }

      localStorage.removeItem(PRINCIPAL_KEY);
    }

    function clearAuthState(): void {
      patchState(store, { token: null, authType: null, user: null, patient: null });
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(AUTH_TYPE_KEY);
      localStorage.removeItem(PRINCIPAL_KEY);
      localStorage.removeItem(LEGACY_USER_KEY);
      localStorage.removeItem(LEGACY_CLIENT_TOKEN_KEY);
      localStorage.removeItem(LEGACY_CLIENT_PATIENT_KEY);
    }

    function readStoredPrincipal(): AuthUser | ClientPatient | null {
      const principalJson = localStorage.getItem(PRINCIPAL_KEY) ?? localStorage.getItem(LEGACY_USER_KEY);

      if (!principalJson) {
        return null;
      }

      try {
        return JSON.parse(principalJson) as AuthUser | ClientPatient;
      } catch {
        localStorage.removeItem(PRINCIPAL_KEY);
        localStorage.removeItem(LEGACY_USER_KEY);
        return null;
      }
    }

    return {
      setToken(token: string | null, authType: AuthType = 'user'): void {
        setTokenState(token, authType);
      },

      setUser(user: AuthUser | null): void {
        setUserState(user);
      },

      setAuth(token: string, user: AuthUser | null): void {
        setTokenState(token, 'user');
        setUserState(user);
      },

      setClientAuth(token: string, patient: ClientPatient | null): void {
        setTokenState(token, 'client');
        setPatientState(patient);
      },

      restoreFromStorage(): void {
        const token = localStorage.getItem(TOKEN_KEY);
        const authType = (localStorage.getItem(AUTH_TYPE_KEY) as AuthType | null) ?? 'user';
        const principal = readStoredPrincipal();

        patchState(store, {
          token,
          authType: token ? authType : null,
          user: token && authType === 'user' ? (principal as AuthUser | null) : null,
          patient: token && authType === 'client' ? (principal as ClientPatient | null) : null,
        });
      },

      checkAuth(): Observable<AuthUser | ClientPatient | null> {
        if (!store.token()) {
          clearAuthState();
          return of(null);
        }

        patchState(store, { loading: true });

        const request$: Observable<AuthUser | ClientPatient> =
          store.authType() === 'client' ? authApi.clientMe() : authApi.me();

        return request$.pipe(
          tap((principal) => {
            if (store.authType() === 'client') {
              setPatientState(principal as ClientPatient);
              return;
            }

            setUserState(principal as AuthUser);
          }),
          map((principal) => principal),
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

        const request$ = store.authType() === 'client' ? authApi.clientLogout() : authApi.logout();

        return request$.pipe(
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

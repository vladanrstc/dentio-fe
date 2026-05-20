import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';

import { ClientPatient } from '../models/api.models';
import { ClientPortalApi } from '../services/client-portal-api.service';

const CLIENT_TOKEN_KEY = 'dentio_client_token';
const CLIENT_PATIENT_KEY = 'dentio_client_patient';

type ClientAuthState = {
  token: string | null;
  patient: ClientPatient | null;
  loading: boolean;
};

const initialState: ClientAuthState = {
  token: null,
  patient: null,
  loading: false,
};

export const ClientAuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ token, patient }) => ({
    isAuthenticated: computed(() => !!token()),
    hasPatient: computed(() => !!patient()),
    patientName: computed(() => patient()?.full_name ?? patient()?.first_name ?? 'Pacijent'),
  })),
  withMethods((store, clientApi = inject(ClientPortalApi)) => {
    function setTokenState(token: string | null): void {
      const normalizedToken = token?.trim() || null;

      patchState(store, { token: normalizedToken });

      if (normalizedToken) {
        localStorage.setItem(CLIENT_TOKEN_KEY, normalizedToken);
        return;
      }

      localStorage.removeItem(CLIENT_TOKEN_KEY);
    }

    function setPatientState(patient: ClientPatient | null): void {
      patchState(store, { patient });

      if (patient) {
        localStorage.setItem(CLIENT_PATIENT_KEY, JSON.stringify(patient));
        return;
      }

      localStorage.removeItem(CLIENT_PATIENT_KEY);
    }

    function clearClientAuthState(): void {
      patchState(store, { token: null, patient: null });
      localStorage.removeItem(CLIENT_TOKEN_KEY);
      localStorage.removeItem(CLIENT_PATIENT_KEY);
    }

    function readStoredPatient(): ClientPatient | null {
      const patientJson = localStorage.getItem(CLIENT_PATIENT_KEY);

      if (!patientJson) {
        return null;
      }

      try {
        return JSON.parse(patientJson) as ClientPatient;
      } catch {
        localStorage.removeItem(CLIENT_PATIENT_KEY);
        return null;
      }
    }

    return {
      setToken(token: string | null): void {
        setTokenState(token);
      },

      setPatient(patient: ClientPatient | null): void {
        setPatientState(patient);
      },

      setAuth(token: string, patient: ClientPatient | null): void {
        setTokenState(token);
        setPatientState(patient);
      },

      restoreFromStorage(): void {
        patchState(store, {
          token: localStorage.getItem(CLIENT_TOKEN_KEY),
          patient: readStoredPatient(),
        });
      },

      checkAuth(): Observable<ClientPatient | null> {
        if (!store.token()) {
          clearClientAuthState();
          return of(null);
        }

        patchState(store, { loading: true });

        return clientApi.me().pipe(
          tap((patient) => {
            setPatientState(patient);
          }),
          map((patient) => patient),
          catchError(() => {
            clearClientAuthState();
            return of(null);
          }),
          finalize(() => {
            patchState(store, { loading: false });
          }),
        );
      },

      logout(): Observable<unknown> {
        if (!store.token()) {
          clearClientAuthState();
          return of(null);
        }

        patchState(store, { loading: true });

        return clientApi.logout().pipe(
          catchError(() => of(null)),
          finalize(() => {
            clearClientAuthState();
            patchState(store, { loading: false });
          }),
        );
      },

      clearAuth(): void {
        clearClientAuthState();
      },
    };
  }),
  withHooks({
    onInit(store) {
      store.restoreFromStorage();
    },
  }),
);

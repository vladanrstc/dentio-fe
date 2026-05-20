import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ActiveItem,
  Appointment,
  AcceptPatientPortalInvitePayload,
  AcceptPatientPortalInviteResponse,
  ClientDashboardData,
  ClientDashboardResponse,
  ClientLoginResponse,
  ClientMeResponse,
  ClientPatient,
  CollectionResponse,
  Intervention,
  PatientPortalInviteData,
  PatientPortalInviteResponse,
  SendPatientPortalInvitePayload,
} from '../models/api.models';
import { unwrapCollection, unwrapItem } from '../utils/http-helpers';

@Injectable({
  providedIn: 'root',
})
export class ClientPortalApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  login(email: string, password: string): Observable<ClientLoginResponse> {
    return this.http.post<ClientLoginResponse>(`${this.baseUrl}/client/login`, { email, password });
  }

  sendPatientPortalInvite(email: string): Observable<PatientPortalInviteData> {
    const payload: SendPatientPortalInvitePayload = { email };
    return this.http
      .post<PatientPortalInviteResponse>(`${this.baseUrl}/company/patients/portal-invites`, payload)
      .pipe(map((response): PatientPortalInviteData => unwrapItem(response)));
  }

  showClientInvite(token: string): Observable<PatientPortalInviteData> {
    return this.http
      .get<PatientPortalInviteResponse>(`${this.baseUrl}/client/invites/${token}`)
      .pipe(map((response): PatientPortalInviteData => unwrapItem(response)));
  }

  acceptClientInvite(
    token: string,
    password: string,
    passwordConfirmation: string,
  ): Observable<AcceptPatientPortalInviteResponse> {
    const payload: AcceptPatientPortalInvitePayload = {
      password,
      password_confirmation: passwordConfirmation,
    };

    return this.http.post<AcceptPatientPortalInviteResponse>(`${this.baseUrl}/client/invites/${token}/accept`, payload);
  }

  logout(): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/client/logout`, {});
  }

  me(): Observable<ClientPatient> {
    return this.http
      .get<ClientMeResponse>(`${this.baseUrl}/client/me`)
      .pipe(map((response): ClientPatient => unwrapItem(response)));
  }

  dashboard(): Observable<ClientDashboardData> {
    return this.http
      .get<ClientDashboardResponse>(`${this.baseUrl}/client/dashboard`)
      .pipe(map((response): ClientDashboardData => unwrapItem(response)));
  }

  appointments(): Observable<Appointment[]> {
    return this.http
      .get<CollectionResponse<Appointment>>(`${this.baseUrl}/client/appointments`)
      .pipe(map((response): Appointment[] => unwrapCollection(response)));
  }

  interventions(): Observable<Intervention[]> {
    return this.http
      .get<CollectionResponse<Intervention>>(`${this.baseUrl}/client/interventions`)
      .pipe(map((response): Intervention[] => unwrapCollection(response)));
  }

  tasks(): Observable<ActiveItem[]> {
    return this.http
      .get<CollectionResponse<ActiveItem>>(`${this.baseUrl}/client/tasks`)
      .pipe(map((response): ActiveItem[] => unwrapCollection(response)));
  }
}

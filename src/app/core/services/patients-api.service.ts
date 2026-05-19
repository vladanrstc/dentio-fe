import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ActiveItem,
  Appointment,
  AppointmentPayload,
  CollectionResponse,
  DashboardData,
  DashboardResponse,
  Intervention,
  InterventionPayload,
  ItemResponse,
  Patient,
  PatientPayload,
  PatientStatusPayload,
  PatientTaskPayload,
  StaffMember,
} from '../models/api.models';
import { unwrapItem } from '../utils/http-helpers';

@Injectable({
  providedIn: 'root',
})
export class PatientsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getDashboard(): Observable<DashboardData> {
    return this.http
      .get<DashboardResponse>(`${this.baseUrl}/dashboard`)
      .pipe(map((response): DashboardData => unwrapItem(response)));
  }

  getStaff(): Observable<CollectionResponse<StaffMember>> {
    return this.http.get<CollectionResponse<StaffMember>>(`${this.baseUrl}/staff`);
  }

  getPatients(search = ''): Observable<CollectionResponse<Patient>> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<CollectionResponse<Patient>>(`${this.baseUrl}/company/patients`, {
      params,
    });
  }

  getPatient(patientId: number): Observable<Patient> {
    return this.http
      .get<ItemResponse<Patient>>(`${this.baseUrl}/company/patients/${patientId}`)
      .pipe(map((response): Patient => unwrapItem(response)));
  }

  createPatient(payload: PatientPayload): Observable<ItemResponse<Patient>> {
    return this.http.post<ItemResponse<Patient>>(`${this.baseUrl}/company/patients`, payload);
  }

  updatePatient(patientId: number, payload: PatientPayload): Observable<ItemResponse<Patient>> {
    return this.http.put<ItemResponse<Patient>>(
      `${this.baseUrl}/company/patients/${patientId}`,
      payload,
    );
  }

  deletePatient(patientId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/company/patients/${patientId}`);
  }

  createAppointment(
    patientId: number,
    payload: AppointmentPayload,
  ): Observable<ItemResponse<Appointment>> {
    return this.http.post<ItemResponse<Appointment>>(
      `${this.baseUrl}/company/patients/${patientId}/appointments`,
      payload,
    );
  }

  createIntervention(
    patientId: number,
    payload: InterventionPayload,
  ): Observable<ItemResponse<Intervention>> {
    return this.http.post<ItemResponse<Intervention>>(
      `${this.baseUrl}/company/patients/${patientId}/interventions`,
      payload,
    );
  }

  createPatientTask(
    patientId: number,
    payload: PatientTaskPayload,
  ): Observable<ItemResponse<ActiveItem>> {
    return this.http.post<ItemResponse<ActiveItem>>(
      `${this.baseUrl}/company/patients/${patientId}/tasks`,
      payload,
    );
  }

  completePatientTask(patientId: number, taskId: number): Observable<ItemResponse<ActiveItem>> {
    return this.http.patch<ItemResponse<ActiveItem>>(
      `${this.baseUrl}/company/patients/${patientId}/tasks/${taskId}/complete`,
      {},
    );
  }

  updatePatientStatus(
    patientId: number,
    payload: PatientStatusPayload,
  ): Observable<ItemResponse<Patient>> {
    return this.http.patch<ItemResponse<Patient>>(
      `${this.baseUrl}/company/patients/${patientId}/status`,
      payload,
    );
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

export type DashboardData = {
  patients_total?: number;
  total_patients?: number;
  patients_with_open_tasks?: number;
  appointments_today?: number;
  reminders_due?: number;
  reminders?: number;
  outstanding_amount?: number;
  debt_total?: number;
  debts?: number;
  upcoming_appointments?: Appointment[];
};

export type Appointment = {
  id: number;
  patient_name?: string;
  patient?: {
    first_name?: string;
    last_name?: string;
    name?: string;
  };
  starts_at?: string;
  appointment_at?: string;
  date?: string;
  time?: string;
  note?: string;
};

export type StaffMember = {
  id: number;
  name: string;
  email?: string;
};

export type Patient = {
  id: number;
  first_name: string;
  last_name: string;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  primary_dentist_id?: number | null;
  primary_dentist?: StaffMember | string | null;
};

export type PatientPayload = {
  first_name: string;
  last_name: string;
  address: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  primary_dentist_id: number | null;
};

export type CollectionResponse<T> = T[] | { data: T[] } | { data: { data: T[] } };
export type ItemResponse<T> = T | { data: T };
export type DashboardResponse = DashboardData | { data: DashboardData };

@Injectable({
  providedIn: 'root',
})
export class Api {
  private readonly http = inject(HttpClient);
  readonly baseUrl = 'http://127.0.0.1:8000/api/v1';

  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardResponse>(`${this.baseUrl}/dashboard`).pipe(
      map((response): DashboardData => {
        if ('data' in response) {
          return response.data;
        }

        return response;
      }),
    );
  }

  getStaff(): Observable<CollectionResponse<StaffMember>> {
    return this.http.get<CollectionResponse<StaffMember>>(`${this.baseUrl}/staff`);
  }

  getPatients(search = ''): Observable<CollectionResponse<Patient>> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<CollectionResponse<Patient>>(`${this.baseUrl}/company/patients`, { params });
  }

  createPatient(payload: PatientPayload): Observable<ItemResponse<Patient>> {
    return this.http.post<ItemResponse<Patient>>(`${this.baseUrl}/company/patients`, payload);
  }

  updatePatient(patientId: number, payload: PatientPayload): Observable<ItemResponse<Patient>> {
    return this.http.put<ItemResponse<Patient>>(`${this.baseUrl}/company/patients/${patientId}`, payload);
  }
}

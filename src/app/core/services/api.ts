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

export type Financials = {
  total_cost?: number | string | null;
  paid_amount?: number | string | null;
  outstanding_amount?: number | string | null;
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
  ends_at?: string;
  appointment_at?: string;
  date?: string;
  time?: string;
  type?: string | null;
  note?: string;
  notes?: string | null;
  assigned_user?: StaffMember | string | null;
  assigned_user_id?: number | null;
};

export type Intervention = {
  id: number;
  title?: string;
  description?: string | null;
  next_step?: string | null;
  name?: string;
  tooth?: string | number | null;
  price?: number | string | null;
  total_cost?: number | string | null;
  paid_amount?: number | string | null;
  status?: string | null;
  created_at?: string;
  date?: string;
  intervention_date?: string | null;
  performed_by_user?: StaffMember | string | null;
  assigned_to_user?: StaffMember | string | null;
};

export type ActiveItem = {
  id: number;
  title?: string;
  description?: string | null;
  due_date?: string | null;
  due_at?: string | null;
  assigned_to_user?: StaffMember | string | null;
  status?: string | null;
};

export type StaffMember = {
  id: number;
  name: string;
  email?: string;
};

export type Patient = {
  id: number;
  full_name?: string;
  first_name: string;
  last_name: string;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  manual_status?: string | null;
  manual_status_reason?: string | null;
  open_tasks_count?: number;
  financials?: Financials | null;
  appointments?: Appointment[];
  upcoming_appointments?: Appointment[];
  interventions?: Intervention[];
  active_tasks?: ActiveItem[];
  active_items?: ActiveItem[];
  next_steps?: ActiveItem[];
  created_at?: string;
  updated_at?: string;
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

export type AppointmentPayload = {
  starts_at: string;
  ends_at: string;
  type: string;
  assigned_user_id: number | null;
  notes: string | null;
  reminder_staff_at: string | null;
  reminder_patient_at: string | null;
};

export type InterventionPayload = {
  title: string;
  description: string | null;
  next_step: string | null;
  intervention_date: string;
  appointment_id: number | null;
  performed_by_user_id: number | null;
  assigned_to_user_id: number | null;
  task_due_date: string | null;
  total_cost: number;
  paid_amount: number;
  reminder_staff_at: string | null;
  reminder_patient_at: string | null;
};

export type PatientTaskPayload = {
  description: string;
  due_date: string | null;
  assigned_to_user_id: number | null;
};

export type PatientStatusPayload = {
  manual_status: 'active' | 'inactive' | 'transferred' | 'completed';
  manual_status_reason: string | null;
};

export type AdminInvite = {
  id: number;
  company_id?: number | null;
  company_name?: string | null;
  email: string;
  role?: string;
  status?: string;
  invited_by?: { id: number; name: string } | string | null;
  accepted_by?: { id: number; name: string } | string | null;
  expires_at?: string | null;
  accepted_at?: string | null;
  created_at?: string | null;
};

export type AdminCompany = {
  id: number;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  staff_count?: number;
  patients_count?: number;
  active_appointments_count?: number;
  pending_invites_count?: number;
  created_at?: string | null;
};

export type AdminDashboardData = {
  companies_total?: number;
  staff_total?: number;
  patients_total?: number;
  active_appointments_count?: number;
  pending_invites_count?: number;
  latest_companies?: AdminCompany[];
  latest_invites?: AdminInvite[];
};

export type AdminCompanyDetail = AdminCompany & {
  created_by?: { id: number; name: string } | string | null;
  kpi?: {
    staff_count?: number;
    patients_count?: number;
    active_appointments_count?: number;
    interventions_count?: number;
    pending_invites_count?: number;
  };
  staff?: Array<{
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    role?: string | null;
    created_at?: string | null;
  }>;
  latest_patients?: Array<{
    id: number;
    full_name: string;
    phone?: string | null;
    email?: string | null;
    manual_status?: string | null;
    created_at?: string | null;
  }>;
  latest_invites?: AdminInvite[];
};

export type InviteCompanyOwnerPayload = {
  email: string;
};

export type CompanyTeamMember = {
  id: number;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  created_at?: string | null;
};

export type CompanyInvite = {
  id: number;
  email: string;
  role?: string | null;
  status?: string | null;
  expires_at?: string | null;
  accepted_at?: string | null;
  created_at?: string | null;
};

export type InviteTeamMemberPayload = {
  email: string;
  role: 'dentist' | 'nurse';
};

export type InviteAcceptanceData = {
  email: string;
  role: string;
  expires_at?: string | null;
  valid: boolean;
  accepted: boolean;
  expired: boolean;
  requires_company: boolean;
};

export type AcceptInvitePayload = {
  first_name: string;
  last_name: string;
  phone: string | null;
  password: string;
  password_confirmation: string;
  company_name?: string;
  company_address?: string;
  company_phone?: string | null;
};

export type CollectionResponse<T> = T[] | { data: T[] } | { data: { data: T[] } };
export type ItemResponse<T> = T | { data: T };
export type DashboardResponse = DashboardData | { data: DashboardData };
export type AdminDashboardResponse = AdminDashboardData | { data: AdminDashboardData };

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

    return this.http.get<CollectionResponse<Patient>>(`${this.baseUrl}/company/patients`, {
      params,
    });
  }

  getPatient(patientId: number): Observable<Patient> {
    return this.http
      .get<ItemResponse<Patient>>(`${this.baseUrl}/company/patients/${patientId}`)
      .pipe(
        map((response): Patient => {
          if ('data' in response) {
            return response.data;
          }

          return response;
        }),
      );
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

  getAdminDashboard(): Observable<AdminDashboardData> {
    return this.http.get<AdminDashboardResponse>(`${this.baseUrl}/admin/dashboard`).pipe(
      map((response): AdminDashboardData => {
        if ('data' in response) {
          return response.data;
        }

        return response;
      }),
    );
  }

  getAdminCompanies(): Observable<CollectionResponse<AdminCompany>> {
    return this.http.get<CollectionResponse<AdminCompany>>(`${this.baseUrl}/admin/companies`);
  }

  getAdminCompany(companyId: number): Observable<AdminCompanyDetail> {
    return this.http
      .get<ItemResponse<AdminCompanyDetail>>(`${this.baseUrl}/admin/companies/${companyId}`)
      .pipe(
        map((response): AdminCompanyDetail => {
          if ('data' in response) {
            return response.data;
          }

          return response;
        }),
      );
  }

  deleteAdminCompany(companyId: number): Observable<{ data: { deleted: boolean; id: number } }> {
    return this.http.delete<{ data: { deleted: boolean; id: number } }>(
      `${this.baseUrl}/admin/companies/${companyId}`,
    );
  }

  deleteAdminInvite(inviteId: number): Observable<{ data: { deleted: boolean; id: number } }> {
    return this.http.delete<{ data: { deleted: boolean; id: number } }>(
      `${this.baseUrl}/admin/invites/${inviteId}`,
    );
  }

  inviteCompanyOwner(payload: InviteCompanyOwnerPayload): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/admin/invite-owner`, payload);
  }

  getCompanyTeam(): Observable<CollectionResponse<CompanyTeamMember>> {
    return this.http.get<CollectionResponse<CompanyTeamMember>>(`${this.baseUrl}/company/team`);
  }

  deleteTeamMember(userId: number): Observable<{ data: { deleted: boolean; id: number } }> {
    return this.http.delete<{ data: { deleted: boolean; id: number } }>(`${this.baseUrl}/company/team/${userId}`);
  }

  getCompanyInvites(): Observable<CollectionResponse<CompanyInvite>> {
    return this.http.get<CollectionResponse<CompanyInvite>>(`${this.baseUrl}/company/invites`);
  }

  deleteCompanyInvite(inviteId: number): Observable<{ data: { deleted: boolean; id: number } }> {
    return this.http.delete<{ data: { deleted: boolean; id: number } }>(
      `${this.baseUrl}/company/invites/${inviteId}`,
    );
  }

  inviteTeamMember(payload: InviteTeamMemberPayload): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/company/invites`, payload);
  }

  getInviteAcceptance(token: string): Observable<InviteAcceptanceData> {
    return this.http
      .get<ItemResponse<InviteAcceptanceData>>(`${this.baseUrl}/invites/accept/${token}`)
      .pipe(
        map((response): InviteAcceptanceData => {
          if ('data' in response) {
            return response.data;
          }

          return response;
        }),
      );
  }

  acceptInvite(token: string, payload: AcceptInvitePayload): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/invites/accept/${token}`, payload);
  }
}

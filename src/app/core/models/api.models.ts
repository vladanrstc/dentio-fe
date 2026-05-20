export type AuthUser = {
  id: number;
  company_id: number | null;
  name: string;
  email: string;
  role: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type MeResponse = AuthUser | { data: AuthUser | { user: AuthUser } } | { user: AuthUser };

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
  title?: string | null;
  name?: string | null;
  label?: string | null;
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
  assigned_to?: StaffMember | string | null;
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
  assigned_to?: StaffMember | string | null;
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

export type ReportFormat = 'csv' | 'xlsx' | 'pdf';

export type ReportParams = Record<string, string | number | boolean | null | undefined>;

export type ReportFrequency = 'off' | 'daily' | 'weekly' | 'monthly';

export type ReportSettingsItem = {
  report: 'patients' | 'appointments' | 'interventions_financial' | 'companies';
  frequency: ReportFrequency;
  format: ReportFormat;
};

export type ReportSubscription = ReportSettingsItem & {
  report_key?: ReportSettingsItem['report'];
};

export type ReportSubscriptionPayload = {
  frequency: ReportFrequency;
  format: ReportFormat;
};

export type ClientPatient = Patient;

export type ClientLoginResponse = {
  data: {
    token: string;
    patient: ClientPatient;
  };
};

export type ClientMeResponse = ClientPatient | { data: ClientPatient };

export type ClientDashboardData = {
  patient: ClientPatient;
  appointments: Appointment[];
  interventions: Intervention[];
  tasks: ActiveItem[];
  financials?: Financials | null;
};

export type ClientDashboardResponse = ClientDashboardData | { data: ClientDashboardData };

export type SendPatientPortalInvitePayload = {
  email: string;
};

export type PatientPortalInviteData = {
  id: number;
  email: string;
  expires_at?: string | null;
  valid: boolean;
  expired: boolean;
  accepted: boolean;
  revoked?: boolean;
};

export type PatientPortalInviteResponse = PatientPortalInviteData | { data: PatientPortalInviteData };

export type AcceptPatientPortalInvitePayload = {
  password: string;
  password_confirmation: string;
};

export type AcceptPatientPortalInviteResponse = {
  data: {
    patient: ClientPatient;
  };
};

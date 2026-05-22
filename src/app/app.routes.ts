import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { AdminLayout } from './layout/admin-layout/admin-layout';
import { Login } from './pages/login/login';
import { InviteAccept } from './pages/invite-accept/invite-accept';
import { Dashboard } from './pages/dashboard/dashboard';
import { Patients } from './pages/patients/patients';
import { PatientDetail } from './pages/patient-detail/patient-detail';
import { Team } from './pages/team/team';
import { TeamInvites } from './pages/team-invites/team-invites';
import { AdminDashboard } from './pages/admin-dashboard/admin-dashboard';
import { AdminCompanies } from './pages/admin-companies/admin-companies';
import { AdminCompanyDetail } from './pages/admin-company-detail/admin-company-detail';
import { AdminInviteOwner } from './pages/admin-invite-owner/admin-invite-owner';
import { ReportSettings } from './pages/report-settings/report-settings';
import { ClientLayout } from './layout/client-layout/client-layout.component';
import { ClientDashboard } from './pages/client-dashboard/client-dashboard.component';
import { ClientSetupPassword } from './pages/client-setup-password/client-setup-password.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { AuthRole, COMPANY_ROLES } from './core/models/auth.models';

export const routes: Routes = [
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'invites/accept/:token',
    component: InviteAccept,
  },
  {
    path: 'client/login',
    pathMatch: 'full',
    redirectTo: '/login',
  },
  {
    path: 'client/setup-password',
    component: ClientSetupPassword,
  },
  {
    path: 'client',
    component: ClientLayout,
    canActivate: [authGuard, roleGuard],
    data: { roles: [AuthRole.Client] },
    children: [
      {
        path: 'dashboard',
        component: ClientDashboard,
      },
      {
        path: 'appointments',
        component: ClientDashboard,
      },
      {
        path: 'interventions',
        component: ClientDashboard,
      },
      {
        path: 'tasks',
        component: ClientDashboard,
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard, roleGuard],
    data: { roles: [AuthRole.PlatformAdmin] },
    children: [
      {
        path: 'dashboard',
        component: AdminDashboard,
      },
      {
        path: 'companies',
        component: AdminCompanies,
      },
      {
        path: 'companies/:id',
        component: AdminCompanyDetail,
      },
      {
        path: 'invite-owner',
        component: AdminInviteOwner,
      },
      {
        path: 'reports/settings',
        component: ReportSettings,
        data: { reportMode: 'admin' },
      },
      {
        path: 'invites',
        pathMatch: 'full',
        redirectTo: 'invite-owner',
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard, roleGuard],
    data: { roles: COMPANY_ROLES },
    children: [
      {
        path: 'dashboard',
        component: Dashboard,
      },
      {
        path: 'patients',
        component: Patients,
      },
      {
        path: 'patients/:id',
        component: PatientDetail,
      },
      {
        path: 'team',
        component: Team,
      },
      {
        path: 'team/invites',
        component: TeamInvites,
      },
      {
        path: 'reports/settings',
        component: ReportSettings,
        data: { reportMode: 'company' },
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];

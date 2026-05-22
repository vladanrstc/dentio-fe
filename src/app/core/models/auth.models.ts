export enum AuthRole {
  PlatformAdmin = 'platform_admin',
  CompanyAdmin = 'company_admin',
  Dentist = 'dentist',
  Nurse = 'nurse',
  Client = 'client',
}

export const COMPANY_ROLES = [AuthRole.CompanyAdmin, AuthRole.Dentist, AuthRole.Nurse] as const;

export function getDefaultRouteForRole(role: AuthRole | string | null | undefined): string {
  switch (role) {
    case AuthRole.PlatformAdmin:
      return '/admin/dashboard';
    case AuthRole.CompanyAdmin:
    case AuthRole.Dentist:
    case AuthRole.Nurse:
      return '/dashboard';
    case AuthRole.Client:
      return '/client/dashboard';
    default:
      return '/login';
  }
}

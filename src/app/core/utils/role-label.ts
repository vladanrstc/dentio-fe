import { AuthRole } from '../models/auth.models';

export function roleLabel(role: string | null | undefined): string {
  switch (role) {
    case AuthRole.PlatformAdmin:
      return 'Platform administrator';
    case AuthRole.CompanyAdmin:
      return 'Admin ordinacije';
    case AuthRole.Dentist:
      return 'Zubar';
    case AuthRole.Nurse:
      return 'Medicinska sestra';
    case AuthRole.Client:
      return 'Pacijent';
    default:
      return role || '-';
  }
}

export function statusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'accepted':
      return 'Prihvaćena';
    case 'pending':
      return 'Na čekanju';
    case 'expired':
      return 'Istekla';
    case 'cancelled':
      return 'Otkazana';
    case 'active':
      return 'Aktivan';
    case 'inactive':
      return 'Neaktivan';
    case 'transferred':
      return 'Prebačen';
    case 'completed':
      return 'Završen';
    default:
      return status || '-';
  }
}

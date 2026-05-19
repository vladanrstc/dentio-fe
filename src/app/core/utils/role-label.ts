export function roleLabel(role: string | null | undefined): string {
  switch (role) {
    case 'platform_admin':
      return 'Platform administrator';
    case 'company_admin':
      return 'Admin ordinacije';
    case 'dentist':
      return 'Zubar';
    case 'nurse':
      return 'Medicinska sestra';
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

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('sr-RS', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: value.includes('T') || value.includes(':') ? '2-digit' : undefined,
    minute: value.includes('T') || value.includes(':') ? '2-digit' : undefined,
  }).format(new Date(value.replace(' ', 'T')));
}

export function formatMoney(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat('sr-RS', {
    style: 'currency',
    currency: 'RSD',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

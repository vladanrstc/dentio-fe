export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const hasTime = /\d{1,2}:\d{2}/.test(value);
  const date = dateOnlyMatch
    ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
    : new Date(value.includes(' ') ? value.replace(' ', 'T') : value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  const formattedDate = `${padDatePart(date.getDate())}.${padDatePart(date.getMonth() + 1)}.${date.getFullYear()}.`;

  if (!hasTime) {
    return formattedDate;
  }

  return `${formattedDate} ${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
}

export function formatDateInput(value: string | null | undefined): string {
  return formatDate(value).replace('-', '');
}

export function toApiDate(value: string | null | undefined): string {
  const trimmedValue = value?.trim() ?? '';

  if (!trimmedValue) {
    return '';
  }

  const serbianDate = trimmedValue.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?$/);

  if (serbianDate) {
    return `${serbianDate[3]}-${padDatePart(Number(serbianDate[2]))}-${padDatePart(Number(serbianDate[1]))}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    return trimmedValue;
  }

  return '';
}

export function toApiDateTime(value: string | null | undefined): string {
  const trimmedValue = value?.trim() ?? '';

  if (!trimmedValue) {
    return '';
  }

  const serbianDateTime = trimmedValue.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?\s+(\d{1,2}):(\d{2})$/);

  if (serbianDateTime) {
    return `${serbianDateTime[3]}-${padDatePart(Number(serbianDateTime[2]))}-${padDatePart(Number(serbianDateTime[1]))} ${padDatePart(Number(serbianDateTime[4]))}:${serbianDateTime[5]}`;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmedValue)) {
    return trimmedValue.replace('T', ' ');
  }

  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(trimmedValue)) {
    return trimmedValue;
  }

  return '';
}

export function formatMoney(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat('sr-RS', {
    style: 'currency',
    currency: 'RSD',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

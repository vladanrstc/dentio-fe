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

export function formatSerbianDate(value: string | null | undefined): string {
  const isoDate = toIsoDate(value);

  if (!isoDate) {
    return '';
  }

  const [year, month, day] = isoDate.split('-');
  return `${day}.${month}.${year}.`;
}

export function formatSerbianDateTime(value: string | null | undefined): string {
  const isoDateTime = toIsoDateTime(value);

  if (!isoDateTime) {
    return '';
  }

  const [date, time] = isoDateTime.split(' ');
  return `${formatSerbianDate(date)} ${time}`;
}

export function parseSerbianDate(value: string | null | undefined): string | null {
  const trimmedValue = value?.trim() ?? '';

  if (!trimmedValue) {
    return null;
  }

  const serbianDate = trimmedValue.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?$/);

  if (!serbianDate) {
    return null;
  }

  return normalizeIsoDate(Number(serbianDate[3]), Number(serbianDate[2]), Number(serbianDate[1]));
}

export function parseSerbianDateTime(value: string | null | undefined): string | null {
  const trimmedValue = value?.trim() ?? '';

  if (!trimmedValue) {
    return null;
  }

  const match = trimmedValue.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?\s+(\d{1,2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const isoDate = normalizeIsoDate(Number(match[3]), Number(match[2]), Number(match[1]));
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  if (!isoDate || !isValidTime(hour, minute)) {
    return null;
  }

  return `${isoDate} ${padDatePart(hour)}:${padDatePart(minute)}`;
}

export function toIsoDate(value: string | null | undefined): string {
  const trimmedValue = value?.trim() ?? '';

  if (!trimmedValue) {
    return '';
  }

  const serbianDate = parseSerbianDate(trimmedValue);

  if (serbianDate) {
    return serbianDate;
  }

  const isoDate = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoDate) {
    return normalizeIsoDate(Number(isoDate[1]), Number(isoDate[2]), Number(isoDate[3])) ?? '';
  }

  return '';
}

export function toIsoDateTime(value: string | null | undefined): string {
  const trimmedValue = value?.trim() ?? '';

  if (!trimmedValue) {
    return '';
  }

  const serbianDateTime = parseSerbianDateTime(trimmedValue);

  if (serbianDateTime) {
    return serbianDateTime;
  }

  const nativeDateTime = trimmedValue.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);

  if (nativeDateTime) {
    const isoDate = toIsoDate(nativeDateTime[1]);
    return isoDate && isValidTime(Number(nativeDateTime[2]), Number(nativeDateTime[3]))
      ? `${isoDate} ${nativeDateTime[2]}:${nativeDateTime[3]}`
      : '';
  }

  const apiDateTime = trimmedValue.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}):(\d{2})/);

  if (apiDateTime) {
    const isoDate = toIsoDate(apiDateTime[1]);
    return isoDate && isValidTime(Number(apiDateTime[2]), Number(apiDateTime[3]))
      ? `${isoDate} ${apiDateTime[2]}:${apiDateTime[3]}`
      : '';
  }

  return '';
}

export function fromIsoDate(value: string | null | undefined): string {
  return formatSerbianDate(value);
}

export function fromIsoDateTime(value: string | null | undefined): string {
  return formatSerbianDateTime(value);
}

export function toApiDate(value: string | null | undefined): string {
  return toIsoDate(value);
}

export function toApiDateTime(value: string | null | undefined): string {
  return toIsoDateTime(value);
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

function normalizeIsoDate(year: number, month: number, day: number): string | null {
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return `${year}-${padDatePart(month)}-${padDatePart(day)}`;
}

function isValidTime(hour: number, minute: number): boolean {
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

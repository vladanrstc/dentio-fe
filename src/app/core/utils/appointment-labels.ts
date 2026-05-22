import { Appointment } from '../models/api.models';

export const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  checkup: 'Pregled',
  intervention: 'Intervencija',
  control: 'Kontrola',
  consultation: 'Konsultacija',
};

export function appointmentTypeLabel(type: string | null | undefined): string {
  const normalizedType = type?.trim() ?? '';
  return normalizedType ? APPOINTMENT_TYPE_LABELS[normalizedType] ?? 'Termin' : 'Termin';
}

export function appointmentTitle(appointment: Appointment): string {
  return (
    firstPresent(appointment.title, appointment.name, appointment.label, appointment.notes, appointment.note) ||
    appointmentTypeLabel(appointment.type)
  );
}

function firstPresent(...values: Array<string | null | undefined>): string {
  return values.map((value) => value?.trim() ?? '').find(Boolean) ?? '';
}

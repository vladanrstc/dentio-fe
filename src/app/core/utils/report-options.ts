import { ReportFormat, ReportFrequency, ReportSettingsItem } from '../models/api.models';

export type ReportSettingsMode = 'company' | 'admin';

export type ReportOption = {
  key: ReportSettingsItem['report'];
  label: string;
  description: string;
  adminOnly?: boolean;
};

export const REPORT_FREQUENCY_OPTIONS: Array<{ value: ReportFrequency; label: string }> = [
  { value: 'off', label: 'Isključeno' },
  { value: 'daily', label: 'Dnevno' },
  { value: 'weekly', label: 'Nedeljno' },
  { value: 'monthly', label: 'Mesečno' },
];

export const REPORT_FORMAT_OPTIONS: Array<{ value: ReportFormat; label: string }> = [
  { value: 'csv', label: 'CSV' },
  { value: 'xlsx', label: 'Excel' },
  { value: 'pdf', label: 'PDF' },
];

export const REPORT_OPTIONS: ReportOption[] = [
  {
    key: 'patients',
    label: 'Pacijenti',
    description: 'Redovan pregled kartoteke i osnovnih podataka pacijenata.',
  },
  {
    key: 'appointments',
    label: 'Termini',
    description: 'Pregled zakazanih termina za izabrani period.',
  },
  {
    key: 'interventions_financial',
    label: 'Intervencije i finansije',
    description: 'Pregled intervencija, naplate i dugovanja.',
  },
  {
    key: 'companies',
    label: 'Kompanije',
    description: 'Platformski pregled ordinacija i aktivnosti kompanija.',
    adminOnly: true,
  },
];

export function reportOptionsForMode(mode: ReportSettingsMode): ReportOption[] {
  return REPORT_OPTIONS.filter((report) => (mode === 'admin' ? report.adminOnly : !report.adminOnly));
}

export function reportOptionLabel(reportKey: string): string {
  return REPORT_OPTIONS.find((report) => report.key === reportKey)?.label ?? reportKey;
}

export function reportOptionDescription(reportKey: string): string {
  return REPORT_OPTIONS.find((report) => report.key === reportKey)?.description ?? '';
}

import { ReportFormat } from '../models/api.models';

export function reportFilename(name: string, format: ReportFormat): string {
  return `${name}.${format}`;
}

export function reportExportErrorMessage(format: ReportFormat, fallbackMessage: string): string {
  if (format === 'xlsx') {
    return 'Excel export trenutno nije dostupan.';
  }

  if (format === 'pdf') {
    return 'PDF export trenutno nije dostupan.';
  }

  return fallbackMessage;
}

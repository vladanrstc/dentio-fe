import { describe, expect, it } from 'vitest';

import { formatDate, formatDateInput, toApiDate, toApiDateTime } from './formatters';

describe('formatDate', () => {
  it('formatira datum kao dd.MM.yyyy.', () => {
    expect(formatDate('2026-05-13')).toBe('13.05.2026.');
  });

  it('formatira datum i vreme kao dd.MM.yyyy. HH:mm', () => {
    expect(formatDate('2026-05-13 09:45')).toBe('13.05.2026. 09:45');
  });

  it('ne prikazuje neispravne datume', () => {
    expect(formatDate('nije datum')).toBe('-');
  });

  it('formatira vrednost za tekstualni date input', () => {
    expect(formatDateInput('2026-05-13')).toBe('13.05.2026.');
  });

  it('konvertuje srpski datum u API datum', () => {
    expect(toApiDate('13.05.2026.')).toBe('2026-05-13');
  });

  it('konvertuje srpski datum i vreme u API datum i vreme', () => {
    expect(toApiDateTime('13.05.2026. 09:45')).toBe('2026-05-13 09:45');
  });
});

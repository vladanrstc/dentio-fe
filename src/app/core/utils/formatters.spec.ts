import { describe, expect, it } from 'vitest';

import {
  formatDate,
  formatDateInput,
  formatSerbianDate,
  formatSerbianDateTime,
  fromIsoDate,
  fromIsoDateTime,
  parseSerbianDate,
  parseSerbianDateTime,
  toApiDate,
  toApiDateTime,
  toIsoDate,
  toIsoDateTime,
} from './formatters';

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

  it('formatira ISO datum za srpski date picker', () => {
    expect(formatSerbianDate('2026-05-13')).toBe('13.05.2026.');
    expect(fromIsoDate('2026-05-13')).toBe('13.05.2026.');
  });

  it('parsira srpski date picker unos u ISO datum', () => {
    expect(parseSerbianDate('13.05.2026.')).toBe('2026-05-13');
    expect(toIsoDate('13.05.2026.')).toBe('2026-05-13');
  });

  it('odbija nepostojece datume', () => {
    expect(parseSerbianDate('31.02.2026.')).toBeNull();
    expect(toIsoDate('2026-02-31')).toBe('');
  });

  it('konvertuje srpski datum i vreme u API datum i vreme', () => {
    expect(toApiDateTime('13.05.2026. 09:45')).toBe('2026-05-13 09:45');
  });

  it('formatira i parsira vrednost za srpski date-time picker', () => {
    expect(formatSerbianDateTime('2026-05-13 09:45')).toBe('13.05.2026. 09:45');
    expect(fromIsoDateTime('2026-05-13 09:45')).toBe('13.05.2026. 09:45');
    expect(parseSerbianDateTime('13.05.2026. 09:45')).toBe('2026-05-13 09:45');
    expect(toIsoDateTime('2026-05-13T09:45')).toBe('2026-05-13 09:45');
  });

  it('odbija neispravno vreme', () => {
    expect(parseSerbianDateTime('13.05.2026. 25:00')).toBeNull();
    expect(toIsoDateTime('2026-05-13 25:00')).toBe('');
  });
});

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, afterEach, beforeEach, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import { ReportsApi } from './reports-api.service';

describe('ReportsApi', () => {
  let service: ReportsApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ReportsApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('kreira request za export pacijenata sa formatom i pretragom', () => {
    service.exportPatients({ format: 'csv', search: 'ana' }).subscribe();

    const request = httpMock.expectOne(
      (req) =>
        req.url === `${environment.apiBaseUrl}/company/reports/patients` &&
        req.params.get('format') === 'csv' &&
        req.params.get('search') === 'ana',
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');

    request.flush(new Blob(['ok']));
  });

  it('kreira request za export termina sa filterima', () => {
    service
      .exportAppointments({
        format: 'csv',
        date_from: '2026-05-01',
        date_to: '2026-05-12',
        user_id: 7,
        type: 'checkup',
      })
      .subscribe();

    const request = httpMock.expectOne(
      (req) =>
        req.url === `${environment.apiBaseUrl}/company/reports/appointments` &&
        req.params.get('format') === 'csv' &&
        req.params.get('date_from') === '2026-05-01' &&
        req.params.get('date_to') === '2026-05-12' &&
        req.params.get('user_id') === '7' &&
        req.params.get('type') === 'checkup',
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');

    request.flush(new Blob(['ok']));
  });

  it('kreira request za export intervencija i finansija sa filterima', () => {
    service
      .exportInterventionsFinancial({
        format: 'pdf',
        date_from: '2026-05-01',
        date_to: '2026-05-12',
        user_id: 3,
        status: 'open',
      })
      .subscribe();

    const request = httpMock.expectOne(
      (req) =>
        req.url === `${environment.apiBaseUrl}/company/reports/interventions-financial` &&
        req.params.get('format') === 'pdf' &&
        req.params.get('date_from') === '2026-05-01' &&
        req.params.get('date_to') === '2026-05-12' &&
        req.params.get('user_id') === '3' &&
        req.params.get('status') === 'open',
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');

    request.flush(new Blob(['ok']));
  });

  it('kreira request za admin export kompanija', () => {
    service.exportCompanies({ format: 'xlsx' }).subscribe();

    const request = httpMock.expectOne(
      (req) =>
        req.url === `${environment.apiBaseUrl}/admin/reports/companies` &&
        req.params.get('format') === 'xlsx',
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');

    request.flush(new Blob(['ok']));
  });

  it('učitava company report subscription podešavanja', () => {
    service.getCompanyReportSubscriptions().subscribe();

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/company/reports/subscriptions`);

    expect(request.request.method).toBe('GET');

    request.flush({ data: [] });
  });

  it('čuva company report subscription podešavanja po report ključu', () => {
    service.saveCompanyReportSubscription('patients', { frequency: 'daily', format: 'csv' }).subscribe();

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/company/reports/subscriptions/patients`);

    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      frequency: 'daily',
      format: 'csv',
    });

    request.flush({ data: { report: 'patients', frequency: 'daily', format: 'csv' } });
  });

  it('učitava admin report subscription podešavanja', () => {
    service.getAdminReportSubscriptions().subscribe();

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/admin/reports/subscriptions`);

    expect(request.request.method).toBe('GET');

    request.flush({ data: [] });
  });

  it('čuva admin report subscription podešavanja po report ključu', () => {
    service.saveAdminReportSubscription('companies', { frequency: 'monthly', format: 'xlsx' }).subscribe();

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/admin/reports/subscriptions/companies`);

    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      frequency: 'monthly',
      format: 'xlsx',
    });

    request.flush({ data: { report: 'companies', frequency: 'monthly', format: 'xlsx' } });
  });
});

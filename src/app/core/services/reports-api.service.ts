import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CollectionResponse,
  ItemResponse,
  ReportParams,
  ReportSettingsItem,
  ReportSubscription,
  ReportSubscriptionPayload,
} from '../models/api.models';

@Injectable({
  providedIn: 'root',
})
export class ReportsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  exportPatients(params: ReportParams): Observable<Blob> {
    return this.getReport('/company/reports/patients', params);
  }

  exportAppointments(params: ReportParams): Observable<Blob> {
    return this.getReport('/company/reports/appointments', params);
  }

  exportInterventionsFinancial(params: ReportParams): Observable<Blob> {
    return this.getReport('/company/reports/interventions-financial', params);
  }

  exportCompanies(params: ReportParams): Observable<Blob> {
    return this.getReport('/admin/reports/companies', params);
  }

  getCompanyReportSubscriptions(): Observable<CollectionResponse<ReportSubscription>> {
    return this.http.get<CollectionResponse<ReportSubscription>>(`${this.baseUrl}/company/reports/subscriptions`);
  }

  saveCompanyReportSubscription(
    reportKey: ReportSettingsItem['report'],
    payload: ReportSubscriptionPayload,
  ): Observable<ItemResponse<ReportSubscription>> {
    return this.http.put<ItemResponse<ReportSubscription>>(
      `${this.baseUrl}/company/reports/subscriptions/${reportKey}`,
      payload,
    );
  }

  getAdminReportSubscriptions(): Observable<CollectionResponse<ReportSubscription>> {
    return this.http.get<CollectionResponse<ReportSubscription>>(`${this.baseUrl}/admin/reports/subscriptions`);
  }

  saveAdminReportSubscription(
    reportKey: ReportSettingsItem['report'],
    payload: ReportSubscriptionPayload,
  ): Observable<ItemResponse<ReportSubscription>> {
    return this.http.put<ItemResponse<ReportSubscription>>(
      `${this.baseUrl}/admin/reports/subscriptions/${reportKey}`,
      payload,
    );
  }

  private getReport(path: string, params: ReportParams): Observable<Blob> {
    return this.http.get(`${this.baseUrl}${path}`, {
      params: this.buildParams(params),
      responseType: 'blob',
    });
  }

  private buildParams(params: ReportParams): HttpParams {
    return Object.entries(params).reduce((httpParams, [key, value]) => {
      if (value === null || value === undefined || value === '') {
        return httpParams;
      }

      return httpParams.set(key, String(value));
    }, new HttpParams());
  }
}

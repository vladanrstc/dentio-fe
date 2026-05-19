import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AcceptInvitePayload,
  AdminCompany,
  AdminCompanyDetail,
  AdminDashboardData,
  AdminDashboardResponse,
  CollectionResponse,
  InviteAcceptanceData,
  InviteCompanyOwnerPayload,
  ItemResponse,
} from '../models/api.models';
import { unwrapItem } from '../utils/http-helpers';

@Injectable({
  providedIn: 'root',
})
export class AdminApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getAdminDashboard(): Observable<AdminDashboardData> {
    return this.http
      .get<AdminDashboardResponse>(`${this.baseUrl}/admin/dashboard`)
      .pipe(map((response): AdminDashboardData => unwrapItem(response)));
  }

  getAdminCompanies(): Observable<CollectionResponse<AdminCompany>> {
    return this.http.get<CollectionResponse<AdminCompany>>(`${this.baseUrl}/admin/companies`);
  }

  getAdminCompany(companyId: number): Observable<AdminCompanyDetail> {
    return this.http
      .get<ItemResponse<AdminCompanyDetail>>(`${this.baseUrl}/admin/companies/${companyId}`)
      .pipe(map((response): AdminCompanyDetail => unwrapItem(response)));
  }

  deleteAdminCompany(companyId: number): Observable<{ data: { deleted: boolean; id: number } }> {
    return this.http.delete<{ data: { deleted: boolean; id: number } }>(
      `${this.baseUrl}/admin/companies/${companyId}`,
    );
  }

  deleteAdminInvite(inviteId: number): Observable<{ data: { deleted: boolean; id: number } }> {
    return this.http.delete<{ data: { deleted: boolean; id: number } }>(
      `${this.baseUrl}/admin/invites/${inviteId}`,
    );
  }

  inviteCompanyOwner(payload: InviteCompanyOwnerPayload): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/admin/invite-owner`, payload);
  }

  getInviteAcceptance(token: string): Observable<InviteAcceptanceData> {
    return this.http
      .get<ItemResponse<InviteAcceptanceData>>(`${this.baseUrl}/invites/accept/${token}`)
      .pipe(map((response): InviteAcceptanceData => unwrapItem(response)));
  }

  acceptInvite(token: string, payload: AcceptInvitePayload): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/invites/accept/${token}`, payload);
  }
}

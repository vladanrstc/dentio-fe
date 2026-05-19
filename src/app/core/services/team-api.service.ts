import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CollectionResponse,
  CompanyInvite,
  CompanyTeamMember,
  InviteTeamMemberPayload,
} from '../models/api.models';

@Injectable({
  providedIn: 'root',
})
export class TeamApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getCompanyTeam(): Observable<CollectionResponse<CompanyTeamMember>> {
    return this.http.get<CollectionResponse<CompanyTeamMember>>(`${this.baseUrl}/company/team`);
  }

  deleteTeamMember(userId: number): Observable<{ data: { deleted: boolean; id: number } }> {
    return this.http.delete<{ data: { deleted: boolean; id: number } }>(
      `${this.baseUrl}/company/team/${userId}`,
    );
  }

  getCompanyInvites(): Observable<CollectionResponse<CompanyInvite>> {
    return this.http.get<CollectionResponse<CompanyInvite>>(`${this.baseUrl}/company/invites`);
  }

  deleteCompanyInvite(inviteId: number): Observable<{ data: { deleted: boolean; id: number } }> {
    return this.http.delete<{ data: { deleted: boolean; id: number } }>(
      `${this.baseUrl}/company/invites/${inviteId}`,
    );
  }

  inviteTeamMember(payload: InviteTeamMemberPayload): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/company/invites`, payload);
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PatientPortalInviteData, PatientPortalInviteResponse } from '../models/api.models';
import { unwrapItem } from '../utils/http-helpers';

@Injectable({
  providedIn: 'root',
})
export class PatientPortalInviteApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  sendPatientPortalInvite(email: string): Observable<PatientPortalInviteData> {
    return this.http
      .post<PatientPortalInviteResponse>(`${this.baseUrl}/company/patients/portal-invites`, { email })
      .pipe(map((response): PatientPortalInviteData => unwrapItem(response)));
  }
}

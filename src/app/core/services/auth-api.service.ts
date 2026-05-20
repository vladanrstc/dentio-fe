import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthUser, ClientMeResponse, ClientPatient, LoginResponse, MeResponse } from '../models/api.models';
import { unwrapItem } from '../utils/http-helpers';

@Injectable({
  providedIn: 'root',
})
export class AuthApi {
  private readonly http = inject(HttpClient);
  readonly baseUrl = environment.apiBaseUrl;

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, { email, password });
  }

  me(): Observable<AuthUser> {
    return this.http
      .get<MeResponse>(`${this.baseUrl}/me`)
      .pipe(map((response): AuthUser => this.extractCurrentUser(response)));
  }

  clientMe(): Observable<ClientPatient> {
    return this.http
      .get<ClientMeResponse>(`${this.baseUrl}/client/me`)
      .pipe(map((response): ClientPatient => unwrapItem(response)));
  }

  logout(): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/logout`, {});
  }

  clientLogout(): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/client/logout`, {});
  }

  private extractCurrentUser(response: MeResponse): AuthUser {
    if (this.isAuthUser(response)) {
      return response;
    }

    if ('user' in response) {
      return response.user;
    }

    const data = response.data;

    if (this.isAuthUser(data)) {
      return data;
    }

    return data.user;
  }

  private isAuthUser(value: AuthUser | { user: AuthUser } | MeResponse): value is AuthUser {
    return 'email' in value && 'role' in value;
  }
}

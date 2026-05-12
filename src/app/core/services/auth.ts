import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';

import { Api } from './api';

export type AuthUser = {
  id: number;
  company_id: number | null;
  name: string;
  email: string;
  role: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly api = inject(Api);

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.api.baseUrl}/login`, { email, password }).pipe(
      tap((response) => {
        localStorage.setItem('dentio_token', response.token);
        localStorage.setItem('dentio_user', JSON.stringify(response.user));
      }),
    );
  }

  logout(): Observable<unknown> {
    return this.http.post(`${this.api.baseUrl}/logout`, {}).pipe(
      finalize(() => {
        this.clearSession();
      }),
    );
  }

  clearSession(): void {
    localStorage.removeItem('dentio_token');
    localStorage.removeItem('dentio_user');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('dentio_token');
  }

  currentUser(): AuthUser | null {
    const userJson = localStorage.getItem('dentio_user');

    if (!userJson) {
      return null;
    }

    try {
      return JSON.parse(userJson) as AuthUser;
    } catch {
      return null;
    }
  }

  isPlatformAdmin(): boolean {
    return this.currentUser()?.role === 'platform_admin';
  }

  isCompanyUser(): boolean {
    const role = this.currentUser()?.role;
    return role === 'company_admin' || role === 'dentist' || role === 'nurse';
  }

  homePathFor(user: AuthUser | null = this.currentUser()): string {
    return user?.role === 'platform_admin' ? '/admin/dashboard' : '/dashboard';
  }
}

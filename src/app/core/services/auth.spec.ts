import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthUser } from '../models/api.models';
import { AuthStore } from '../state/auth.store';
import { Auth } from './auth';
import { AuthApi } from './auth-api.service';

const user: AuthUser = {
  id: 1,
  company_id: 10,
  name: 'Dejan Dent',
  email: 'owner@test.rs',
  role: 'company_admin',
};

describe('Auth', () => {
  let service: Auth;
  let authApi: { login: ReturnType<typeof vi.fn> };
  let authStore: {
    clearAuth: ReturnType<typeof vi.fn>;
    setAuth: ReturnType<typeof vi.fn>;
    setToken: ReturnType<typeof vi.fn>;
    checkAuth: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
    isAuthenticated: ReturnType<typeof vi.fn>;
    user: ReturnType<typeof vi.fn>;
    isPlatformAdmin: ReturnType<typeof vi.fn>;
    isCompanyUser: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authApi = {
      login: vi.fn(() => of({ token: 'token', user })),
    };
    authStore = {
      clearAuth: vi.fn(),
      setAuth: vi.fn(),
      setToken: vi.fn(),
      checkAuth: vi.fn(() => of(user)),
      logout: vi.fn(() => of(null)),
      isAuthenticated: vi.fn(() => true),
      user: vi.fn(() => user),
      isPlatformAdmin: vi.fn(() => false),
      isCompanyUser: vi.fn(() => true),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthApi, useValue: authApi },
        { provide: AuthStore, useValue: authStore },
      ],
    });

    service = TestBed.inject(Auth);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('login upisuje novu sesiju u AuthStore', () => {
    service.login('owner@test.rs', 'Password123!').subscribe();

    expect(authStore.clearAuth).not.toHaveBeenCalled();
    expect(authApi.login).toHaveBeenCalledWith('owner@test.rs', 'Password123!');
    expect(authStore.setAuth).toHaveBeenCalledWith('token', user);
  });

  it('ako login ne vrati user-a, proverava /me preko AuthStore.checkAuth', () => {
    authApi.login.mockReturnValue(of({ token: 'token' }));

    service.login('owner@test.rs', 'Password123!').subscribe((response) => {
      expect(response.user).toEqual(user);
    });

    expect(authStore.setToken).toHaveBeenCalledWith('token');
    expect(authStore.checkAuth).toHaveBeenCalled();
  });

  it('logout delegira AuthStore-u', () => {
    service.logout().subscribe();

    expect(authStore.logout).toHaveBeenCalled();
  });
});

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Observable, firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthStore } from '../state/auth.store';
import { adminGuard } from './admin.guard';
import { companyGuard } from './company.guard';

describe('role guards', () => {
  let authStore: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    hasUser: ReturnType<typeof vi.fn>;
    isPlatformAdmin: ReturnType<typeof vi.fn>;
    isCompanyUser: ReturnType<typeof vi.fn>;
    checkAuth: ReturnType<typeof vi.fn>;
  };
  let router: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authStore = {
      isAuthenticated: vi.fn(() => true),
      hasUser: vi.fn(() => true),
      isPlatformAdmin: vi.fn(() => false),
      isCompanyUser: vi.fn(() => true),
      checkAuth: vi.fn(() => of({ id: 1 })),
    };
    router = {
      createUrlTree: vi.fn((commands: string[]) => ({ commands })),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: authStore },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('admin guard dozvoljava platform admina', () => {
    authStore.isPlatformAdmin.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));

    expect(result).toBe(true);
  });

  it('admin guard vraca company korisnika na dashboard', () => {
    authStore.isPlatformAdmin.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));

    expect(result).toEqual({ commands: ['/dashboard'] });
  });

  it('company guard platform admina salje na admin dashboard', () => {
    authStore.isPlatformAdmin.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() => companyGuard({} as never, {} as never));

    expect(result).toEqual({ commands: ['/admin/dashboard'] });
  });

  it('company guard dozvoljava company korisnike', () => {
    authStore.isPlatformAdmin.mockReturnValue(false);
    authStore.isCompanyUser.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() => companyGuard({} as never, {} as never));

    expect(result).toBe(true);
  });

  it('guard salje neulogovanog korisnika na login', () => {
    authStore.isAuthenticated.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() => companyGuard({} as never, {} as never));

    expect(result).toEqual({ commands: ['/login'] });
  });

  it('company guard ceka /me proveru ako token postoji, ali user jos nije ucitan', async () => {
    authStore.hasUser.mockReturnValue(false);
    authStore.checkAuth.mockReturnValue(of({ id: 1 }));
    authStore.isCompanyUser.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() => companyGuard({} as never, {} as never));

    await expect(firstValueFrom(result as Observable<unknown>)).resolves.toBe(true);
    expect(authStore.checkAuth).toHaveBeenCalled();
  });

  it('admin guard ceka /me proveru ako token postoji, ali user jos nije ucitan', async () => {
    authStore.hasUser.mockReturnValue(false);
    authStore.checkAuth.mockReturnValue(of({ id: 1 }));
    authStore.isPlatformAdmin.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));

    await expect(firstValueFrom(result as Observable<unknown>)).resolves.toBe(true);
    expect(authStore.checkAuth).toHaveBeenCalled();
  });
});

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Auth } from '../services/auth';
import { adminGuard } from './admin.guard';
import { companyGuard } from './company.guard';

describe('role guards', () => {
  let auth: {
    isLoggedIn: ReturnType<typeof vi.fn>;
    isPlatformAdmin: ReturnType<typeof vi.fn>;
    isCompanyUser: ReturnType<typeof vi.fn>;
  };
  let router: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    auth = {
      isLoggedIn: vi.fn(() => true),
      isPlatformAdmin: vi.fn(() => false),
      isCompanyUser: vi.fn(() => true),
    };
    router = {
      createUrlTree: vi.fn((commands: string[]) => ({ commands })),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('admin guard dozvoljava platform admina', () => {
    auth.isPlatformAdmin.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));

    expect(result).toBe(true);
  });

  it('admin guard vraća company korisnika na dashboard', () => {
    auth.isPlatformAdmin.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));

    expect(result).toEqual({ commands: ['/dashboard'] });
  });

  it('company guard platform admina šalje na admin dashboard', () => {
    auth.isPlatformAdmin.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() => companyGuard({} as never, {} as never));

    expect(result).toEqual({ commands: ['/admin/dashboard'] });
  });

  it('company guard dozvoljava company korisnike', () => {
    auth.isPlatformAdmin.mockReturnValue(false);
    auth.isCompanyUser.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() => companyGuard({} as never, {} as never));

    expect(result).toBe(true);
  });

  it('guard šalje neulogovanog korisnika na login', () => {
    auth.isLoggedIn.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() => companyGuard({} as never, {} as never));

    expect(result).toEqual({ commands: ['/login'] });
  });
});

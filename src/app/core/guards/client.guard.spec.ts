import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Observable, firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthRole } from '../models/auth.models';
import { AuthStore } from '../state/auth.store';
import { clientGuard } from './client.guard';

describe('clientGuard', () => {
  let authStore: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    hasUser: ReturnType<typeof vi.fn>;
    role: ReturnType<typeof vi.fn>;
    checkAuth: ReturnType<typeof vi.fn>;
  };
  let router: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authStore = {
      isAuthenticated: vi.fn(() => true),
      hasUser: vi.fn(() => true),
      role: vi.fn(() => AuthRole.Client),
      checkAuth: vi.fn(() => of({ id: 7 })),
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

  it('dozvoljava ulogovanog pacijenta', () => {
    const result = TestBed.runInInjectionContext(() => clientGuard({} as never, {} as never));

    expect(result).toBe(true);
  });

  it('neulogovanog pacijenta salje na login', () => {
    authStore.isAuthenticated.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() => clientGuard({} as never, {} as never));

    expect(result).toEqual({ commands: ['/login'] });
  });

  it('ceka /me proveru ako token postoji, ali user jos nije ucitan', async () => {
    authStore.hasUser.mockReturnValueOnce(false).mockReturnValue(true);
    authStore.checkAuth.mockReturnValue(of({ id: 7 }));

    const result = TestBed.runInInjectionContext(() => clientGuard({} as never, {} as never));

    await expect(firstValueFrom(result as Observable<unknown>)).resolves.toBe(true);
    expect(authStore.checkAuth).toHaveBeenCalled();
  });

  it('company korisnika ne pusta na client rute', () => {
    authStore.role.mockReturnValue(AuthRole.CompanyAdmin);

    const result = TestBed.runInInjectionContext(() => clientGuard({} as never, {} as never));

    expect(result).toEqual({ commands: ['/dashboard'] });
  });
});

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Observable, firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ClientAuthStore } from '../state/client-auth.store';
import { clientGuard } from './client.guard';

describe('clientGuard', () => {
  let clientAuthStore: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    hasPatient: ReturnType<typeof vi.fn>;
    checkAuth: ReturnType<typeof vi.fn>;
  };
  let router: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    clientAuthStore = {
      isAuthenticated: vi.fn(() => true),
      hasPatient: vi.fn(() => true),
      checkAuth: vi.fn(() => of({ id: 7 })),
    };
    router = {
      createUrlTree: vi.fn((commands: string[]) => ({ commands })),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ClientAuthStore, useValue: clientAuthStore },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('dozvoljava ulogovanog pacijenta', () => {
    const result = TestBed.runInInjectionContext(() => clientGuard({} as never, {} as never));

    expect(result).toBe(true);
  });

  it('neulogovanog pacijenta salje na client login', () => {
    clientAuthStore.isAuthenticated.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() => clientGuard({} as never, {} as never));

    expect(result).toEqual({ commands: ['/client/login'] });
  });

  it('ceka /client/me proveru ako token postoji, ali pacijent nije ucitan', async () => {
    clientAuthStore.hasPatient.mockReturnValueOnce(false).mockReturnValue(true);
    clientAuthStore.checkAuth.mockReturnValue(of({ id: 7 }));

    const result = TestBed.runInInjectionContext(() => clientGuard({} as never, {} as never));

    await expect(firstValueFrom(result as Observable<unknown>)).resolves.toBe(true);
    expect(clientAuthStore.checkAuth).toHaveBeenCalled();
  });
});

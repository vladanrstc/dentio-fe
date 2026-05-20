import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ClientPortalApi } from '../../core/services/client-portal-api.service';
import { AuthStore } from '../../core/state/auth.store';
import { ClientLogin } from './client-login.component';

describe('ClientLogin', () => {
  let fixture: ComponentFixture<ClientLogin>;
  let clientApi: { login: ReturnType<typeof vi.fn> };
  let authStore: { setClientAuth: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    clientApi = {
      login: vi.fn(() =>
        of({
          data: {
            token: 'client-token',
            patient: {
              id: 7,
              first_name: 'Petar',
              last_name: 'Petrovic',
              email: 'pacijent@test.rs',
            },
          },
        }),
      ),
    };
    authStore = {
      setClientAuth: vi.fn(),
    };
    router = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ClientLogin],
      providers: [
        { provide: ClientPortalApi, useValue: clientApi },
        { provide: AuthStore, useValue: authStore },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientLogin);
    fixture.detectChanges();
  });

  it('salje client login i upisuje client store', () => {
    setInput('input[name="email"]', 'pacijent@test.rs');
    setInput('input[name="password"]', 'Password123!');

    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit');
    fixture.detectChanges();

    expect(clientApi.login).toHaveBeenCalledWith('pacijent@test.rs', 'Password123!');
    expect(authStore.setClientAuth).toHaveBeenCalledWith(
      'client-token',
      expect.objectContaining({ id: 7, email: 'pacijent@test.rs' }),
    );
    expect(router.navigate).toHaveBeenCalledWith(['/client/dashboard']);
  });

  it('prikazuje jasnu gresku za neuspesan login', () => {
    clientApi.login.mockReturnValue(throwError(() => ({ status: 401 })));

    setInput('input[name="email"]', 'pacijent@test.rs');
    setInput('input[name="password"]', 'pogresno');

    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit');
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Email ili lozinka nisu ispravni.');
  });

  function setInput(selector: string, value: string): void {
    const input = fixture.debugElement.query(By.css(selector)).nativeElement as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }
});

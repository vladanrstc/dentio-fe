import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ClientPortalApi } from '../../core/services/client-portal-api.service';
import { ClientSetupPassword } from './client-setup-password.component';

describe('ClientSetupPassword', () => {
  let fixture: ComponentFixture<ClientSetupPassword>;
  let clientApi: {
    showClientInvite: ReturnType<typeof vi.fn>;
    acceptClientInvite: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    clientApi = {
      showClientInvite: vi.fn(() =>
        of({
          id: 4,
          email: 'pacijent@test.rs',
          expires_at: '2026-05-20T10:00:00+02:00',
          valid: true,
          expired: false,
          accepted: false,
          revoked: false,
        }),
      ),
      acceptClientInvite: vi.fn(() =>
        of({
          data: {
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
    router = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ClientSetupPassword],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'token' ? 'token-123' : null),
              },
            },
          },
        },
        { provide: ClientPortalApi, useValue: clientApi },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientSetupPassword);
    fixture.detectChanges();
  });

  it('ucitava pozivnicu i prikazuje formu za lozinku', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(clientApi.showClientInvite).toHaveBeenCalledWith('token-123');
    expect(text).toContain('pacijent@test.rs');
    expect(text).toContain('Postavi lozinku');
  });

  it('validira poklapanje lozinke i potvrde', () => {
    setInput('input[formControlName="password"]', 'Password123!');
    setInput('input[formControlName="password_confirmation"]', 'Password456!');

    submitForm();
    fixture.detectChanges();

    expect(clientApi.acceptClientInvite).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Lozinka i potvrda lozinke se ne poklapaju.');
  });

  it('uspesno postavljanje lozinke preusmerava na client login', () => {
    setInput('input[formControlName="password"]', 'Password123!');
    setInput('input[formControlName="password_confirmation"]', 'Password123!');

    submitForm();

    expect(clientApi.acceptClientInvite).toHaveBeenCalledWith('token-123', 'Password123!', 'Password123!');
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { activated: '1' },
    });
  });

  it('submit error ostaje na strani i prikazuje gresku', () => {
    clientApi.acceptClientInvite.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: {
              errors: {
                password: ['Lozinka mora imati najmanje 8 karaktera.'],
              },
            },
          }),
      ),
    );

    setInput('input[formControlName="password"]', 'Password123!');
    setInput('input[formControlName="password_confirmation"]', 'Password123!');

    submitForm();
    fixture.detectChanges();

    expect(router.navigate).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Lozinka mora imati najmanje 8 karaktera.');
  });

  it('bez tokena prikazuje gresku', async () => {
    TestBed.resetTestingModule();
    clientApi.showClientInvite.mockClear();

    await TestBed.configureTestingModule({
      imports: [ClientSetupPassword],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => null,
              },
            },
          },
        },
        { provide: ClientPortalApi, useValue: clientApi },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    const missingTokenFixture = TestBed.createComponent(ClientSetupPassword);
    missingTokenFixture.detectChanges();

    expect(clientApi.showClientInvite).not.toHaveBeenCalled();
    expect((missingTokenFixture.nativeElement as HTMLElement).textContent).toContain('Pozivnica nije pronađena.');
  });

  function setInput(selector: string, value: string): void {
    const input = fixture.debugElement.query(By.css(selector)).nativeElement as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function submitForm(): void {
    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit');
  }
});

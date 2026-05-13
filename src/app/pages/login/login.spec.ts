import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Auth } from '../../core/services/auth';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let auth: { login: ReturnType<typeof vi.fn>; homePathFor: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    auth = {
      login: vi.fn(() =>
        of({
          token: 'token',
          user: { id: 1, company_id: 10, name: 'Dejan Dent', email: 'owner@test.rs', role: 'company_admin' },
        }),
      ),
      homePathFor: vi.fn(() => '/dashboard'),
    };
    router = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: Auth, useValue: auth },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('forma je prazna i submit salje email i lozinku', async () => {
    const inputs = fixture.debugElement.queryAll(By.css('input'));

    expect((inputs[0].nativeElement as HTMLInputElement).value).toBe('');
    expect((inputs[1].nativeElement as HTMLInputElement).value).toBe('');

    component.email = 'owner@test.rs';
    component.password = 'Password123!';
    fixture.detectChanges();

    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit');
    await fixture.whenStable();

    expect(auth.login).toHaveBeenCalledWith('owner@test.rs', 'Password123!');
    expect(auth.homePathFor).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('prikazuje gresku kada login ne uspe', async () => {
    auth.login.mockReturnValue(throwError(() => new Error('invalid')));

    component.email = 'wrong@test.rs';
    component.password = 'bad';
    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit');
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Email ili lozinka nisu ispravni.');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('prikazuje validacione greske za prazna polja', async () => {
    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit');
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(auth.login).not.toHaveBeenCalled();
    expect(text).toContain('Unesite email i lozinku.');
    expect(text).toContain('Unesite validan email.');
    expect(text).toContain('Unesite lozinku.');
  });
});

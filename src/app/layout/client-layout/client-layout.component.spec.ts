import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthStore } from '../../core/state/auth.store';
import { ClientLayout } from './client-layout.component';

describe('ClientLayout', () => {
  let fixture: ComponentFixture<ClientLayout>;
  let authStore: {
    principalName: ReturnType<typeof vi.fn>;
    loading: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authStore = {
      principalName: vi.fn(() => 'Petar Petrovic'),
      loading: vi.fn(() => false),
      logout: vi.fn(() => of(null)),
    };
    router = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ClientLayout],
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: authStore },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientLayout);
    fixture.detectChanges();
  });

  it('prikazuje client layout bez company/admin navigacije', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Portal pacijenta');
    expect(text).toContain('Petar Petrovic');
    expect(text).not.toContain('Pacijenti');
    expect(text).not.toContain('Kompanije');
  });

  it('logout cisti client sesiju i vraca na client login', () => {
    const logoutButton = fixture.debugElement
      .queryAll(By.css('button'))
      .find((button) => button.nativeElement.textContent.includes('Odjavi se'));

    logoutButton?.nativeElement.click();

    expect(authStore.logout).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledWith(['/client/login']);
  });
});

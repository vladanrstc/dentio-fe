import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Auth } from '../../core/services/auth';
import { TeamApi } from '../../core/services/team-api.service';
import { TeamInvites } from './team-invites';

describe('TeamInvites', () => {
  let fixture: ComponentFixture<TeamInvites>;
  let teamApi: {
    getCompanyInvites: ReturnType<typeof vi.fn>;
    inviteTeamMember: ReturnType<typeof vi.fn>;
    deleteCompanyInvite: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    teamApi = {
      getCompanyInvites: vi.fn(() =>
        of([
          {
            id: 11,
            email: 'zubar@test.rs',
            role: 'dentist',
            status: 'pending',
            created_at: '2026-05-12',
          },
        ]),
      ),
      inviteTeamMember: vi.fn(() => of({})),
      deleteCompanyInvite: vi.fn(() => of({ data: { deleted: true, id: 11 } })),
    };

    await TestBed.configureTestingModule({
      imports: [TeamInvites],
      providers: [
        { provide: TeamApi, useValue: teamApi },
        {
          provide: Auth,
          useValue: {
            currentUser: () => ({ id: 1, company_id: 1, name: 'Owner', email: 'owner@test.rs', role: 'company_admin' }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamInvites);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('učitava pozivnice i prikazuje ih u listi', () => {
    expect(teamApi.getCompanyInvites).toHaveBeenCalledOnce();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('zubar@test.rs');
  });

  it('šalje novu pozivnicu i osvežava listu', () => {
    const component = fixture.componentInstance as unknown as {
      inviteForm: { patchValue(value: unknown): void };
      submit(): void;
    };

    component.inviteForm.patchValue({ email: 'sestra@test.rs', role: 'nurse' });
    component.submit();

    expect(teamApi.inviteTeamMember).toHaveBeenCalledWith({ email: 'sestra@test.rs', role: 'nurse' });
    expect(teamApi.getCompanyInvites).toHaveBeenCalledTimes(2);
  });

  it('prikazuje validation error kada slanje pozivnice ne uspe', () => {
    teamApi.inviteTeamMember.mockReturnValue(
      throwError(() => ({
        error: { errors: { email: ['Email je već iskorišćen.'] } },
      })),
    );
    const component = fixture.componentInstance as unknown as {
      inviteForm: { patchValue(value: unknown): void };
      submit(): void;
    };

    component.inviteForm.patchValue({ email: 'zubar@test.rs', role: 'dentist' });
    component.submit();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Pozivnica nije poslata.');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Email je već iskorišćen.');
  });

  it('revoke briše pending pozivnicu iz liste', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const deleteButton = fixture.debugElement
      .queryAll(By.css('button'))
      .find((button) => button.nativeElement.textContent.includes('Obri'));

    deleteButton?.nativeElement.click();
    fixture.detectChanges();

    expect(teamApi.deleteCompanyInvite).toHaveBeenCalledWith(11);
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('zubar@test.rs');

    confirmSpy.mockRestore();
  });

  it('prikazuje error kada revoke ne uspe', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    teamApi.deleteCompanyInvite.mockReturnValue(throwError(() => new Error('fail')));
    const deleteButton = fixture.debugElement
      .queryAll(By.css('button'))
      .find((button) => button.nativeElement.textContent.includes('Obri'));

    deleteButton?.nativeElement.click();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Brisanje pozivnice nije uspelo.');
  });
});

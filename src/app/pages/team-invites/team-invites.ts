import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CompanyInvite } from '../../core/models/api.models';
import { TeamApi } from '../../core/services/team-api.service';
import { AuthStore } from '../../core/state/auth.store';
import { formatDate } from '../../core/utils/formatters';
import { extractValidationErrors, unwrapCollection } from '../../core/utils/http-helpers';
import { roleLabel, statusLabel } from '../../core/utils/role-label';

@Component({
  selector: 'app-team-invites',
  imports: [ReactiveFormsModule],
  templateUrl: './team-invites.html',
  styleUrl: './team-invites.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamInvites {
  private readonly teamApi = inject(TeamApi);
  private readonly authStore = inject(AuthStore);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly invites = signal<CompanyInvite[]>([]);
  protected readonly loading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly validationErrors = signal<string[]>([]);
  protected readonly canInvite = this.authStore.isCompanyAdmin;
  protected readonly formatRole = roleLabel;
  protected readonly formatStatus = statusLabel;
  protected readonly formatDate = formatDate;

  protected readonly inviteForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['dentist', [Validators.required]],
  });

  constructor() {
    this.loadInvites();
  }

  protected submit(): void {
    this.success.set('');
    this.error.set('');
    this.validationErrors.set([]);

    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    const value = this.inviteForm.getRawValue();
    this.submitting.set(true);

    this.teamApi
      .inviteTeamMember({
        email: value.email ?? '',
        role: value.role as 'dentist' | 'nurse',
      })
      .subscribe({
        next: () => {
          this.success.set('Pozivnica je poslata.');
          this.submitting.set(false);
          this.inviteForm.reset({ email: '', role: 'dentist' });
          this.loadInvites(false);
        },
        error: (error: HttpErrorResponse) => {
          this.error.set('Pozivnica nije poslata.');
          this.validationErrors.set(extractValidationErrors(error));
          this.submitting.set(false);
        },
      });
  }

  protected fieldInvalid(fieldName: keyof typeof this.inviteForm.controls): boolean {
    const field = this.inviteForm.controls[fieldName];
    return field.invalid && (field.dirty || field.touched);
  }

  protected canDeleteInvite(invite: CompanyInvite): boolean {
    return invite.status === 'pending' || invite.status === 'expired';
  }

  protected deleteInvite(invite: CompanyInvite): void {
    const confirmed = confirm(`Da li ste sigurni da želite da obrišete pozivnicu za ${invite.email}?`);

    if (!confirmed) {
      return;
    }

    this.success.set('');
    this.error.set('');
    this.validationErrors.set([]);

    this.teamApi.deleteCompanyInvite(invite.id).subscribe({
      next: () => {
        this.success.set('Pozivnica je obrisana.');
        this.invites.update((invites) => invites.filter((item) => item.id !== invite.id));
      },
      error: () => {
        this.error.set('Brisanje pozivnice nije uspelo.');
      },
    });
  }

  private loadInvites(showLoading = true): void {
    if (showLoading) {
      this.loading.set(true);
    }

    this.teamApi.getCompanyInvites().subscribe({
      next: (response) => {
        this.invites.set(unwrapCollection(response));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Pozivnice trenutno nisu dostupne.');
        this.loading.set(false);
      },
    });
  }
}

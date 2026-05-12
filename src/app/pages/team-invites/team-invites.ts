import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Auth } from '../../core/services/auth';
import { Api, CollectionResponse, CompanyInvite } from '../../core/services/api';
import { roleLabel, statusLabel } from '../../core/utils/role-label';

@Component({
  selector: 'app-team-invites',
  imports: [ReactiveFormsModule],
  templateUrl: './team-invites.html',
  styleUrl: './team-invites.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamInvites {
  private readonly api = inject(Api);
  private readonly auth = inject(Auth);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly invites = signal<CompanyInvite[]>([]);
  protected readonly loading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly validationErrors = signal<string[]>([]);
  protected readonly canInvite = this.auth.currentUser()?.role === 'company_admin';
  protected readonly formatRole = roleLabel;
  protected readonly formatStatus = statusLabel;

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

    this.api
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
          this.validationErrors.set(this.extractValidationErrors(error));
          this.submitting.set(false);
        },
      });
  }

  protected fieldInvalid(fieldName: keyof typeof this.inviteForm.controls): boolean {
    const field = this.inviteForm.controls[fieldName];
    return field.invalid && (field.dirty || field.touched);
  }

  protected formatDate(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    return new Intl.DateTimeFormat('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: value.includes('T') ? '2-digit' : undefined,
      minute: value.includes('T') ? '2-digit' : undefined,
    }).format(new Date(value));
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

    this.api.deleteCompanyInvite(invite.id).subscribe({
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

    this.api.getCompanyInvites().subscribe({
      next: (response) => {
        this.invites.set(this.unwrapCollection(response));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Pozivnice trenutno nisu dostupne.');
        this.loading.set(false);
      },
    });
  }

  private extractValidationErrors(error: HttpErrorResponse): string[] {
    const response = error.error as { message?: string; errors?: Record<string, string[]> } | null;

    if (!response?.errors) {
      return response?.message ? [response.message] : [];
    }

    return Object.values(response.errors).flat();
  }

  private unwrapCollection<T>(response: CollectionResponse<T>): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }

    return response.data.data;
  }
}

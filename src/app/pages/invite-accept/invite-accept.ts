import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AcceptInvitePayload, Api, InviteAcceptanceData } from '../../core/services/api';
import { roleLabel } from '../../core/utils/role-label';

@Component({
  selector: 'app-invite-accept',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './invite-accept.html',
  styleUrl: './invite-accept.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteAccept {
  private readonly api = inject(Api);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly token = this.route.snapshot.paramMap.get('token') ?? '';

  protected readonly invite = signal<InviteAcceptanceData | null>(null);
  protected readonly loading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly success = signal('');
  protected readonly error = signal('');
  protected readonly validationErrors = signal<string[]>([]);
  protected readonly roleLabel = roleLabel;

  protected readonly canActivateInvite = computed(() => {
    const invite = this.invite();
    return !!invite && invite.valid && !invite.accepted && !invite.expired;
  });

  protected readonly activationForm = this.formBuilder.group({
    first_name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', [Validators.required]],
    company_name: [''],
    company_address: [''],
    company_phone: [''],
  });

  constructor() {
    this.loadInvite();
  }

  protected submit(): void {
    this.success.set('');
    this.error.set('');
    this.validationErrors.set([]);

    if (this.activationForm.invalid || !this.canActivateInvite()) {
      this.activationForm.markAllAsTouched();
      return;
    }

    const invite = this.invite();
    const value = this.activationForm.getRawValue();
    const payload: AcceptInvitePayload = {
      first_name: (value.first_name ?? '').trim(),
      last_name: (value.last_name ?? '').trim(),
      phone: this.emptyToNull(value.phone),
      password: value.password ?? '',
      password_confirmation: value.password_confirmation ?? '',
    };

    if (invite?.requires_company) {
      payload.company_name = (value.company_name ?? '').trim();
      payload.company_address = (value.company_address ?? '').trim();
      payload.company_phone = this.emptyToNull(value.company_phone);
    }

    this.submitting.set(true);

    this.api.acceptInvite(this.token, payload).subscribe({
      next: () => {
        this.success.set('Nalog je uspešno aktiviran.');
        this.submitting.set(false);
        this.activationForm.disable();
      },
      error: (error: HttpErrorResponse) => {
        this.error.set('Aktivacija naloga nije uspela.');
        this.validationErrors.set(this.extractValidationErrors(error));
        this.submitting.set(false);
      },
    });
  }

  protected fieldInvalid(fieldName: keyof typeof this.activationForm.controls): boolean {
    const field = this.activationForm.controls[fieldName];
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

  private loadInvite(): void {
    if (!this.token) {
      this.error.set('Pozivnica nije pronađena.');
      this.loading.set(false);
      return;
    }

    this.api.getInviteAcceptance(this.token).subscribe({
      next: (invite) => {
        this.invite.set(invite);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Pozivnica nije dostupna za aktivaciju.');
        this.loading.set(false);
      },
    });
  }

  private emptyToNull(value: string | null | undefined): string | null {
    const trimmedValue = value?.trim() ?? '';
    return trimmedValue || null;
  }

  private extractValidationErrors(error: HttpErrorResponse): string[] {
    const response = error.error as { message?: string; errors?: Record<string, string[]> } | null;

    if (!response?.errors) {
      return response?.message ? [response.message] : [];
    }

    return Object.values(response.errors).flat();
  }
}

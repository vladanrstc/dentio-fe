import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { PatientPortalInviteData } from '../../core/models/api.models';
import { ClientPortalApi } from '../../core/services/client-portal-api.service';
import { formatDate } from '../../core/utils/formatters';
import { extractValidationErrors } from '../../core/utils/http-helpers';

@Component({
  selector: 'app-client-setup-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './client-setup-password.component.html',
  styleUrl: './client-setup-password.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientSetupPassword {
  private readonly clientApi = inject(ClientPortalApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  protected readonly invite = signal<PatientPortalInviteData | null>(null);
  protected readonly loading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly error = signal('');
  protected readonly validationErrors = signal<string[]>([]);
  protected readonly formatDate = formatDate;

  protected readonly canSetPassword = computed(() => {
    const invite = this.invite();
    return !!invite && invite.valid && !invite.expired && !invite.accepted && !invite.revoked;
  });

  protected readonly passwordForm = this.formBuilder.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', [Validators.required]],
  });

  constructor() {
    this.loadInvite();
  }

  protected submit(): void {
    this.error.set('');
    this.validationErrors.set([]);

    if (this.passwordForm.invalid || !this.canSetPassword()) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const value = this.passwordForm.getRawValue();

    if (value.password !== value.password_confirmation) {
      this.error.set('Lozinka i potvrda lozinke se ne poklapaju.');
      return;
    }

    this.submitting.set(true);

    this.clientApi.acceptClientInvite(this.token, value.password ?? '', value.password_confirmation ?? '').subscribe({
      next: () => {
        this.router.navigate(['/client/login'], {
          queryParams: { activated: '1' },
        });
      },
      error: (error: HttpErrorResponse) => {
        const validationErrors = extractValidationErrors(error);
        this.error.set(validationErrors[0] || 'Postavljanje lozinke nije uspelo.');
        this.validationErrors.set(validationErrors);
        this.submitting.set(false);
      },
    });
  }

  protected fieldInvalid(fieldName: keyof typeof this.passwordForm.controls): boolean {
    const field = this.passwordForm.controls[fieldName];
    return field.invalid && (field.dirty || field.touched);
  }

  private loadInvite(): void {
    if (!this.token) {
      this.error.set('Pozivnica nije pronađena.');
      this.loading.set(false);
      return;
    }

    this.clientApi.showClientInvite(this.token).subscribe({
      next: (invite) => {
        this.invite.set(invite);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Pozivnica nije dostupna.');
        this.loading.set(false);
      },
    });
  }
}

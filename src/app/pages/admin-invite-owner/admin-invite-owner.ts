import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Api } from '../../core/services/api';

@Component({
  selector: 'app-admin-invite-owner',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-invite-owner.html',
  styleUrl: './admin-invite-owner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminInviteOwner {
  private readonly api = inject(Api);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly inviteForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
  });
  protected readonly submitting = signal(false);
  protected readonly success = signal('');
  protected readonly error = signal('');
  protected readonly validationErrors = signal<string[]>([]);

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

    this.api.inviteCompanyOwner({ email: value.email ?? '' }).subscribe({
      next: () => {
        this.success.set('Pozivnica je poslata.');
        this.submitting.set(false);
        this.inviteForm.reset();
      },
      error: (error: HttpErrorResponse) => {
        this.error.set('Pozivnica nije poslata.');
        this.validationErrors.set(this.extractValidationErrors(error));
        this.submitting.set(false);
      },
    });
  }

  protected fieldInvalid(): boolean {
    const field = this.inviteForm.controls.email;
    return field.invalid && (field.dirty || field.touched);
  }

  private extractValidationErrors(error: HttpErrorResponse): string[] {
    const response = error.error as { message?: string; errors?: Record<string, string[]> } | null;

    if (!response?.errors) {
      return response?.message ? [response.message] : [];
    }

    return Object.values(response.errors).flat();
  }
}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ClientPortalApi } from '../../core/services/client-portal-api.service';
import { ClientAuthStore } from '../../core/state/client-auth.store';

@Component({
  selector: 'app-client-login',
  imports: [FormsModule],
  templateUrl: './client-login.html',
  styleUrl: './client-login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientLogin {
  private readonly clientApi = inject(ClientPortalApi);
  private readonly clientAuthStore = inject(ClientAuthStore);
  private readonly router = inject(Router);

  protected email = '';
  protected password = '';
  protected readonly submitted = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal('');

  protected submit(): void {
    this.submitted.set(true);
    this.error.set('');

    if (!this.email.trim() || !this.password) {
      this.error.set('Unesite email i lozinku.');
      return;
    }

    this.submitting.set(true);

    this.clientApi.login(this.email.trim(), this.password).subscribe({
      next: (response) => {
        this.clientAuthStore.setAuth(response.data.token, response.data.patient);
        this.router.navigate(['/client/dashboard']);
      },
      error: () => {
        this.error.set('Email ili lozinka nisu ispravni.');
        this.submitting.set(false);
      },
      complete: () => {
        this.submitting.set(false);
      },
    });
  }

  protected clearError(): void {
    if (this.error()) {
      this.error.set('');
    }
  }
}

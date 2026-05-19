import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  email = '';
  password = '';
  readonly error = signal('');
  readonly submitted = signal(false);

  submit(): void {
    this.error.set('');
    this.submitted.set(true);

    if (!this.email.trim() || !this.password) {
      this.error.set('Unesite email i lozinku.');
      return;
    }

    this.auth.login(this.email, this.password).subscribe({
      next: (response) => {
        this.router.navigate([this.auth.homePathFor(response.user)]);
      },
      error: () => {
        this.error.set('Email ili lozinka nisu ispravni.');
      },
    });
  }

  clearError(): void {
    if (this.error()) {
      this.error.set('');
    }
  }
}

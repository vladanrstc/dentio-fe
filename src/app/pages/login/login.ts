import { Component, inject } from '@angular/core';
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

  email = 'owner@test.rs';
  password = 'Password123!';
  error = '';

  submit(): void {
    this.error = '';

    this.auth.login(this.email, this.password).subscribe({
      next: (response) => {
        this.router.navigate([this.auth.homePathFor(response.user)]);
      },
      error: () => {
        this.error = 'Pogresan email ili lozinka.';
      },
    });
  }
}

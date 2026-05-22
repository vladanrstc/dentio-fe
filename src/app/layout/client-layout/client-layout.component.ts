import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { AuthStore } from '../../core/state/auth.store';

@Component({
  selector: 'app-client-layout',
  imports: [RouterOutlet],
  templateUrl: './client-layout.component.html',
  styleUrl: './client-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientLayout {
  protected readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  protected logout(): void {
    this.authStore.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { ClientAuthStore } from '../../core/state/client-auth.store';

@Component({
  selector: 'app-client-layout',
  imports: [RouterOutlet],
  templateUrl: './client-layout.html',
  styleUrl: './client-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientLayout {
  protected readonly clientAuthStore = inject(ClientAuthStore);
  private readonly router = inject(Router);

  protected logout(): void {
    this.clientAuthStore.logout().subscribe(() => {
      this.router.navigate(['/client/login']);
    });
  }
}

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { ClientAuthStore } from '../state/client-auth.store';

export const clientGuard: CanActivateFn = () => {
  const clientAuthStore = inject(ClientAuthStore);
  const router = inject(Router);

  if (!clientAuthStore.isAuthenticated()) {
    return router.createUrlTree(['/client/login']);
  }

  if (!clientAuthStore.hasPatient()) {
    return clientAuthStore.checkAuth().pipe(
      map(() => {
        if (!clientAuthStore.isAuthenticated()) {
          return router.createUrlTree(['/client/login']);
        }

        return clientAuthStore.hasPatient() ? true : router.createUrlTree(['/client/login']);
      }),
    );
  }

  return true;
};

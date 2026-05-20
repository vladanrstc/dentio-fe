import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthStore } from '../state/auth.store';

export const clientGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated()) {
    return router.createUrlTree(['/client/login']);
  }

  if (!authStore.hasPrincipal()) {
    return authStore.checkAuth().pipe(
      map(() => {
        if (!authStore.isAuthenticated()) {
          return router.createUrlTree(['/client/login']);
        }

        return authStore.isClientPatient() ? true : router.createUrlTree(['/login']);
      }),
    );
  }

  return authStore.isClientPatient() ? true : router.createUrlTree(['/login']);
};

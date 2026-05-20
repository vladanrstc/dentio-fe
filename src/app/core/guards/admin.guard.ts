import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthStore } from '../state/auth.store';

export const adminGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (!authStore.hasPrincipal()) {
    return authStore.checkAuth().pipe(
      map(() => {
        if (!authStore.isAuthenticated()) {
          return router.createUrlTree(['/login']);
        }

        if (authStore.isClientPatient()) {
          return router.createUrlTree(['/client/dashboard']);
        }

        return authStore.isPlatformAdmin() ? true : router.createUrlTree(['/dashboard']);
      }),
    );
  }

  if (authStore.isPlatformAdmin()) {
    return true;
  }

  if (authStore.isClientPatient()) {
    return router.createUrlTree(['/client/dashboard']);
  }

  return router.createUrlTree(['/dashboard']);
};

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

  if (!authStore.hasUser()) {
    return authStore.checkAuth().pipe(
      map(() => {
        if (!authStore.isAuthenticated()) {
          return router.createUrlTree(['/login']);
        }

        return authStore.isPlatformAdmin() ? true : router.createUrlTree(['/dashboard']);
      }),
    );
  }

  if (authStore.isPlatformAdmin()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};

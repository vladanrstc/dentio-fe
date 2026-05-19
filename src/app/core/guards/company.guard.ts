import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthStore } from '../state/auth.store';

export const companyGuard: CanActivateFn = () => {
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

        if (authStore.isPlatformAdmin()) {
          return router.createUrlTree(['/admin/dashboard']);
        }

        return authStore.isCompanyUser() ? true : router.createUrlTree(['/login']);
      }),
    );
  }

  if (authStore.isPlatformAdmin()) {
    return router.createUrlTree(['/admin/dashboard']);
  }

  if (authStore.isCompanyUser()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

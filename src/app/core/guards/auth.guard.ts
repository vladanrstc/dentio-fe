import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthStore } from '../state/auth.store';

export const authGuard: CanActivateFn = (_route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (!authStore.hasUser()) {
    return authStore.checkAuth().pipe(
      map(() => (authStore.isAuthenticated() && authStore.hasUser() ? true : router.createUrlTree(['/login']))),
    );
  }

  return true;
};

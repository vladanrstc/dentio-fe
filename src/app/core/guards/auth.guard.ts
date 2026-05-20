import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthStore } from '../state/auth.store';

export const authGuard: CanActivateFn = (_route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const loginPath = state.url.startsWith('/client') ? '/client/login' : '/login';

  if (!authStore.isAuthenticated()) {
    return router.createUrlTree([loginPath]);
  }

  if (!authStore.hasPrincipal()) {
    return authStore.checkAuth().pipe(
      map(() => (authStore.isAuthenticated() && authStore.hasPrincipal() ? true : router.createUrlTree([loginPath]))),
    );
  }

  return true;
};

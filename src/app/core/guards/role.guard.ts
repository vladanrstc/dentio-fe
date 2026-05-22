import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthRole, getDefaultRouteForRole } from '../models/auth.models';
import { AuthStore } from '../state/auth.store';

export const roleGuard: CanActivateFn = (route) => {
  const allowedRoles = (route.data['roles'] as AuthRole[] | undefined) ?? [];
  return checkRoles(allowedRoles);
};

export function roleGuardForRoles(allowedRoles: readonly AuthRole[]): CanActivateFn {
  return () => checkRoles(allowedRoles);
}

function checkRoles(allowedRoles: readonly AuthRole[]) {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (!authStore.hasUser()) {
    return authStore.checkAuth().pipe(map(() => evaluateRole(authStore, router, allowedRoles)));
  }

  return evaluateRole(authStore, router, allowedRoles);
}

function evaluateRole(authStore: InstanceType<typeof AuthStore>, router: Router, allowedRoles: readonly AuthRole[]) {
  const role = authStore.role();

  if (role && allowedRoles.includes(role)) {
    return true;
  }

  return router.createUrlTree([getDefaultRouteForRole(role)]);
}

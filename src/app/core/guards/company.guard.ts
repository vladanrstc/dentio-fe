import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Auth } from '../services/auth';

export const companyGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  if (auth.isPlatformAdmin()) {
    return router.createUrlTree(['/admin/dashboard']);
  }

  if (auth.isCompanyUser()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

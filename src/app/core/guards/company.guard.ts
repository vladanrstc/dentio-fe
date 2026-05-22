import { COMPANY_ROLES } from '../models/auth.models';
import { roleGuardForRoles } from './role.guard';

export const companyGuard = roleGuardForRoles(COMPANY_ROLES);

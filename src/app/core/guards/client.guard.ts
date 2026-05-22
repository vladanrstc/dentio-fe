import { AuthRole } from '../models/auth.models';
import { roleGuardForRoles } from './role.guard';

export const clientGuard = roleGuardForRoles([AuthRole.Client]);

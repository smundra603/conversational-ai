import { Role } from '../enums/role.enum.js';
import { Scope } from '../enums/scope.enum.js';
import { UserType } from '../models/user/user.schema.js';

export function isPermitted(context: { scopes?: Scope[] }, requiredScope: Scope = Scope.USAGE_DASHBOARD): boolean {
  return context.scopes?.includes(requiredScope) ?? false;
}

const RoleScopesMap: Record<Role, Scope[]> = {
  [Role.ADMIN]: [Scope.USAGE_DASHBOARD, Scope.USER_DASHBOARD, Scope.USER_CHAT, Scope.USER_AGENT],
  [Role.USER]: [Scope.USER_CHAT, Scope.USER_AGENT],
};

function getScopesForRoles(roles: Role[]): Scope[] {
  const scopes = new Set<Scope>();
  roles.forEach((role) => {
    const roleScopes = RoleScopesMap[role];
    if (roleScopes) {
      roleScopes.forEach((scope) => scopes.add(scope));
    }
  });
  return Array.from(scopes);
}

export function getPermittedScopes(user: UserType): Scope[] {
  return getScopesForRoles(user.roles ?? []);
}

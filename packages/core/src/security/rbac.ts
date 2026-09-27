/**
 * Sutra Security Core: Granular RBAC and ABAC Evaluation Engine
 * 
 * Provides enterprise-grade authorization with role hierarchies,
 * permission mapping, and attribute-based dynamic evaluations (e.g. branch, amount limit).
 */

export interface UserContext {
  userId: string;
  tenantId: string;
  email: string;
  fullName: string;
  isSuperAdmin: boolean;
  roles: string[];
  permissions: Set<string>;
  attributes?: {
    branchId?: string;
    department?: string;
    approvalLimit?: number;
    costCenter?: string;
    [key: string]: unknown;
  };
}

export interface AccessRule {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'post' | 'approve' | '*';
  conditions?: (user: UserContext, targetResource: Record<string, unknown>) => boolean;
}

export class AccessControlEngine {
  /**
   * Checks if user has necessary permission code or ABAC condition met.
   */
  public static can(
    user: UserContext,
    requiredPermission: string,
    targetResource?: Record<string, unknown>
  ): boolean {
    // 1. Superadmin has blanket access across system
    if (user.isSuperAdmin) {
      return true;
    }

    // 2. Direct permission check (RBAC)
    const hasWildcard = user.permissions.has('*') || user.permissions.has(`${requiredPermission.split(':')[0]}:*`);
    const hasDirectPermission = user.permissions.has(requiredPermission);

    if (!hasWildcard && !hasDirectPermission) {
      return false;
    }

    // 3. ABAC Evaluation if target resource is provided
    if (targetResource && user.attributes) {
      // Branch boundary check (Tenants with multi-branch isolation)
      if (
        user.attributes.branchId &&
        targetResource.branchId &&
        user.attributes.branchId !== targetResource.branchId
      ) {
        return false;
      }

      // Financial approval limit check
      if (
        user.attributes.approvalLimit !== undefined &&
        typeof targetResource.totalAmount === 'number'
      ) {
        if (targetResource.totalAmount > user.attributes.approvalLimit) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Validates if a user belongs to the requested tenant context.
   */
  public static enforceTenantIsolation(user: UserContext, requestedTenantId: string): void {
    if (!user.isSuperAdmin && user.tenantId !== requestedTenantId) {
      throw new Error(`[Sutra Security] Cross-tenant access denied. User belongs to ${user.tenantId}`);
    }
  }
}

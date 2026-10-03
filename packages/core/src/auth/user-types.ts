/**
 * Sutra Identity & Access Management (IAM) Types
 * Enterprise Role-Based & Attribute-Based Access Control
 */

export interface EnterprisePermission {
  code: string;
  module: string;
  description: string;
}

export interface EnterpriseRole {
  roleId: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  permissions: string[];
}

export interface UserRecord {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  passwordHash: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  roles: string[];
  permissions: string[];
  department?: string;
  attributes?: Record<string, unknown>;
  createdAt: string;
  lastLoginAt?: string;
}

export type UserSummary = Omit<UserRecord, 'passwordHash'>;

export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  tenantId?: string;
  roles: string[];
  department?: string;
  isSuperAdmin?: boolean;
  attributes?: Record<string, unknown>;
}

export interface UpdateUserInput {
  fullName?: string;
  roles?: string[];
  department?: string;
  attributes?: Record<string, unknown>;
}

export interface CreateRoleInput {
  roleId: string;
  name: string;
  description: string;
  permissions: string[];
}

/**
 * Sutra Enterprise User & Role Manager (IAM Engine)
 * Centralizes user directory, credential management, role definitions, and permission resolution.
 */

import bcrypt from 'bcrypt';
import {
  EnterprisePermission,
  EnterpriseRole,
  UserRecord,
  UserSummary,
  CreateUserInput,
  UpdateUserInput,
  CreateRoleInput,
} from './user-types.js';
import { SystemDefaults } from '../common/constants.js';

export const STANDARD_PERMISSIONS: EnterprisePermission[] = [
  // Finance & Accounting
  { code: 'ledger:read', module: 'Finance', description: 'View general ledger, chart of accounts, and financial vouchers' },
  { code: 'ledger:post', module: 'Finance', description: 'Post manual or automated double-entry journal vouchers' },
  { code: 'subledger:read', module: 'Finance', description: 'View accounts receivable and accounts payable subledger aging' },
  { code: 'consolidation:execute', module: 'Finance', description: 'Run IFRS 10 / Ind AS 110 group financial consolidation' },
  { code: 'tax:calculate', module: 'Finance', description: 'Calculate statutory GST, TDS Section 194, and Customs duties' },

  // Sales & Credit Management
  { code: 'sales:read', module: 'Sales', description: 'View customer master and sales orders' },
  { code: 'sales:create', module: 'Sales', description: 'Create and submit sales orders (O2C)' },
  { code: 'credit:read', module: 'Sales', description: 'View customer credit ratings, scores, and exposure profiles' },
  { code: 'credit:release', module: 'Sales', description: 'Release credit-blocked sales orders (SAP VKM3)' },
  { code: 'dunning:execute', module: 'Sales', description: 'Execute automated dunning runs with Section 16 MSMED interest' },

  // Procurement & Sourcing
  { code: 'procurement:read', module: 'Procurement', description: 'View vendor master and purchase orders' },
  { code: 'procurement:create', module: 'Procurement', description: 'Create purchase orders and perform 3-way match (P2P)' },
  { code: 'sourcing:evaluate', module: 'Procurement', description: 'Evaluate RFQ tenders and compare competitive vendor quotations' },
  { code: 'sourcing:award', module: 'Procurement', description: 'Award procurement tenders and generate purchase orders' },

  // Operations, Inventory & Supply Chain
  { code: 'inventory:read', module: 'Operations', description: 'View inventory master, stock levels, and moving average prices' },
  { code: 'inventory:move', module: 'Operations', description: 'Post inventory stock movements (Mvt 101, 201, 601, 701)' },
  { code: 'warehouse:manage', module: 'Operations', description: 'Manage storage bins, putaway tasks, and cycle counts' },
  { code: 'transportation:manage', module: 'Operations', description: 'Create freight orders, assign carriers, and track e-POD' },
  { code: 'quality:inspect', module: 'Operations', description: 'Record inspection lot conforming characteristics and issue CoA' },
  { code: 'maintenance:manage', module: 'Operations', description: 'Manage plant functional locations, equipment, and work orders' },
  { code: 'projects:manage', module: 'Operations', description: 'Track WBS project budgets and capital milestones' },
  { code: 'hcm:manage', module: 'Operations', description: 'Process monthly payroll runs, employee master, and payslips' },

  // Administration & Security
  { code: 'users:read', module: 'Administration', description: 'View enterprise user directory and session status' },
  { code: 'users:manage', module: 'Administration', description: 'Provision, modify, and deactivate enterprise user accounts' },
  { code: 'roles:manage', module: 'Administration', description: 'Create and configure custom roles and permission maps' },
  { code: 'audit:read', module: 'Administration', description: 'Inspect immutable system and compliance audit trails' },
  { code: '*', module: 'SuperAdmin', description: 'Full blanket administrative access across all modules' },
];

export const STANDARD_ROLES: EnterpriseRole[] = [
  {
    roleId: 'EnterpriseAdministrator',
    name: 'Enterprise Administrator',
    description: 'Unrestricted superadmin authority across all financial ledgers, operations, and security',
    isSystemRole: true,
    permissions: ['*'],
  },
  {
    roleId: 'OrgAdministrator',
    name: 'Organization Administrator',
    description: 'Tenant-level administrative authority over users, departmental roles, and operational workflows',
    isSystemRole: true,
    permissions: [
      'users:read',
      'users:manage',
      'roles:manage',
      'audit:read',
      'ledger:read',
      'subledger:read',
      'sales:read',
      'sales:create',
      'procurement:read',
      'procurement:create',
      'inventory:read',
      'inventory:move',
    ],
  },
  {
    roleId: 'FinanceOfficer',
    name: 'Chief Financial Officer / Controller',
    description: 'Full authority over general ledger, consolidation, statutory taxes, subledgers, and credit',
    isSystemRole: true,
    permissions: [
      'ledger:read',
      'ledger:post',
      'subledger:read',
      'consolidation:execute',
      'tax:calculate',
      'credit:read',
      'credit:release',
      'audit:read',
    ],
  },
  {
    roleId: 'SupplyChainManager',
    name: 'Supply Chain & Plant Director',
    description: 'Comprehensive authority over inventory, O2C, P2P, sourcing tenders, warehouse, and logistics',
    isSystemRole: true,
    permissions: [
      'inventory:read',
      'inventory:move',
      'sales:read',
      'sales:create',
      'procurement:read',
      'procurement:create',
      'sourcing:evaluate',
      'sourcing:award',
      'warehouse:manage',
      'transportation:manage',
      'quality:inspect',
      'maintenance:manage',
    ],
  },
  {
    roleId: 'InternalAuditor',
    name: 'Internal Compliance & Statutory Auditor',
    description: 'Read-only audit inspection across financial records, subledger aging, and compliance logs',
    isSystemRole: true,
    permissions: [
      'ledger:read',
      'subledger:read',
      'sales:read',
      'procurement:read',
      'inventory:read',
      'credit:read',
      'audit:read',
      'tax:calculate',
      'users:read',
    ],
  },
  {
    roleId: 'SalesExecutive',
    name: 'Commercial Sales & Accounts Executive',
    description: 'Entry and management of sales orders, customer accounts, and credit visibility',
    isSystemRole: true,
    permissions: ['sales:read', 'sales:create', 'credit:read', 'inventory:read'],
  },
  {
    roleId: 'HRManager',
    name: 'Human Resources & Payroll Manager',
    description: 'Management of employee master profiles, attendance, and monthly payroll runs',
    isSystemRole: true,
    permissions: ['hcm:manage', 'users:read', 'audit:read'],
  },
];

export class EnterpriseUserManager {
  private users: Map<string, UserRecord> = new Map();
  private roles: Map<string, EnterpriseRole> = new Map();
  public installMode: 'plain' | 'demo';

  constructor(modeOrOptions?: 'plain' | 'demo' | { installMode?: 'plain' | 'demo' }) {
    if (typeof modeOrOptions === 'object' && modeOrOptions !== null) {
      this.installMode = modeOrOptions.installMode || 'demo';
    } else if (typeof modeOrOptions === 'string') {
      this.installMode = modeOrOptions;
    } else {
      this.installMode = (process.env.SUTRA_INSTALL_MODE as 'plain' | 'demo') || 'demo';
    }

    this.seedDefaultRoles();
    if (this.installMode === 'plain') {
      this.seedPlatformAdminOnly();
    } else {
      this.seedDefaultUsers();
    }
  }

  public seedPlatformAdminOnly(
    email: string = process.env.SUPERADMIN_EMAIL || 'admin@sutra.local',
    password: string = process.env.SUPERADMIN_PASSWORD || 'admin123',
    fullName: string = 'Sutra Platform Super Administrator'
  ): UserRecord {
    const saltRounds = 10;
    const defaultTenant = SystemDefaults.DEFAULT_TENANT_ID;
    const salt = bcrypt.genSaltSync(saltRounds);
    const passwordHash = bcrypt.hashSync(password, salt);

    const adminUser: UserRecord = {
      id: 'usr-admin-001',
      tenantId: defaultTenant,
      email: email.trim().toLowerCase(),
      fullName,
      passwordHash,
      isActive: true,
      isSuperAdmin: true,
      roles: ['EnterpriseAdministrator'],
      permissions: ['*'],
      department: 'Platform Architecture & Administration',
      createdAt: new Date().toISOString(),
    };
    this.users.clear();
    this.users.set(adminUser.id, adminUser);
    return adminUser;
  }

  public seedOrgAdmin(params: {
    email: string;
    password: string;
    fullName: string;
    tenantId?: string;
    department?: string;
  }): UserRecord {
    const saltRounds = 10;
    const tenantId = params.tenantId || SystemDefaults.DEFAULT_TENANT_ID;
    const salt = bcrypt.genSaltSync(saltRounds);
    const passwordHash = bcrypt.hashSync(params.password, salt);
    const permissions = this.resolvePermissionsForRoles(['OrgAdministrator']);

    const orgAdmin: UserRecord = {
      id: `usr-orgadmin-${Date.now()}`,
      tenantId,
      email: params.email.trim().toLowerCase(),
      fullName: params.fullName.trim(),
      passwordHash,
      isActive: true,
      isSuperAdmin: false,
      roles: ['OrgAdministrator'],
      permissions,
      department: params.department || 'Executive Operations',
      createdAt: new Date().toISOString(),
    };

    // Replace if email already exists
    for (const [id, u] of this.users.entries()) {
      if (u.email === orgAdmin.email) {
        this.users.delete(id);
      }
    }
    this.users.set(orgAdmin.id, orgAdmin);
    return orgAdmin;
  }

  private seedDefaultRoles(): void {
    for (const r of STANDARD_ROLES) {
      this.roles.set(r.roleId, { ...r });
    }
  }

  private seedDefaultUsers(): void {
    this.users.clear();
    const saltRounds = 10;
    const defaultTenant = SystemDefaults.DEFAULT_TENANT_ID;

    const initialUsers: Array<{
      id: string;
      email: string;
      password: string;
      fullName: string;
      isSuperAdmin: boolean;
      roles: string[];
      department: string;
    }> = [
      {
        id: 'usr-admin-001',
        email: 'admin@sutra.local',
        password: 'admin123',
        fullName: 'Rajesh Sharma (Platform Super Administrator)',
        isSuperAdmin: true,
        roles: ['EnterpriseAdministrator'],
        department: 'Platform Architecture & Setup',
      },
      {
        id: 'usr-orgadmin-000',
        email: 'org.admin@enterprise.in',
        password: 'orgadmin123',
        fullName: 'Vikramaditya Singhania (Organization Administrator)',
        isSuperAdmin: false,
        roles: ['OrgAdministrator'],
        department: 'Corporate Executive Leadership',
      },
      {
        id: 'usr-fin-002',
        email: 'finance.lead@sutra.local',
        password: 'finance123',
        fullName: 'Anita Desai (VP Finance & Controller)',
        isSuperAdmin: false,
        roles: ['FinanceOfficer'],
        department: 'Corporate Finance',
      },
      {
        id: 'usr-scm-003',
        email: 'sc.director@sutra.local',
        password: 'supply123',
        fullName: 'Vikram Mehta (Director Supply Chain)',
        isSuperAdmin: false,
        roles: ['SupplyChainManager'],
        department: 'Global Supply Chain',
      },
      {
        id: 'usr-audit-004',
        email: 'auditor@sutra.local',
        password: 'audit123',
        fullName: 'Sunil Kulkarni (Chief Internal Auditor)',
        isSuperAdmin: false,
        roles: ['InternalAuditor'],
        department: 'Internal Audit & Governance',
      },
      {
        id: 'usr-sales-005',
        email: 'sales.rep@sutra.local',
        password: 'sales123',
        fullName: 'Pooja Iyer (Senior Commercial Account Manager)',
        isSuperAdmin: false,
        roles: ['SalesExecutive'],
        department: 'Commercial Sales',
      },
      {
        id: 'usr-hr-006',
        email: 'hr.lead@sutra.local',
        password: 'hr123',
        fullName: 'Kavita Nair (Head of Human Resources)',
        isSuperAdmin: false,
        roles: ['HRManager'],
        department: 'People & Culture',
      },
    ];

    for (const u of initialUsers) {
      const passwordHash = bcrypt.hashSync(u.password, saltRounds);
      const permissions = this.resolvePermissionsForRoles(u.roles, u.isSuperAdmin);

      this.users.set(u.id, {
        id: u.id,
        tenantId: defaultTenant,
        email: u.email.toLowerCase(),
        fullName: u.fullName,
        passwordHash,
        isActive: true,
        isSuperAdmin: u.isSuperAdmin,
        roles: u.roles,
        permissions,
        department: u.department,
        createdAt: '2026-09-01T00:00:00.000Z',
      });
    }
  }

  /**
   * Resolves a deduplicated array of permission codes across a user's assigned roles.
   */
  public resolvePermissionsForRoles(roleIds: string[], isSuperAdmin = false): string[] {
    if (isSuperAdmin) {
      return ['*'];
    }

    const set = new Set<string>();
    for (const rId of roleIds) {
      const role = this.roles.get(rId);
      if (role) {
        for (const p of role.permissions) {
          set.add(p);
        }
      }
    }
    return Array.from(set);
  }

  /**
   * User lookup callback compatible with LocalJwtAuthProvider.
   */
  public async lookupUserForAuth(email: string, tenantId?: string): Promise<UserRecord | null> {
    const normalizedEmail = email.toLowerCase().trim();
    for (const u of this.users.values()) {
      if (u.email === normalizedEmail) {
        if (!tenantId || u.tenantId === tenantId || u.isSuperAdmin) {
          return { ...u };
        }
      }
    }
    return null;
  }

  public listUsers(tenantId?: string): UserSummary[] {
    const list: UserSummary[] = [];
    for (const u of this.users.values()) {
      if (!tenantId || u.tenantId === tenantId || u.isSuperAdmin) {
        const { passwordHash: _, ...summary } = u;
        list.push(summary);
      }
    }
    return list;
  }

  public getUserById(id: string): UserSummary | undefined {
    const u = this.users.get(id);
    if (!u) return undefined;
    const { passwordHash: _, ...summary } = u;
    return summary;
  }

  public getUserByEmail(email: string): UserSummary | undefined {
    const normalized = email.toLowerCase().trim();
    for (const u of this.users.values()) {
      if (u.email === normalized) {
        const { passwordHash: _, ...summary } = u;
        return summary;
      }
    }
    return undefined;
  }

  public createUser(input: CreateUserInput): UserSummary {
    const normalizedEmail = input.email.toLowerCase().trim();
    if (this.getUserByEmail(normalizedEmail)) {
      throw new Error(`User with email '${normalizedEmail}' already exists.`);
    }

    if (!input.password || input.password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const id = `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const passwordHash = bcrypt.hashSync(input.password, 10);
    const isSuperAdmin = Boolean(input.isSuperAdmin);
    const roles = input.roles.length > 0 ? input.roles : ['SalesExecutive'];
    const permissions = this.resolvePermissionsForRoles(roles, isSuperAdmin);

    const record: UserRecord = {
      id,
      tenantId: input.tenantId || SystemDefaults.DEFAULT_TENANT_ID,
      email: normalizedEmail,
      fullName: input.fullName.trim(),
      passwordHash,
      isActive: true,
      isSuperAdmin,
      roles,
      permissions,
      department: input.department?.trim() || 'General Operations',
      attributes: input.attributes,
      createdAt: new Date().toISOString(),
    };

    this.users.set(id, record);
    const { passwordHash: _, ...summary } = record;
    return summary;
  }

  public updateUser(id: string, input: UpdateUserInput): UserSummary {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with ID '${id}' not found.`);
    }

    if (input.fullName !== undefined) {
      user.fullName = input.fullName.trim();
    }
    if (input.department !== undefined) {
      user.department = input.department.trim();
    }
    if (input.roles !== undefined) {
      user.roles = input.roles;
      user.permissions = this.resolvePermissionsForRoles(input.roles, user.isSuperAdmin);
    }
    if (input.attributes !== undefined) {
      user.attributes = { ...user.attributes, ...input.attributes };
    }

    const { passwordHash: _, ...summary } = user;
    return summary;
  }

  public setUserStatus(id: string, isActive: boolean): UserSummary {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with ID '${id}' not found.`);
    }

    if (user.isSuperAdmin && !isActive) {
      throw new Error('Superadmin account cannot be deactivated.');
    }

    user.isActive = isActive;
    const { passwordHash: _, ...summary } = user;
    return summary;
  }

  public resetPassword(id: string, newPassword: string): void {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with ID '${id}' not found.`);
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    user.passwordHash = bcrypt.hashSync(newPassword, 10);
  }

  public recordLogin(id: string): void {
    const user = this.users.get(id);
    if (user) {
      user.lastLoginAt = new Date().toISOString();
    }
  }

  // --- Roles Management ---
  public listRoles(): EnterpriseRole[] {
    return Array.from(this.roles.values());
  }

  public getRole(roleId: string): EnterpriseRole | undefined {
    return this.roles.get(roleId);
  }

  public createRole(input: CreateRoleInput): EnterpriseRole {
    const cleanId = input.roleId.trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (!cleanId) {
      throw new Error('Invalid Role ID.');
    }
    if (this.roles.has(cleanId)) {
      throw new Error(`Role with ID '${cleanId}' already exists.`);
    }

    const newRole: EnterpriseRole = {
      roleId: cleanId,
      name: input.name.trim(),
      description: input.description.trim(),
      isSystemRole: false,
      permissions: input.permissions,
    };

    this.roles.set(cleanId, newRole);
    return newRole;
  }

  public updateRolePermissions(roleId: string, permissions: string[]): EnterpriseRole {
    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error(`Role '${roleId}' not found.`);
    }
    if (role.isSystemRole && role.roleId === 'EnterpriseAdministrator') {
      throw new Error('EnterpriseAdministrator permissions cannot be modified.');
    }

    role.permissions = permissions;

    // Refresh permissions for all users having this role
    for (const user of this.users.values()) {
      if (user.roles.includes(roleId)) {
        user.permissions = this.resolvePermissionsForRoles(user.roles, user.isSuperAdmin);
      }
    }

    return role;
  }

  public deleteRole(roleId: string): void {
    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error(`Role '${roleId}' not found.`);
    }
    if (role.isSystemRole) {
      throw new Error(`System role '${roleId}' cannot be deleted.`);
    }

    this.roles.delete(roleId);
  }

  public listPermissions(): EnterprisePermission[] {
    return [...STANDARD_PERMISSIONS];
  }
}

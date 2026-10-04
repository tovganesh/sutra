import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import {
  EnterpriseUserManager,
  LocalJwtAuthProvider,
  SystemModuleManager,
} from '../packages/core/dist/index.js';

describe('Sutra Identity & Access Management (IAM) Suite', () => {
  const userManager = new EnterpriseUserManager();

  describe('1. Default Personas & Role-Based Permissions Resolution', () => {
    test('seeds standard enterprise roles and personas', () => {
      const users = userManager.listUsers();
      assert.ok(users.length >= 6);

      const admin = users.find((u) => u.email === 'admin@sutra.local');
      assert.ok(admin);
      assert.equal(admin.isSuperAdmin, true);
      assert.ok(admin.permissions.includes('*'));

      const finance = users.find((u) => u.email === 'finance.lead@sutra.local');
      assert.ok(finance);
      assert.ok(finance.roles.includes('FinanceOfficer'));
      assert.ok(finance.permissions.includes('ledger:post'));
      assert.ok(finance.permissions.includes('consolidation:execute'));
      assert.equal(finance.isSuperAdmin, false);

      const scm = users.find((u) => u.email === 'sc.director@sutra.local');
      assert.ok(scm);
      assert.ok(scm.roles.includes('SupplyChainManager'));
      assert.ok(scm.permissions.includes('inventory:move'));
      assert.ok(scm.permissions.includes('sourcing:award'));
    });

    test('authenticates pre-seeded personas using bcrypt password comparison', async () => {
      const authUser = await userManager.lookupUserForAuth('finance.lead@sutra.local');
      assert.ok(authUser);
      assert.ok(authUser.passwordHash);

      const isValid = await bcrypt.compare('finance123', authUser.passwordHash);
      assert.equal(isValid, true);

      const isInvalid = await bcrypt.compare('wrongpassword', authUser.passwordHash);
      assert.equal(isInvalid, false);
    });

    test('deduplicates permissions when resolving multiple roles for a user', () => {
      const perms = userManager.resolvePermissionsForRoles(['FinanceOfficer', 'SalesExecutive']);
      assert.ok(perms.includes('ledger:post'));
      assert.ok(perms.includes('sales:create'));
      assert.ok(perms.includes('credit:read'));

      // Check no duplicates
      const uniquePerms = new Set(perms);
      assert.equal(perms.length, uniquePerms.size);
    });
  });

  describe('2. User Provisioning & Lifecycle Management', () => {
    let createdUserId = '';

    test('provisions a new corporate user with bcrypt hashed password', () => {
      const user = userManager.createUser({
        fullName: 'Devendra Joshi',
        email: 'devendra.j@sutra.local',
        password: 'securePassword2026',
        department: 'Plant Operations',
        roles: ['SupplyChainManager'],
      });

      assert.ok(user.id);
      createdUserId = user.id;
      assert.equal(user.email, 'devendra.j@sutra.local');
      assert.equal(user.fullName, 'Devendra Joshi');
      assert.equal(user.department, 'Plant Operations');
      assert.equal(user.isActive, true);
      assert.ok(user.permissions.includes('inventory:move'));
    });

    test('prevents creating duplicate user with the same email', () => {
      assert.throws(() => {
        userManager.createUser({
          fullName: 'Duplicate User',
          email: 'devendra.j@sutra.local',
          password: 'anotherPassword',
          roles: ['SalesExecutive'],
        });
      }, /already exists/);
    });

    test('prevents password shorter than 6 characters', () => {
      assert.throws(() => {
        userManager.createUser({
          fullName: 'Short Pass User',
          email: 'short.pass@sutra.local',
          password: '123',
          roles: ['SalesExecutive'],
        });
      }, /at least 6 characters/);
    });

    test('updates user profile details and re-evaluates permissions', () => {
      const updated = userManager.updateUser(createdUserId, {
        fullName: 'Devendra Joshi (VP Ops)',
        roles: ['SupplyChainManager', 'FinanceOfficer'],
        department: 'Operations & Finance',
      });

      assert.equal(updated.fullName, 'Devendra Joshi (VP Ops)');
      assert.equal(updated.department, 'Operations & Finance');
      assert.ok(updated.permissions.includes('inventory:move'));
      assert.ok(updated.permissions.includes('ledger:post'));
    });

    test('deactivates and reactivates a user account', () => {
      const deactivated = userManager.setUserStatus(createdUserId, false);
      assert.equal(deactivated.isActive, false);

      const reactivated = userManager.setUserStatus(createdUserId, true);
      assert.equal(reactivated.isActive, true);
    });

    test('prevents deactivating superadmin account', () => {
      const admin = userManager.getUserByEmail('admin@sutra.local');
      assert.ok(admin);

      assert.throws(() => {
        userManager.setUserStatus(admin.id, false);
      }, /Superadmin account cannot be deactivated/);
    });

    test('resets user password with a new valid bcrypt hash', async () => {
      userManager.resetPassword(createdUserId, 'newPassword2026');

      const authUser = await userManager.lookupUserForAuth('devendra.j@sutra.local');
      assert.ok(authUser);

      const isOldValid = await bcrypt.compare('securePassword2026', authUser.passwordHash);
      assert.equal(isOldValid, false);

      const isNewValid = await bcrypt.compare('newPassword2026', authUser.passwordHash);
      assert.equal(isNewValid, true);
    });
  });

  describe('3. Roles & Permissions Management', () => {
    test('lists standard roles and permissions', () => {
      const roles = userManager.listRoles();
      assert.ok(roles.length >= 6);
      assert.ok(roles.some((r) => r.roleId === 'EnterpriseAdministrator' && r.isSystemRole));
      assert.ok(roles.some((r) => r.roleId === 'FinanceOfficer' && r.isSystemRole));

      const permissions = userManager.listPermissions();
      assert.ok(permissions.length >= 20);
      assert.ok(permissions.some((p) => p.code === 'ledger:post'));
      assert.ok(permissions.some((p) => p.code === 'credit:release'));
    });

    test('creates custom role and grants permissions', () => {
      const role = userManager.createRole({
        roleId: 'WarehouseSupervisor',
        name: 'Warehouse Operations Supervisor',
        description: 'Supervises storage bins, putaway tasks, and cycle counts',
        permissions: ['inventory:read', 'warehouse:manage'],
      });

      assert.equal(role.roleId, 'WarehouseSupervisor');
      assert.equal(role.name, 'Warehouse Operations Supervisor');
      assert.equal(role.isSystemRole, false);
      assert.deepEqual(role.permissions, ['inventory:read', 'warehouse:manage']);
    });

    test('updates custom role permissions and updates users holding that role', () => {
      // Assign custom role to a test user
      const user = userManager.createUser({
        fullName: 'Sunil Warehouse',
        email: 'sunil.wh@sutra.local',
        password: 'whPassword123',
        roles: ['WarehouseSupervisor'],
      });

      assert.deepEqual(user.permissions, ['inventory:read', 'warehouse:manage']);

      // Update role permissions
      userManager.updateRolePermissions('WarehouseSupervisor', [
        'inventory:read',
        'warehouse:manage',
        'quality:inspect',
      ]);

      const reloadedUser = userManager.getUserById(user.id);
      assert.ok(reloadedUser);
      assert.ok(reloadedUser.permissions.includes('quality:inspect'));
    });

    test('prevents deleting system standard roles', () => {
      assert.throws(() => {
        userManager.deleteRole('FinanceOfficer');
      }, /System role 'FinanceOfficer' cannot be deleted/);
    });

    test('deletes custom role successfully', () => {
      userManager.deleteRole('WarehouseSupervisor');
      assert.equal(userManager.getRole('WarehouseSupervisor'), undefined);
    });
  });

  describe('4. Integration with LocalJwtAuthProvider', () => {
    const jwtProvider = new LocalJwtAuthProvider({
      secretKey: 'test-jwt-secret-key-for-unit-testing',
      userLookupFn: (email, tenantId) => userManager.lookupUserForAuth(email, tenantId),
    });

    test('successfully authenticates provisioned corporate user via JWT provider', async () => {
      const result = await jwtProvider.authenticate({
        email: 'finance.lead@sutra.local',
        password: 'finance123',
      });

      assert.equal(result.success, true);
      assert.ok(result.tokens?.accessToken);
      assert.ok(result.user);
      assert.equal(result.user.email, 'finance.lead@sutra.local');
      assert.ok(result.user.roles.includes('FinanceOfficer'));
      assert.ok(result.user.permissions.has('ledger:post'));

      // Validate the generated token
      const validatedUser = await jwtProvider.validateToken(result.tokens.accessToken);
      assert.equal(validatedUser.email, 'finance.lead@sutra.local');
      assert.ok(validatedUser.roles.includes('FinanceOfficer'));
    });

    test('rejects login with incorrect password', async () => {
      const result = await jwtProvider.authenticate({
        email: 'finance.lead@sutra.local',
        password: 'incorrectPassword',
      });

      assert.equal(result.success, false);
      assert.equal(result.errorMessage, 'Invalid credentials');
    });

    test('rejects login when account is deactivated', async () => {
      const user = userManager.getUserByEmail('sales.rep@sutra.local');
      assert.ok(user);
      userManager.setUserStatus(user.id, false);

      const result = await jwtProvider.authenticate({
        email: 'sales.rep@sutra.local',
        password: 'sales123',
      });

      assert.equal(result.success, false);
      assert.ok(result.errorMessage?.includes('deactivated'));

      // Re-enable
      userManager.setUserStatus(user.id, true);
    });
  });

  describe('5. Plain vs Demo Installation Modes & Super Admin Role Boundary', () => {
    test('plain installation seeds ONLY the Platform Super Administrator', () => {
      const plainManager = new EnterpriseUserManager({ installMode: 'plain' });
      const users = plainManager.listUsers();
      assert.equal(users.length, 1);

      const superAdmin = users[0];
      assert.equal(superAdmin.email, 'admin@sutra.local');
      assert.equal(superAdmin.isSuperAdmin, true);
      assert.ok(superAdmin.roles.includes('EnterpriseAdministrator'));
      assert.ok(superAdmin.permissions.includes('*'));

      // Ensure no demo personas exist
      assert.equal(plainManager.getUserByEmail('org.admin@enterprise.in'), undefined);
      assert.equal(plainManager.getUserByEmail('finance.lead@sutra.local'), undefined);
    });

    test('platform super admin can provision organization administrator in plain install', () => {
      const plainManager = new EnterpriseUserManager({ installMode: 'plain' });
      const orgAdmin = plainManager.seedOrgAdmin({
        email: 'org.admin@clientcorp.in',
        password: 'ClientAdmin2026!',
        fullName: 'Rajesh Singhal',
        department: 'Operations & Management',
      });

      assert.ok(orgAdmin.id);
      assert.equal(orgAdmin.email, 'org.admin@clientcorp.in');
      assert.equal(orgAdmin.fullName, 'Rajesh Singhal');
      assert.ok(orgAdmin.roles.includes('OrgAdministrator'));
      assert.equal(orgAdmin.isSuperAdmin, false);

      // Verify org admin can manage users, roles, and enterprise workflows
      assert.ok(orgAdmin.permissions.includes('users:manage'));
      assert.ok(orgAdmin.permissions.includes('users:read'));
      assert.ok(orgAdmin.permissions.includes('roles:manage'));
      assert.ok(orgAdmin.permissions.includes('sales:create'));
      assert.ok(orgAdmin.permissions.includes('procurement:create'));

      // Total users is now 2 (Super Admin + Org Admin)
      assert.equal(plainManager.listUsers().length, 2);
    });

    test('demo installation seeds all functional business personas', () => {
      const demoManager = new EnterpriseUserManager({ installMode: 'demo' });
      const users = demoManager.listUsers();
      assert.ok(users.length >= 6);

      const superAdmin = demoManager.getUserByEmail('admin@sutra.local');
      assert.ok(superAdmin?.isSuperAdmin);

      const orgAdmin = demoManager.getUserByEmail('org.admin@enterprise.in');
      assert.ok(orgAdmin);
      assert.ok(orgAdmin.roles.includes('OrgAdministrator'));
      assert.equal(orgAdmin.isSuperAdmin, false);

      assert.ok(demoManager.getUserByEmail('finance.lead@sutra.local'));
      assert.ok(demoManager.getUserByEmail('sc.director@sutra.local'));
      assert.ok(demoManager.getUserByEmail('auditor@sutra.local'));
    });
  });

  describe('6. System Module Management & Activation', () => {
    test('initializes default enterprise modules with core modules locked', () => {
      const moduleMgr = new SystemModuleManager();
      const modules = moduleMgr.getModules();
      assert.ok(modules.length >= 8);

      const dashboard = modules.find((m) => m.id === 'dashboard');
      assert.ok(dashboard);
      assert.equal(dashboard.isCore, true);
      assert.equal(dashboard.isEnabled, true);

      const auth = modules.find((m) => m.id === 'auth');
      assert.ok(auth);
      assert.equal(auth.isCore, true);
      assert.equal(auth.isEnabled, true);

      const copilot = modules.find((m) => m.id === 'copilot');
      assert.ok(copilot);
      assert.equal(copilot.isCore, false);
      assert.equal(copilot.isEnabled, true);
    });

    test('enables and disables optional modules dynamically', () => {
      const moduleMgr = new SystemModuleManager();
      assert.equal(moduleMgr.isModuleActive('vault'), true);

      // Disable vault
      const disabledResult = moduleMgr.setModuleEnabled('vault', false);
      assert.equal(disabledResult, true);
      assert.equal(moduleMgr.isModuleActive('vault'), false);

      // Re-enable vault
      const enabledResult = moduleMgr.setModuleEnabled('vault', true);
      assert.equal(enabledResult, true);
      assert.equal(moduleMgr.isModuleActive('vault'), true);
    });

    test('prevents disabling core system modules', () => {
      const moduleMgr = new SystemModuleManager();
      const attemptDashboard = moduleMgr.setModuleEnabled('dashboard', false);
      assert.equal(attemptDashboard, false);
      assert.equal(moduleMgr.isModuleActive('dashboard'), true);

      const attemptAuth = moduleMgr.setModuleEnabled('auth', false);
      assert.equal(attemptAuth, false);
      assert.equal(moduleMgr.isModuleActive('auth'), true);
    });

    test('configures client setup and updates active modules', () => {
      const moduleMgr = new SystemModuleManager();
      const result = moduleMgr.configureClientSetup({
        organizationName: 'Tata Steel Long Products',
        gstin: '27AABCT3518Q1ZV',
        currency: 'INR',
        jurisdiction: 'IN',
        enabledModules: ['dashboard', 'auth', 'supplychain', 'compliance'],
      });

      assert.equal(result.isConfigured, true);
      assert.equal(result.organizationName, 'Tata Steel Long Products');
      assert.equal(result.gstin, '27AABCT3518Q1ZV');

      const activeIds = moduleMgr.getActiveModuleIds();
      assert.ok(activeIds.includes('dashboard'));
      assert.ok(activeIds.includes('auth'));
      assert.ok(activeIds.includes('supplychain'));
      assert.ok(activeIds.includes('compliance'));
      assert.equal(activeIds.includes('vault'), false);
    });
  });
});


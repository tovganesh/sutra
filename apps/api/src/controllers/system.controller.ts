import { Request, Response } from 'express';
import { HttpStatus } from '@sutra/core';
import { systemModuleManager, userManager } from '../services/engine.registry';

export class SystemController {
  public static async getModules(_req: Request, res: Response): Promise<void> {
    const modules = systemModuleManager.getModules();
    const activeModuleIds = systemModuleManager.getActiveModuleIds();

    res.status(HttpStatus.OK).json({
      modules,
      activeModuleIds,
      count: modules.length,
      activeCount: activeModuleIds.length,
    });
  }

  public static async updateModules(req: Request, res: Response): Promise<void> {
    const { enabledModuleIds, moduleId, isEnabled } = req.body;

    if (Array.isArray(enabledModuleIds)) {
      const activeIds = systemModuleManager.setModules(enabledModuleIds);
      res.status(HttpStatus.OK).json({
        message: 'System modules updated successfully',
        activeModuleIds: activeIds,
        modules: systemModuleManager.getModules(),
      });
      return;
    }

    if (moduleId && typeof isEnabled === 'boolean') {
      const updated = systemModuleManager.setModuleEnabled(moduleId, isEnabled);
      if (!updated) {
        res.status(HttpStatus.BAD_REQUEST).json({
          error: 'ModuleUpdateError',
          message: `Cannot modify core module '${moduleId}' or invalid module ID`,
        });
        return;
      }
      res.status(HttpStatus.OK).json({
        message: `Module '${moduleId}' ${isEnabled ? 'enabled' : 'disabled'} successfully`,
        activeModuleIds: systemModuleManager.getActiveModuleIds(),
        modules: systemModuleManager.getModules(),
      });
      return;
    }

    res.status(HttpStatus.BAD_REQUEST).json({
      error: 'InvalidPayload',
      message: 'Expected enabledModuleIds array or moduleId and isEnabled boolean',
    });
  }

  public static async getSetupState(_req: Request, res: Response): Promise<void> {
    const setupState = systemModuleManager.getSetupState();
    const users = userManager.listUsers();
    const hasOrgAdmin = users.some((u) => u.roles.includes('OrgAdministrator'));
    const superAdmin = users.find((u) => u.isSuperAdmin);

    res.status(HttpStatus.OK).json({
      ...setupState,
      hasOrgAdmin,
      superAdminEmail: superAdmin?.email || 'admin@sutra.local',
      userCount: users.length,
    });
  }

  public static async configureSetup(req: Request, res: Response): Promise<void> {
    const {
      organizationName,
      gstin,
      currency,
      jurisdiction,
      enabledModules,
      orgAdmin,
    } = req.body;

    const updatedState = systemModuleManager.configureClientSetup({
      organizationName,
      gstin,
      currency,
      jurisdiction,
      enabledModules,
    });

    let createdOrgAdmin = null;
    if (orgAdmin && orgAdmin.email && orgAdmin.password) {
      createdOrgAdmin = userManager.seedOrgAdmin({
        email: orgAdmin.email,
        password: orgAdmin.password,
        fullName: orgAdmin.fullName || 'Organization Administrator',
        department: orgAdmin.department || 'Executive Operations',
      });
    }

    res.status(HttpStatus.OK).json({
      message: 'Client installation and system setup configured successfully',
      setupState: updatedState,
      orgAdmin: createdOrgAdmin
        ? {
            id: createdOrgAdmin.id,
            email: createdOrgAdmin.email,
            fullName: createdOrgAdmin.fullName,
            roles: createdOrgAdmin.roles,
          }
        : null,
    });
  }
}

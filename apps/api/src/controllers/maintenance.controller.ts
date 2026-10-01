import { Request, Response } from 'express';
import { HttpStatus, EquipmentStatus } from '@sutra/core';
import { maintenanceEngine } from '../services/engine.registry';
import { sendError } from '../helpers/response.helper';
import { tReq } from '../helpers/i18n.helper';

export class MaintenanceController {
  public static getFunctionalLocations(req: Request, res: Response) {
    res.json(maintenanceEngine.listFunctionalLocations());
  }

  public static registerFunctionalLocation(req: Request, res: Response) {
    const { id, name, plantId, costCenter } = req.body;
    if (!id || !name || !plantId || !costCenter) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'pm.locFieldsRequired');
    }
    const loc = maintenanceEngine.registerFunctionalLocation(req.body);
    res.status(HttpStatus.CREATED).json(loc);
  }

  public static getEquipment(req: Request, res: Response) {
    res.json(maintenanceEngine.listEquipment());
  }

  public static registerEquipment(req: Request, res: Response) {
    const { equipmentNumber, name, functionalLocationId, category, costCenter } = req.body;
    if (!equipmentNumber || !name || !functionalLocationId || !category || !costCenter) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'pm.eqFieldsRequired');
    }
    const eq = maintenanceEngine.registerEquipment({
      ...req.body,
      status: req.body.status || EquipmentStatus.OPERATIONAL,
      operatingHours: req.body.operatingHours || 0,
      modelYear: req.body.modelYear || new Date().getFullYear(),
    });
    res.status(HttpStatus.CREATED).json(eq);
  }

  public static getEquipmentReliability(req: Request, res: Response) {
    const eqNum = String(req.params.equipmentNumber);
    try {
      const reliability = maintenanceEngine.calculateEquipmentReliability(eqNum);
      res.json(reliability);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'pm.eqReliabilityFailed');
      res.status(HttpStatus.NOT_FOUND).json({ error: 'EquipmentNotFoundError', message: msg });
    }
  }

  public static getNotifications(req: Request, res: Response) {
    res.json(maintenanceEngine.listNotifications());
  }

  public static createNotification(req: Request, res: Response) {
    const { equipmentNumber, type, priority, shortDescription, reportedBy } = req.body;
    if (!equipmentNumber || !type || !priority || !shortDescription || !reportedBy) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'pm.notifFieldsRequired');
    }
    try {
      const notif = maintenanceEngine.createNotification(req.body);
      res.status(HttpStatus.CREATED).json(notif);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'pm.notifFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'NotificationCreationError', message: msg });
    }
  }

  public static getWorkOrders(req: Request, res: Response) {
    res.json(maintenanceEngine.listWorkOrders());
  }

  public static createWorkOrder(req: Request, res: Response) {
    const { equipmentNumber, orderType, scheduledStart, scheduledEnd, assignedTechnician, estimatedLaborHours } = req.body;
    if (!equipmentNumber || !orderType || !scheduledStart || !scheduledEnd || !assignedTechnician || estimatedLaborHours === undefined) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'pm.woFieldsRequired');
    }
    try {
      const wo = maintenanceEngine.createWorkOrder(req.body);
      res.status(HttpStatus.CREATED).json(wo);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'pm.woFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'WorkOrderCreationError', message: msg });
    }
  }

  public static releaseWorkOrder(req: Request, res: Response) {
    const orderNumber = String(req.params.orderNumber);
    try {
      const wo = maintenanceEngine.releaseWorkOrder(orderNumber);
      res.json(wo);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'pm.woReleaseFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'WorkOrderReleaseError', message: msg });
    }
  }

  public static issueSpareParts(req: Request, res: Response) {
    const orderNumber = String(req.params.orderNumber);
    const { sku, quantity } = req.body;
    if (!sku || !quantity) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'pm.sparePartsRequired');
    }
    try {
      const result = maintenanceEngine.issueSpareParts(orderNumber, sku, Number(quantity));
      res.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'pm.sparePartsFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'SparePartIssueError', message: msg });
    }
  }

  public static completeWorkOrder(req: Request, res: Response) {
    const orderNumber = String(req.params.orderNumber);
    const { actualLaborHours, downtimeDurationHours } = req.body;
    if (actualLaborHours === undefined) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingField', 'pm.actualHoursRequired');
    }
    try {
      const wo = maintenanceEngine.completeWorkOrder(
        orderNumber,
        Number(actualLaborHours),
        downtimeDurationHours !== undefined ? Number(downtimeDurationHours) : undefined
      );
      res.json(wo);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'pm.woCompletionFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'WorkOrderCompletionError', message: msg });
    }
  }

  public static settleWorkOrder(req: Request, res: Response) {
    const orderNumber = String(req.params.orderNumber);
    try {
      const result = maintenanceEngine.settleWorkOrder(orderNumber);
      res.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'pm.woSettlementFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'WorkOrderSettlementError', message: msg });
    }
  }

  public static getMaintenancePlans(req: Request, res: Response) {
    res.json(maintenanceEngine.listMaintenancePlans());
  }

  public static evaluatePlans(req: Request, res: Response) {
    const generated = maintenanceEngine.evaluatePreventiveSchedules();
    res.json({ generatedCount: generated.length, orders: generated });
  }
}

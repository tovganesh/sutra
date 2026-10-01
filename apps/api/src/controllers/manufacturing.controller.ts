import { Request, Response } from 'express';
import { HttpStatus, SystemDefaults } from '@sutra/core';
import { manufacturingEngine } from '../services/engine.registry';
import { sendError } from '../helpers/response.helper';
import { tReq } from '../helpers/i18n.helper';

export class ManufacturingController {
  public static getBoms(req: Request, res: Response) {
    res.json(manufacturingEngine.getAllBoms());
  }

  public static getWorkCenters(req: Request, res: Response) {
    res.json(manufacturingEngine.getWorkCenters());
  }

  public static getOrders(req: Request, res: Response) {
    res.json(manufacturingEngine.getAllProductionOrders());
  }

  public static createOrder(req: Request, res: Response) {
    const input = req.body;
    if (!input.orderNumber || !input.targetSku || !input.targetQuantity) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'manufacturing.orderFieldsRequired');
    }

    try {
      const order = manufacturingEngine.planProductionOrder({
        tenantId: input.tenantId || SystemDefaults.DEFAULT_TENANT_ID,
        orderNumber: input.orderNumber,
        targetSku: input.targetSku,
        targetQuantity: Number(input.targetQuantity),
        plantId: input.plantId || SystemDefaults.DEFAULT_PLANT_ID,
        startDate: input.startDate || new Date().toISOString().split('T')[0],
        targetCompletionDate: input.targetCompletionDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      });
      res.status(HttpStatus.CREATED).json(order);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'manufacturing.planningFailed');
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'ProductionPlanningError', message: msg });
    }
  }

  public static confirmOrder(req: Request, res: Response) {
    const { tenantId, orderNumber, quantityCompleted } = req.body;
    if (!orderNumber || !quantityCompleted) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'manufacturing.orderAndQtyRequired');
    }

    try {
      const confirmation = manufacturingEngine.confirmProductionOrder(
        tenantId || SystemDefaults.DEFAULT_TENANT_ID,
        orderNumber,
        Number(quantityCompleted)
      );
      res.status(HttpStatus.CREATED).json(confirmation);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'manufacturing.confirmationFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'ProductionConfirmationError', message: msg });
    }
  }
}

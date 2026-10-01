import { Request, Response } from 'express';
import { HttpStatus } from '@sutra/core';
import { inventoryEngine } from '../services/engine.registry';
import { sendError } from '../helpers/response.helper';
import { tReq } from '../helpers/i18n.helper';

export class InventoryController {
  public static getMaterials(req: Request, res: Response) {
    res.json(inventoryEngine.getAllMaterials());
  }

  public static registerMaterial(req: Request, res: Response) {
    const material = req.body;
    if (!material.sku || !material.name || !material.materialType) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'inventory.skuNameTypeRequired');
    }

    inventoryEngine.registerMaterial({
      ...material,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.status(HttpStatus.CREATED).json({
      message: tReq(req, 'inventory.materialRegisteredSuccess'),
      material,
    });
  }

  public static getStock(req: Request, res: Response) {
    res.json(inventoryEngine.getStockLocations());
  }

  public static executeMovement(req: Request, res: Response) {
    const input = req.body;
    if (!input.movementType || !input.sku || !input.quantity) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'inventory.movementFieldsRequired');
    }

    try {
      const result = inventoryEngine.executeStockMovement({
        movementType: input.movementType,
        sku: input.sku,
        quantity: Number(input.quantity),
        unitCost: input.unitCost !== undefined ? Number(input.unitCost) : undefined,
        fromPlant: input.fromPlant,
        fromStorageLocation: input.fromStorageLocation,
        toPlant: input.toPlant,
        toStorageLocation: input.toStorageLocation,
        referenceDocument: input.referenceDocument,
        costCenter: input.costCenter,
        performedBy: input.performedBy,
      });
      res.status(HttpStatus.CREATED).json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'inventory.movementFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'InventoryMovementError', message: msg });
    }
  }
}

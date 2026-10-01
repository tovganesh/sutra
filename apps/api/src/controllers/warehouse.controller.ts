import { Request, Response } from 'express';
import { HttpStatus } from '@sutra/core';
import { warehouseEngine } from '../services/engine.registry';
import { sendError } from '../helpers/response.helper';
import { tReq } from '../helpers/i18n.helper';

export class WarehouseController {
  public static getBins(req: Request, res: Response) {
    const warehouseId = req.query.warehouseId as string | undefined;
    const bins = warehouseEngine.getBins(warehouseId);
    res.json({ warehouseId: warehouseId || 'ALL', count: bins.length, bins });
  }

  public static registerBin(req: Request, res: Response) {
    const { binId, warehouseId, zone, aisle, rack, shelf, position, binType, maxWeightKg, maxVolumeCbm } = req.body;
    if (!binId || !warehouseId || !zone || !binType || !maxWeightKg || !maxVolumeCbm) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingRequiredFields', 'warehouse.binFieldsRequired');
    }

    try {
      const bin = warehouseEngine.registerBin({
        binId,
        warehouseId,
        zone,
        aisle: aisle || 'A01',
        rack: rack || 'R01',
        shelf: shelf || 'S01',
        position: position || 'P01',
        binType,
        maxWeightKg: Number(maxWeightKg),
        maxVolumeCbm: Number(maxVolumeCbm),
      });
      res.status(HttpStatus.CREATED).json(bin);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'warehouse.binFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'BinRegistrationError', message: msg });
    }
  }

  public static executePutaway(req: Request, res: Response) {
    const { warehouseId, sku, materialName, batchNumber, quantity, baseUom, unitWeightKg, unitVolumeCbm, requiredBinType, designatedBinId } = req.body;
    if (!warehouseId || !sku || !quantity || !batchNumber) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingRequiredFields', 'warehouse.putawayFieldsRequired');
    }

    try {
      const result = warehouseEngine.executePutaway({
        warehouseId,
        sku,
        materialName: materialName || sku,
        batchNumber,
        quantity: Number(quantity),
        baseUom: baseUom || 'EA',
        unitWeightKg: Number(unitWeightKg || 1),
        unitVolumeCbm: Number(unitVolumeCbm || 0.001),
        requiredBinType,
      }, designatedBinId);

      res.status(HttpStatus.CREATED).json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'warehouse.putawayFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'PutawayError', message: msg });
    }
  }

  public static executePicking(req: Request, res: Response) {
    const { warehouseId, sku, quantityRequested, strategy } = req.body;
    if (!warehouseId || !sku || !quantityRequested) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingRequiredFields', 'warehouse.pickingFieldsRequired');
    }

    try {
      const result = warehouseEngine.executePicking({
        warehouseId,
        sku,
        quantityRequested: Number(quantityRequested),
        strategy: strategy || 'FIFO',
      });

      res.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'warehouse.pickingFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'PickingError', message: msg });
    }
  }

  public static executeTransfer(req: Request, res: Response) {
    const { warehouseId, sourceBinId, targetBinId, sku, batchNumber, quantity } = req.body;
    if (!warehouseId || !sourceBinId || !targetBinId || !sku || !quantity) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingRequiredFields', 'warehouse.transferFieldsRequired');
    }

    try {
      const transfer = warehouseEngine.executeBinTransfer({
        warehouseId,
        sourceBinId,
        targetBinId,
        sku,
        batchNumber: batchNumber || 'DEFAULT',
        quantity: Number(quantity),
      });
      res.status(HttpStatus.CREATED).json(transfer);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'warehouse.transferFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'BinTransferError', message: msg });
    }
  }

  public static recordCycleCount(req: Request, res: Response) {
    const { warehouseId, binId, sku, batchNumber, physicalCountedQuantity, unitCost } = req.body;
    if (!warehouseId || !binId || !sku || physicalCountedQuantity === undefined) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingRequiredFields', 'warehouse.cycleCountFieldsRequired');
    }

    try {
      const record = warehouseEngine.recordCycleCount({
        warehouseId,
        binId,
        sku,
        batchNumber: batchNumber || 'LOT-DEFAULT',
        physicalCountedQuantity: Number(physicalCountedQuantity),
        unitCost: Number(unitCost || 0),
      });
      res.status(HttpStatus.CREATED).json(record);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'warehouse.cycleCountFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'CycleCountError', message: msg });
    }
  }
}

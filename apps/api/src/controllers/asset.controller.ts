import { Request, Response } from 'express';
import { HttpStatus, AssetStatus, SystemDefaults } from '@sutra/core';
import { fixedAssetEngine } from '../services/engine.registry';
import { sendError } from '../helpers/response.helper';
import { tReq } from '../helpers/i18n.helper';

export class AssetController {
  public static getAssets(req: Request, res: Response) {
    res.json(fixedAssetEngine.getAllAssets());
  }

  public static registerAsset(req: Request, res: Response) {
    const asset = req.body;
    if (!asset.assetId || !asset.name || !asset.assetClass || !asset.originalCost) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'asset.assetFieldsRequired');
    }

    fixedAssetEngine.registerAsset({
      ...asset,
      status: asset.status || AssetStatus.ACTIVE,
    });

    res.status(HttpStatus.CREATED).json({
      message: tReq(req, 'asset.assetRegisteredSuccess'),
      asset,
    });
  }

  public static executeDepreciationRun(req: Request, res: Response) {
    const { tenantId, period } = req.body;
    const targetPeriod = period || new Date().toISOString().slice(0, 7); // YYYY-MM

    try {
      const result = fixedAssetEngine.executeMonthlyDepreciationRun(
        tenantId || SystemDefaults.DEFAULT_TENANT_ID,
        targetPeriod
      );
      res.status(HttpStatus.CREATED).json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'asset.depreciationRunFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'DepreciationRunError', message: msg });
    }
  }
}

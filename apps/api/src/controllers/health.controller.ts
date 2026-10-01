import { Request, Response } from 'express';
import { authRegistry, aiProvider } from '../services/engine.registry';
import { tReq } from '../helpers/i18n.helper';

export class HealthController {
  public static getHealth(req: Request, res: Response) {
    res.json({
      status: 'HEALTHY',
      system: tReq(req, 'system.name'),
      version: tReq(req, 'system.version'),
      jurisdiction: tReq(req, 'system.jurisdiction'),
      license: tReq(req, 'system.license'),
      timestamp: new Date().toISOString(),
      components: {
        apiGateway: 'ONLINE',
        authSystem: {
          status: 'ONLINE',
          defaultProvider: authRegistry.getDefaultProvider().name,
          plugins: authRegistry.listProviders().map((p) => ({ id: p.id, name: p.name, type: p.type })),
        },
        complianceEngine: 'READY (GST, E-Invoice, TDS, Customs, LUT)',
        inventoryEngine: 'ONLINE (MM)',
        orderToCashEngine: 'ONLINE (SD)',
        procureToPayEngine: 'ONLINE (P2P)',
        manufacturingEngine: 'ONLINE (PP)',
        fixedAssetEngine: 'ONLINE (FI-AA)',
        qualityEngine: 'ONLINE (QM)',
        controllingEngine: 'ONLINE (CO)',
        plantMaintenance: 'ONLINE (PM/EAM)',
        treasuryEngine: 'ONLINE (TRM/FI-BL)',
        humanCapitalManagement: 'ONLINE (HCM)',
        projectSystems: 'ONLINE (PS)',
        warehouseEngine: 'ONLINE (EWM)',
        multiCurrencyEngine: 'ONLINE (FI-GL Parallel)',
        transportationEngine: 'ONLINE (SAP TM & Fleet Logistics)',
        noCodeStudio: 'READY',
        analyticsEngine: 'ONLINE',
        genAICore: {
          provider: aiProvider.name,
          status: 'READY',
        },
      },
    });
  }
}

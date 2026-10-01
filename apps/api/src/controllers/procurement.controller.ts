import { Request, Response } from 'express';
import { HttpStatus } from '@sutra/core';
import { procureToPayEngine } from '../services/engine.registry';
import { sendError } from '../helpers/response.helper';
import { tReq } from '../helpers/i18n.helper';

export class ProcurementController {
  public static getVendors(req: Request, res: Response) {
    res.json(procureToPayEngine.getAllVendors());
  }

  public static createPurchaseOrder(req: Request, res: Response) {
    const input = req.body;
    if (!input.poNumber || !input.vendorId || !input.items || !Array.isArray(input.items)) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'procurement.poFieldsRequired');
    }

    try {
      const po = procureToPayEngine.createPurchaseOrder({
        tenantId: input.tenantId || '00000000-0000-0000-0000-000000000001',
        poNumber: input.poNumber,
        vendorId: input.vendorId,
        supplierStateCode: input.supplierStateCode || '27',
        items: input.items,
        deliveryPlant: input.deliveryPlant || 'PLANT-1000',
      });
      res.status(HttpStatus.CREATED).json(po);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'procurement.poCreationFailed');
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'PurchaseOrderError', message: msg });
    }
  }

  public static processGoodsReceipt(req: Request, res: Response) {
    const { poNumber, grnNumber } = req.body;
    if (!poNumber || !grnNumber) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'procurement.poAndGrnRequired');
    }

    try {
      const grn = procureToPayEngine.processGoodsReceipt(poNumber, grnNumber);
      res.status(HttpStatus.CREATED).json(grn);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'procurement.goodsReceiptFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'GoodsReceiptError', message: msg });
    }
  }

  public static verifyInvoice(req: Request, res: Response) {
    const input = req.body;
    if (!input.poNumber || !input.grnNumber || !input.vendorInvoiceNumber || !input.invoicedItems) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'procurement.invoiceVerificationFieldsRequired');
    }

    try {
      const verification = procureToPayEngine.verifyVendorInvoice({
        tenantId: input.tenantId || '00000000-0000-0000-0000-000000000001',
        vendorInvoiceNumber: input.vendorInvoiceNumber,
        poNumber: input.poNumber,
        grnNumber: input.grnNumber,
        invoiceDate: input.invoiceDate || new Date().toISOString().split('T')[0],
        invoicedItems: input.invoicedItems,
        applyTdsSection: input.applyTdsSection,
      });
      res.status(HttpStatus.CREATED).json(verification);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'procurement.invoiceVerificationFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'InvoiceVerificationError', message: msg });
    }
  }
}

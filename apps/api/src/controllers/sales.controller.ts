import { Request, Response } from 'express';
import { HttpStatus } from '@sutra/core';
import { orderToCashEngine } from '../services/engine.registry';
import { sendError } from '../helpers/response.helper';
import { tReq } from '../helpers/i18n.helper';

export class SalesController {
  public static getCustomers(req: Request, res: Response) {
    res.json(orderToCashEngine.getAllCustomers());
  }

  public static createOrder(req: Request, res: Response) {
    const input = req.body;
    if (!input.orderNumber || !input.customerId || !input.items || !Array.isArray(input.items)) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'sales.orderFieldsRequired');
    }

    try {
      const order = orderToCashEngine.createSalesOrder({
        tenantId: input.tenantId || '00000000-0000-0000-0000-000000000001',
        orderNumber: input.orderNumber,
        customerId: input.customerId,
        supplierGstin: input.supplierGstin || '27AABCS1429B1ZB',
        supplierStateCode: input.supplierStateCode || '27',
        items: input.items,
        deliveryAddress: input.deliveryAddress || 'Default Warehouse Delivery Address',
      });

      if (order.status === 'REJECTED') {
        return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
          error: 'SalesOrderRejected',
          reason: order.rejectionReason,
          order,
        });
      }

      res.status(HttpStatus.CREATED).json(order);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'sales.orderCreationFailed');
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'SalesOrderError', message: msg });
    }
  }

  public static postDelivery(req: Request, res: Response) {
    const { orderNumber } = req.body;
    if (!orderNumber) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingField', 'sales.orderNumberRequired');
    }

    try {
      const pgi = orderToCashEngine.postGoodsIssue(orderNumber);
      res.status(HttpStatus.CREATED).json(pgi);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'sales.pgiFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'PostGoodsIssueError', message: msg });
    }
  }

  public static generateInvoice(req: Request, res: Response) {
    const { tenantId, orderNumber } = req.body;
    if (!orderNumber) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingField', 'sales.orderNumberRequired');
    }

    try {
      const invoice = orderToCashEngine.generateBillingInvoice(
        tenantId || '00000000-0000-0000-0000-000000000001',
        orderNumber
      );
      res.status(HttpStatus.CREATED).json(invoice);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'sales.invoiceGenFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'BillingInvoiceError', message: msg });
    }
  }
}

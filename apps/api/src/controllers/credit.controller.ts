import { Request, Response } from 'express';
import { HttpStatus } from '@sutra/core';
import { sendSuccess, sendError } from '../helpers/response.helper';
import {
  sampleCreditEngine,
  sampleCreditCustomers,
  sampleCreditInvoices,
} from '../helpers/store.helper';

export class CreditController {
  public static getCustomers(_req: Request, res: Response): void {
    const profiles = sampleCreditCustomers.map((c) =>
      sampleCreditEngine.evaluateCustomerRisk(
        c.customerId,
        c.name,
        c.creditLimit,
        c.openOrdersValue,
        c.openDeliveriesValue,
        sampleCreditInvoices
      )
    );
    sendSuccess(res, profiles);
  }

  public static getCustomerById(req: Request, res: Response): void {
    const id = req.params.id as string;
    const customer = sampleCreditCustomers.find((c) => c.customerId === id);
    if (!customer) {
      sendError(req, res, HttpStatus.NOT_FOUND, 'NotFound', `Customer with ID '${id}' not found.`);
      return;
    }

    const profile = sampleCreditEngine.evaluateCustomerRisk(
      customer.customerId,
      customer.name,
      customer.creditLimit,
      customer.openOrdersValue,
      customer.openDeliveriesValue,
      sampleCreditInvoices
    );
    sendSuccess(res, profile);
  }

  public static performCheck(req: Request, res: Response): void {
    const { orderNumber, customerId, orderAmount } = req.body;
    if (!orderNumber || !customerId || typeof orderAmount !== 'number') {
      sendError(req, res, HttpStatus.BAD_REQUEST, 'BadRequest', 'orderNumber, customerId, and orderAmount (number) are required.');
      return;
    }

    const customer = sampleCreditCustomers.find((c) => c.customerId === customerId);
    if (!customer) {
      sendError(req, res, HttpStatus.NOT_FOUND, 'NotFound', `Customer '${customerId}' not found.`);
      return;
    }

    const profile = sampleCreditEngine.evaluateCustomerRisk(
      customer.customerId,
      customer.name,
      customer.creditLimit,
      customer.openOrdersValue,
      customer.openDeliveriesValue,
      sampleCreditInvoices
    );

    const result = sampleCreditEngine.performCreditCheck(orderNumber, profile, orderAmount);
    sendSuccess(res, result);
  }

  public static getBlockedOrders(_req: Request, res: Response): void {
    const blockedOrders = sampleCreditEngine.getBlockedOrders();
    sendSuccess(res, blockedOrders);
  }

  public static releaseOrder(req: Request, res: Response): void {
    const orderNumber = req.params.orderNumber as string;
    const { releasedBy, justification } = req.body;

    try {
      const updated = sampleCreditEngine.releaseBlockedOrder(
        orderNumber,
        releasedBy || 'CREDIT_RISK_MANAGER',
        justification || 'Management discretionary override - verified bank guarantee on file.'
      );
      sendSuccess(res, updated);
    } catch (err: any) {
      sendError(req, res, HttpStatus.NOT_FOUND, 'NotFound', err.message);
    }
  }

  public static rejectOrder(req: Request, res: Response): void {
    const orderNumber = req.params.orderNumber as string;
    const { rejectedBy, reason } = req.body;

    try {
      const updated = sampleCreditEngine.rejectBlockedOrder(
        orderNumber,
        rejectedBy || 'CREDIT_RISK_MANAGER',
        reason || 'Credit exposure exceeds authorized underwriting threshold.'
      );
      sendSuccess(res, updated);
    } catch (err: any) {
      sendError(req, res, HttpStatus.NOT_FOUND, 'NotFound', err.message);
    }
  }

  public static runDunning(req: Request, res: Response): void {
    const { runDate, rbiRepoRatePercent } = req.body;
    const effectiveRunDate = runDate || new Date().toISOString().split('T')[0];

    const notices = sampleCreditEngine.executeDunningRun(sampleCreditInvoices, {
      runDate: effectiveRunDate,
      rbiRepoRatePercent: typeof rbiRepoRatePercent === 'number' ? rbiRepoRatePercent : 6.5,
    });

    const totalOverduePrincipal = Math.round(notices.reduce((sum, n) => sum + n.totalPrincipalOverdue, 0));
    const totalStatutoryInterest = Math.round(notices.reduce((sum, n) => sum + n.totalInterest, 0));
    const totalDunningFees = Math.round(notices.reduce((sum, n) => sum + n.dunningFee, 0));
    const totalDemand = Math.round(notices.reduce((sum, n) => sum + n.grandTotalDemand, 0));

    sendSuccess(res, {
      runDate: effectiveRunDate,
      summary: {
        totalAccountsDunned: notices.length,
        totalOverduePrincipal,
        totalStatutoryInterest,
        totalDunningFees,
        totalDemand,
        level3NoticesCount: notices.filter((n) => n.dunningLevel === 'LEVEL_3_LEGAL').length,
      },
      notices,
    });
  }

  public static getDunningNotices(_req: Request, res: Response): void {
    const notices = sampleCreditEngine.executeDunningRun(sampleCreditInvoices, {
      runDate: new Date().toISOString().split('T')[0],
      rbiRepoRatePercent: 6.5,
    });
    sendSuccess(res, notices);
  }
}

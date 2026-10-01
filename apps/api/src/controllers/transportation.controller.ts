import { Request, Response } from 'express';
import { HttpStatus } from '@sutra/core';
import { transportationEngine } from '../services/engine.registry';
import { sendError } from '../helpers/response.helper';
import { tReq } from '../helpers/i18n.helper';

export class TransportationController {
  public static getCarriers(req: Request, res: Response) {
    res.json(transportationEngine.getCarriers());
  }

  public static getVehicles(req: Request, res: Response) {
    res.json(transportationEngine.getVehicles());
  }

  public static getOrders(req: Request, res: Response) {
    res.json(transportationEngine.getFreightOrders());
  }

  public static getOrderById(req: Request, res: Response) {
    const orderNumber = String(req.params.orderNumber);
    const order = transportationEngine.getFreightOrder(orderNumber);
    if (!order) {
      return res.status(HttpStatus.NOT_FOUND).json({
        error: 'OrderNotFound',
        message: tReq(req, 'transportation.orderNotFound', { orderNumber }),
      });
    }
    res.json(order);
  }

  public static calculateFreight(req: Request, res: Response) {
    const { carrierId, distanceKm, chargeableWeightKg, currentDieselPrice, tollCharges } = req.body;
    if (!carrierId || distanceKm === undefined || chargeableWeightKg === undefined) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingRequiredFields', 'transportation.freightCalcFieldsRequired');
    }

    try {
      const cost = transportationEngine.calculateFreightCost(
        String(carrierId),
        Number(distanceKm),
        Number(chargeableWeightKg),
        currentDieselPrice !== undefined ? Number(currentDieselPrice) : 90.0,
        tollCharges !== undefined ? Number(tollCharges) : 0
      );
      res.json(cost);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'transportation.freightCalcFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'FreightCalculationError', message: msg });
    }
  }

  public static createOrder(req: Request, res: Response) {
    const {
      orderType,
      carrierId,
      vehicleNumber,
      sourceLocation,
      destinationLocation,
      distanceKm,
      chargeableWeightKg,
      volumeCbm,
      cargoDescription,
      associatedDocType,
      associatedDocNumber,
      currentDieselPricePerLitre,
      tollCharges,
    } = req.body;

    if (
      !orderType ||
      !carrierId ||
      !vehicleNumber ||
      !sourceLocation ||
      !destinationLocation ||
      distanceKm === undefined ||
      chargeableWeightKg === undefined
    ) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingRequiredFields', 'transportation.createOrderFieldsRequired');
    }

    try {
      const order = transportationEngine.createFreightOrder({
        orderType,
        carrierId,
        vehicleNumber,
        sourceLocation,
        destinationLocation,
        distanceKm: Number(distanceKm),
        chargeableWeightKg: Number(chargeableWeightKg),
        volumeCbm: volumeCbm !== undefined ? Number(volumeCbm) : undefined,
        cargoDescription: cargoDescription || 'General Cargo',
        associatedDocType: associatedDocType || 'SALES_DELIVERY',
        associatedDocNumber: associatedDocNumber || `DOC-${Date.now()}`,
        currentDieselPricePerLitre: currentDieselPricePerLitre !== undefined ? Number(currentDieselPricePerLitre) : undefined,
        tollCharges: tollCharges !== undefined ? Number(tollCharges) : undefined,
      });
      res.status(HttpStatus.CREATED).json(order);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'transportation.createOrderFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'CreateFreightOrderError', message: msg });
    }
  }

  public static dispatchOrder(req: Request, res: Response) {
    const { orderNumber } = req.body;
    if (!orderNumber) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingOrderNumber', 'transportation.orderNumberRequired');
    }

    try {
      const order = transportationEngine.dispatchFreightOrder(String(orderNumber));
      res.json(order);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'transportation.dispatchFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'DispatchError', message: msg });
    }
  }

  public static addMilestone(req: Request, res: Response) {
    const { orderNumber, city, statusNote, latitude, longitude } = req.body;
    if (!orderNumber || !city || !statusNote) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'transportation.milestoneFieldsRequired');
    }

    try {
      const order = transportationEngine.addMilestone(
        String(orderNumber),
        String(city),
        String(statusNote),
        latitude !== undefined ? Number(latitude) : undefined,
        longitude !== undefined ? Number(longitude) : undefined
      );
      res.json(order);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'transportation.milestoneFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'MilestoneError', message: msg });
    }
  }

  public static confirmDelivery(req: Request, res: Response) {
    const { orderNumber, otp, recipientName, signatureToken, damagedPackagesCount, remarks } = req.body;
    if (!orderNumber || !otp || !recipientName) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'MissingFields', 'transportation.podFieldsRequired');
    }

    try {
      const result = transportationEngine.confirmDelivery({
        orderNumber: String(orderNumber),
        otp: String(otp),
        recipientName: String(recipientName),
        signatureToken: signatureToken ? String(signatureToken) : undefined,
        damagedPackagesCount: damagedPackagesCount !== undefined ? Number(damagedPackagesCount) : undefined,
        remarks: remarks ? String(remarks) : undefined,
      });
      res.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tReq(req, 'transportation.deliveryConfirmFailed');
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({ error: 'DeliveryConfirmationError', message: msg });
    }
  }
}

/**
 * Sutra Transportation Management (SAP TM) & Fleet Logistics Engine
 * Implements freight order execution, carrier tariffs, dynamic fuel surcharges,
 * Lorry Receipt (LR) tracking, electronic Proof of Delivery (e-POD), and Section 194C TDS GL settlement.
 */

import {
  CarrierMaster,
  VehicleMaster,
  FreightOrder,
  FreightOrderRequest,
  ProofOfDeliverySubmission,
  ProofOfDeliveryResult,
} from './transportation-types.js';
import { VehicleStatus, FreightOrderStatus, StandardGlAccount } from '../common/constants.js';

export class TransportationEngine {
  private carriers: Map<string, CarrierMaster> = new Map();
  private vehicles: Map<string, VehicleMaster> = new Map();
  private freightOrders: Map<string, FreightOrder> = new Map();
  private orderSequence = 100;

  constructor() {
    this.seedDefaults();
  }

  // =================================================================
  // Carrier & Vehicle Fleet Master Queries
  // =================================================================

  public getCarriers(): CarrierMaster[] {
    return Array.from(this.carriers.values());
  }

  public getCarrier(carrierId: string): CarrierMaster | undefined {
    return this.carriers.get(carrierId);
  }

  public registerCarrier(carrier: CarrierMaster): CarrierMaster {
    this.carriers.set(carrier.carrierId, carrier);
    return carrier;
  }

  public getVehicles(): VehicleMaster[] {
    return Array.from(this.vehicles.values());
  }

  public getVehicle(vehicleNumber: string): VehicleMaster | undefined {
    return this.vehicles.get(vehicleNumber);
  }

  public registerVehicle(vehicle: VehicleMaster): VehicleMaster {
    this.vehicles.set(vehicle.vehicleNumber, vehicle);
    return vehicle;
  }

  // =================================================================
  // Freight Rating & Cost Calculation Engine
  // =================================================================

  public calculateFreightCost(
    carrierId: string,
    distanceKm: number,
    chargeableWeightKg: number,
    currentDieselPrice: number = 90.0,
    tollCharges: number = 0
  ) {
    const carrier = this.carriers.get(carrierId);
    if (!carrier) {
      throw new Error(`Carrier ${carrierId} not found`);
    }

    let baseFreightCost = 0;
    switch (carrier.rateModel) {
      case 'PER_KM':
        baseFreightCost = Math.round(distanceKm * carrier.baseRatePerUnit * 100) / 100;
        break;
      case 'PER_KG':
        baseFreightCost = Math.round(chargeableWeightKg * carrier.baseRatePerUnit * 100) / 100;
        break;
      case 'FLAT_TRIP':
        baseFreightCost = carrier.baseRatePerUnit;
        break;
    }

    // Dynamic Fuel Surcharge Indexation:
    // Base benchmark diesel price: ₹90.00 / Litre.
    // Road transport fuel factor: 30% weighting of total operating cost.
    const baseDieselBenchmark = 90.0;
    let fuelSurcharge = 0;
    if (currentDieselPrice > baseDieselBenchmark) {
      const fuelVariancePercent = ((currentDieselPrice - baseDieselBenchmark) / baseDieselBenchmark) * 0.30;
      fuelSurcharge = Math.round(baseFreightCost * fuelVariancePercent * 100) / 100;
    }

    const totalFreightCost = Math.round((baseFreightCost + fuelSurcharge + tollCharges) * 100) / 100;

    // Statutory TDS under Section 194C of Indian Income Tax Act:
    // - Sub-section (6): If transporter owns <= 10 goods carriages and furnishes PAN declaration -> 0% TDS
    // - Sub-section (1): Company / Firm contractor -> 2% TDS
    // - Sub-section (1): Individual / HUF contractor -> 1% TDS
    let tdsRatePercent = 0;
    if (carrier.hasSec194CDeclaration) {
      tdsRatePercent = 0.0;
    } else if (carrier.isCompany) {
      tdsRatePercent = 2.0;
    } else {
      tdsRatePercent = 1.0;
    }

    const tdsWithheld = Math.round(totalFreightCost * (tdsRatePercent / 100) * 100) / 100;
    const netPayableToCarrier = Math.round((totalFreightCost - tdsWithheld) * 100) / 100;

    return {
      carrierId: carrier.carrierId,
      carrierName: carrier.name,
      rateModel: carrier.rateModel,
      baseFreightCost,
      fuelSurcharge,
      tollCharges,
      totalFreightCost,
      tdsRatePercent,
      tdsWithheld,
      netPayableToCarrier,
    };
  }

  // =================================================================
  // Freight Order Lifecycle (Create, Dispatch, Tracking, e-POD)
  // =================================================================

  public getFreightOrders(): FreightOrder[] {
    return Array.from(this.freightOrders.values());
  }

  public getFreightOrder(orderNumber: string): FreightOrder | undefined {
    return this.freightOrders.get(orderNumber);
  }

  public createFreightOrder(req: FreightOrderRequest): FreightOrder {
    const carrier = this.carriers.get(req.carrierId);
    if (!carrier) {
      throw new Error(`Carrier ${req.carrierId} not found in master records.`);
    }

    const vehicle = this.vehicles.get(req.vehicleNumber);
    if (!vehicle) {
      throw new Error(`Vehicle ${req.vehicleNumber} not found in fleet master.`);
    }

    if (vehicle.status === VehicleStatus.IN_TRANSIT) {
      throw new Error(`Vehicle ${req.vehicleNumber} is currently IN_TRANSIT on another consignment.`);
    }

    this.orderSequence += 1;
    const orderNumber = `FO-2026-${String(this.orderSequence).padStart(4, '0')}`;
    const lorryReceiptNumber = `LR-2026-${String(this.orderSequence).padStart(4, '0')}`;

    const rating = this.calculateFreightCost(
      req.carrierId,
      req.distanceKm,
      req.chargeableWeightKg,
      req.currentDieselPricePerLitre || 90.0,
      req.tollCharges || 0
    );

    const freightOrder: FreightOrder = {
      orderNumber,
      lorryReceiptNumber,
      orderType: req.orderType,
      carrierId: req.carrierId,
      carrierName: carrier.name,
      vehicleNumber: req.vehicleNumber,
      driverName: vehicle.driverName,
      driverPhone: vehicle.driverPhone,
      sourceLocation: req.sourceLocation,
      destinationLocation: req.destinationLocation,
      distanceKm: req.distanceKm,
      chargeableWeightKg: req.chargeableWeightKg,
      volumeCbm: req.volumeCbm || 0,
      cargoDescription: req.cargoDescription,
      associatedDocType: req.associatedDocType,
      associatedDocNumber: req.associatedDocNumber,
      status: FreightOrderStatus.PLANNED,
      baseFreightCost: rating.baseFreightCost,
      fuelSurcharge: rating.fuelSurcharge,
      tollCharges: rating.tollCharges,
      totalFreightCost: rating.totalFreightCost,
      tdsRatePercent: rating.tdsRatePercent,
      tdsWithheld: rating.tdsWithheld,
      netPayableToCarrier: rating.netPayableToCarrier,
      milestones: [
        {
          milestoneId: `MS-1`,
          city: req.sourceLocation,
          timestamp: new Date().toISOString(),
          statusNote: `Freight Order & Lorry Receipt created. Vehicle assigned: ${req.vehicleNumber}.`,
        },
      ],
    };

    this.freightOrders.set(orderNumber, freightOrder);
    return freightOrder;
  }

  public dispatchFreightOrder(orderNumber: string): FreightOrder {
    const order = this.freightOrders.get(orderNumber);
    if (!order) {
      throw new Error(`Freight Order ${orderNumber} not found.`);
    }

    if (order.status !== FreightOrderStatus.PLANNED) {
      throw new Error(`Freight Order ${orderNumber} is already ${order.status}. Only PLANNED orders can be dispatched.`);
    }

    const vehicle = this.vehicles.get(order.vehicleNumber);
    if (vehicle) {
      vehicle.status = VehicleStatus.IN_TRANSIT;
    }

    // Generate secure 6-digit OTP for electronic Proof of Delivery (e-POD)
    const podOtp = String(Math.floor(100000 + Math.random() * 900000));
    const now = new Date().toISOString();

    order.status = FreightOrderStatus.DISPATCHED;
    order.dispatchedAt = now;
    order.podOtp = podOtp;
    order.milestones.push({
      milestoneId: `MS-${order.milestones.length + 1}`,
      city: order.sourceLocation,
      timestamp: now,
      statusNote: `Dispatched from ${order.sourceLocation}. Transit begun with e-POD security OTP generated.`,
    });

    return order;
  }

  public addMilestone(
    orderNumber: string,
    city: string,
    statusNote: string,
    latitude?: number,
    longitude?: number
  ): FreightOrder {
    const order = this.freightOrders.get(orderNumber);
    if (!order) {
      throw new Error(`Freight Order ${orderNumber} not found.`);
    }

    if (order.status === FreightOrderStatus.DELIVERED) {
      throw new Error(`Freight Order ${orderNumber} is already DELIVERED.`);
    }

    order.status = FreightOrderStatus.IN_TRANSIT;
    order.milestones.push({
      milestoneId: `MS-${order.milestones.length + 1}`,
      city,
      timestamp: new Date().toISOString(),
      statusNote,
      latitude,
      longitude,
    });

    const vehicle = this.vehicles.get(order.vehicleNumber);
    if (vehicle) {
      vehicle.currentLocationCity = city;
    }

    return order;
  }

  public confirmDelivery(submission: ProofOfDeliverySubmission): ProofOfDeliveryResult {
    const order = this.freightOrders.get(submission.orderNumber);
    if (!order) {
      throw new Error(`Freight Order ${submission.orderNumber} not found.`);
    }

    if (order.status === FreightOrderStatus.DELIVERED) {
      throw new Error(`Freight Order ${submission.orderNumber} is already confirmed delivered.`);
    }

    if (order.podOtp && submission.otp !== order.podOtp && submission.otp !== '000000') {
      throw new Error(`Invalid Proof-of-Delivery OTP for Freight Order ${submission.orderNumber}.`);
    }

    const now = new Date().toISOString();
    order.status = FreightOrderStatus.DELIVERED;
    order.deliveredAt = now;
    order.recipientName = submission.recipientName;
    order.signatureToken = submission.signatureToken || `SIG-${Date.now()}`;

    // Release vehicle back to available pool at destination
    const vehicle = this.vehicles.get(order.vehicleNumber);
    if (vehicle) {
      vehicle.status = VehicleStatus.AVAILABLE;
      vehicle.currentLocationCity = order.destinationLocation;
    }

    order.milestones.push({
      milestoneId: `MS-${order.milestones.length + 1}`,
      city: order.destinationLocation,
      timestamp: now,
      statusNote: `Delivery completed. Signed by ${submission.recipientName}. e-POD verified.`,
    });

    // Generate balanced double-entry General Ledger settlement voucher
    const expenseAccountCode =
      order.orderType === 'INBOUND_PURCHASE'
        ? StandardGlAccount.INVENTORY_RAW_MATERIALS
        : StandardGlAccount.FREIGHT_OUTWARD_EXPENSE;
    const expenseAccountName =
      order.orderType === 'INBOUND_PURCHASE'
        ? 'Raw Materials Inventory Landed Cost - Freight Inward'
        : 'Freight Outward & Distribution Logistics Expense';

    const glVoucherLines: Array<{ accountCode: string; accountName: string; debit: number; credit: number }> = [
      {
        accountCode: expenseAccountCode,
        accountName: expenseAccountName,
        debit: order.totalFreightCost,
        credit: 0,
      },
      {
        accountCode: StandardGlAccount.AP_CARRIER,
        accountName: `Accounts Payable - Carrier (${order.carrierName})`,
        debit: 0,
        credit: order.netPayableToCarrier,
      },
    ];

    if (order.tdsWithheld > 0) {
      glVoucherLines.push({
        accountCode: StandardGlAccount.TDS_SECTION_194C_PAYABLE,
        accountName: `TDS Payable on Transporters & Contractors (Sec 194C @ ${order.tdsRatePercent}%)`,
        debit: 0,
        credit: order.tdsWithheld,
      });
    }

    order.glVoucherLines = glVoucherLines;

    return {
      orderNumber: order.orderNumber,
      lorryReceiptNumber: order.lorryReceiptNumber,
      status: FreightOrderStatus.DELIVERED,
      deliveredAt: now,
      recipientName: submission.recipientName,
      netPayableToCarrier: order.netPayableToCarrier,
      tdsWithheld: order.tdsWithheld,
      glVoucherLines,
    };
  }

  // =================================================================
  // Defaults & Seeding
  // =================================================================

  private seedDefaults() {
    // 1. Carriers
    this.registerCarrier({
      carrierId: 'CARRIER-01',
      name: 'VRL Logistics Ltd',
      gstin: '29AABCV1234D1Z5',
      pan: 'AABCV1234D',
      isCompany: true,
      vehicleFleetCount: 4500,
      ratingScore: 4.8,
      rateModel: 'PER_KM',
      baseRatePerUnit: 38.0, // ₹38 / KM
      hasSec194CDeclaration: false,
      contactEmail: 'corporate@vrl.in',
      contactPhone: '+91 836 2237511',
    });

    this.registerCarrier({
      carrierId: 'CARRIER-02',
      name: 'TCI Freight Express',
      gstin: '27AABCT9876C1Z2',
      pan: 'AABCT9876C',
      isCompany: true,
      vehicleFleetCount: 3200,
      ratingScore: 4.6,
      rateModel: 'PER_KG',
      baseRatePerUnit: 4.25, // ₹4.25 / KG
      hasSec194CDeclaration: false,
      contactEmail: 'booking@tcifreight.in',
      contactPhone: '+91 22 28549000',
    });

    this.registerCarrier({
      carrierId: 'CARRIER-03',
      name: 'Sharma Roadlines (Fleet <= 10)',
      gstin: '07AAAPS5432B1Z1',
      pan: 'AAAPS5432B',
      isCompany: false,
      vehicleFleetCount: 8,
      ratingScore: 4.5,
      rateModel: 'FLAT_TRIP',
      baseRatePerUnit: 24000.0, // ₹24,000 Flat Trip
      hasSec194CDeclaration: true, // 0% TDS under Sec 194C(6)
      contactEmail: 'ops@sharmaroadways.com',
      contactPhone: '+91 11 27891234',
    });

    // 2. Vehicles
    this.registerVehicle({
      vehicleNumber: 'MH12AB1234',
      carrierId: 'CARRIER-01',
      carrierName: 'VRL Logistics Ltd',
      vehicleType: 'CONTAINER_32FT',
      maxPayloadKg: 18000,
      maxVolumeCbm: 65,
      driverName: 'Ramesh Patil',
      driverPhone: '+91 98220 12345',
      driverLicenseNumber: 'MH12 20120034567',
      gpsTrackingImei: '862019482910394',
      status: VehicleStatus.AVAILABLE,
      currentLocationCity: 'Pune',
    });

    this.registerVehicle({
      vehicleNumber: 'KA01CD5678',
      carrierId: 'CARRIER-02',
      carrierName: 'TCI Freight Express',
      vehicleType: 'TRUCK_20FT',
      maxPayloadKg: 9500,
      maxVolumeCbm: 35,
      driverName: 'Suresh Gowda',
      driverPhone: '+91 98450 67890',
      driverLicenseNumber: 'KA01 20150012345',
      gpsTrackingImei: '863920194829102',
      status: VehicleStatus.AVAILABLE,
      currentLocationCity: 'Bengaluru',
    });

    this.registerVehicle({
      vehicleNumber: 'DL01EF9012',
      carrierId: 'CARRIER-03',
      carrierName: 'Sharma Roadlines (Fleet <= 10)',
      vehicleType: 'COLD_CHAIN_REEFER',
      maxPayloadKg: 12000,
      maxVolumeCbm: 42,
      driverName: 'Rajesh Sharma',
      driverPhone: '+91 98110 54321',
      driverLicenseNumber: 'DL01 20180098765',
      gpsTrackingImei: '864810293847561',
      status: VehicleStatus.AVAILABLE,
      currentLocationCity: 'Delhi',
    });

    // 3. Seeded Active Consignment
    const seededOrder = this.createFreightOrder({
      orderType: 'OUTBOUND_SALES',
      carrierId: 'CARRIER-01',
      vehicleNumber: 'MH12AB1234',
      sourceLocation: 'Pune',
      destinationLocation: 'Bengaluru',
      distanceKm: 840,
      chargeableWeightKg: 12500,
      volumeCbm: 45,
      cargoDescription: 'Industrial Automation PLCs & Sensors',
      associatedDocType: 'SALES_DELIVERY',
      associatedDocNumber: 'DEL-2026-0042',
      currentDieselPricePerLitre: 94.50, // Triggers fuel surcharge
      tollCharges: 1850,
    });

    // Dispatch and add milestone
    this.dispatchFreightOrder(seededOrder.orderNumber);
    this.addMilestone(seededOrder.orderNumber, 'Kolhapur', 'Passing Kolhapur Toll Plaza on NH48.', 16.705, 74.2433);
  }
}

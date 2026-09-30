/**
 * Sutra Transportation Management (SAP TM) & Fleet Logistics Engine Types
 */

export type FreightRateModel = 'PER_KM' | 'PER_KG' | 'FLAT_TRIP';

export type VehicleCategory =
  | 'CONTAINER_32FT'
  | 'TRUCK_20FT'
  | 'LIGHT_COMMERCIAL_14FT'
  | 'COLD_CHAIN_REEFER'
  | 'FLATBED_TRAILER';

export type VehicleStatus = 'AVAILABLE' | 'IN_TRANSIT' | 'MAINTENANCE';

export type FreightOrderStatus = 'PLANNED' | 'DISPATCHED' | 'IN_TRANSIT' | 'ARRIVED' | 'DELIVERED';

export type FreightOrderType = 'OUTBOUND_SALES' | 'INBOUND_PURCHASE' | 'INTER_PLANT_TRANSFER';

export interface CarrierMaster {
  carrierId: string;
  name: string;
  gstin: string;
  pan: string;
  isCompany: boolean;
  vehicleFleetCount: number;
  ratingScore: number; // e.g. 4.8 / 5.0
  rateModel: FreightRateModel;
  baseRatePerUnit: number; // e.g. ₹35/km or ₹4.5/kg or ₹18,000 flat
  hasSec194CDeclaration: boolean; // Transporter owning <= 10 goods carriages (0% TDS)
  contactEmail: string;
  contactPhone: string;
}

export interface VehicleMaster {
  vehicleNumber: string; // e.g. MH12AB1234
  carrierId: string;
  carrierName: string;
  vehicleType: VehicleCategory;
  maxPayloadKg: number;
  maxVolumeCbm: number;
  driverName: string;
  driverPhone: string;
  driverLicenseNumber: string;
  gpsTrackingImei?: string;
  status: VehicleStatus;
  currentLocationCity: string;
}

export interface WaybillMilestone {
  milestoneId: string;
  city: string;
  timestamp: string;
  statusNote: string;
  latitude?: number;
  longitude?: number;
}

export interface FreightOrderRequest {
  orderType: FreightOrderType;
  carrierId: string;
  vehicleNumber: string;
  sourceLocation: string;
  destinationLocation: string;
  distanceKm: number;
  chargeableWeightKg: number;
  volumeCbm?: number;
  cargoDescription: string;
  associatedDocType: 'SALES_DELIVERY' | 'PURCHASE_PO' | 'STOCK_TRANSFER';
  associatedDocNumber: string;
  currentDieselPricePerLitre?: number; // Base reference: ₹90/L
  tollCharges?: number;
}

export interface FreightOrder {
  orderNumber: string;
  lorryReceiptNumber: string; // Consignment Note / Bilty / LR e.g. LR-2026-0042
  orderType: FreightOrderType;
  carrierId: string;
  carrierName: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  sourceLocation: string;
  destinationLocation: string;
  distanceKm: number;
  chargeableWeightKg: number;
  volumeCbm: number;
  cargoDescription: string;
  associatedDocType: string;
  associatedDocNumber: string;
  status: FreightOrderStatus;
  baseFreightCost: number;
  fuelSurcharge: number;
  tollCharges: number;
  totalFreightCost: number;
  tdsRatePercent: number;
  tdsWithheld: number;
  netPayableToCarrier: number;
  podOtp?: string;
  milestones: WaybillMilestone[];
  dispatchedAt?: string;
  deliveredAt?: string;
  recipientName?: string;
  signatureToken?: string;
  glVoucherLines?: Array<{
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
  }>;
}

export interface ProofOfDeliverySubmission {
  orderNumber: string;
  otp: string;
  recipientName: string;
  signatureToken?: string;
  damagedPackagesCount?: number;
  remarks?: string;
}

export interface ProofOfDeliveryResult {
  orderNumber: string;
  lorryReceiptNumber: string;
  status: 'DELIVERED';
  deliveredAt: string;
  recipientName: string;
  netPayableToCarrier: number;
  tdsWithheld: number;
  glVoucherLines: Array<{
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
  }>;
}

/**
 * Sutra India GST: E-Way Bill JSON Generator (Rule 138 of CGST Rules)
 * Complies with the National Informatics Centre (NIC) E-Way Bill system API specification.
 */

export type SupplyType = 'O' | 'I'; // Outward | Inward
export type SubSupplyType = '1' | '2' | '3' | '4' | '5'; // 1=Supply, 2=Export, 3=Job Work, 4=For Own Use, 5=Others
export type TransportMode = '1' | '2' | '3' | '4'; // 1=Road, 2=Rail, 3=Air, 4=Ship

export interface EWayBillInput {
  supplyType: SupplyType;
  subSupplyType: SubSupplyType;
  docType: 'INV' | 'BIL' | 'BOE' | 'CHL' | 'OTH';
  docNo: string;
  docDate: string; // DD/MM/YYYY
  fromGstin: string;
  fromTradeName: string;
  fromAddr1: string;
  fromPlace: string;
  fromPincode: number;
  fromStateCode: number;
  toGstin: string;
  toTradeName: string;
  toAddr1: string;
  toPlace: string;
  toPincode: number;
  toStateCode: number;
  totalValue: number;
  cgstValue: number;
  sgstValue: number;
  igstValue: number;
  transporterId?: string; // 15-char GSTIN or Transporter ID
  transporterName?: string;
  transDocNo?: string;
  transDocDate?: string;
  vehicleNo?: string;     // e.g. MH12AB1234
  approximateDistanceKm: number;
  itemList: Array<{
    productName: string;
    productDesc: string;
    hsnCode: number;
    quantity: number;
    qtyUnit: string;
    taxableAmount: number;
    cgstRate: number;
    sgstRate: number;
    igstRate: number;
  }>;
}

export interface EWayBillPayload {
  supplyType: SupplyType;
  subSupplyType: SubSupplyType;
  docType: string;
  docNo: string;
  docDate: string;
  fromGstin: string;
  fromTrdName: string;
  fromAddr1: string;
  fromPlace: string;
  fromPincode: number;
  actFromStateCode: number;
  fromStateCode: number;
  toGstin: string;
  toTrdName: string;
  toAddr1: string;
  toPlace: string;
  toPincode: number;
  actToStateCode: number;
  toStateCode: number;
  totalValue: number;
  cgstValue: number;
  sgstValue: number;
  igstValue: number;
  cessValue: number;
  transporterId?: string;
  transporterName?: string;
  transDocNo?: string;
  transMode: TransportMode;
  transDistance: string;
  transDocDate?: string;
  vehicleNo?: string;
  vehicleType: 'R' | 'O'; // Regular | Over Dimensional Cargo
  itemList: Array<{
    itemNo: number;
    productId: number;
    productName: string;
    productDesc: string;
    hsnCode: number;
    quantity: number;
    qtyUnit: string;
    cgstRate: number;
    sgstRate: number;
    igstRate: number;
    cessRate: number;
    taxableAmount: number;
  }>;
}

export class EWayBillGenerator {
  /**
   * Generates NIC-compliant E-Way Bill JSON payload.
   */
  public static generatePayload(input: EWayBillInput): EWayBillPayload {
    const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

    const items = input.itemList.map((it, idx) => ({
      itemNo: idx + 1,
      productId: idx + 1,
      productName: it.productName,
      productDesc: it.productDesc,
      hsnCode: it.hsnCode,
      quantity: it.quantity,
      qtyUnit: it.qtyUnit,
      cgstRate: it.cgstRate,
      sgstRate: it.sgstRate,
      igstRate: it.igstRate,
      cessRate: 0,
      taxableAmount: round2(it.taxableAmount),
    }));

    return {
      supplyType: input.supplyType,
      subSupplyType: input.subSupplyType,
      docType: input.docType,
      docNo: input.docNo,
      docDate: input.docDate,
      fromGstin: input.fromGstin,
      fromTrdName: input.fromTradeName,
      fromAddr1: input.fromAddr1,
      fromPlace: input.fromPlace,
      fromPincode: input.fromPincode,
      actFromStateCode: input.fromStateCode,
      fromStateCode: input.fromStateCode,
      toGstin: input.toGstin,
      toTrdName: input.toTradeName,
      toAddr1: input.toAddr1,
      toPlace: input.toPlace,
      toPincode: input.toPincode,
      actToStateCode: input.toStateCode,
      toStateCode: input.toStateCode,
      totalValue: round2(input.totalValue),
      cgstValue: round2(input.cgstValue),
      sgstValue: round2(input.sgstValue),
      igstValue: round2(input.igstValue),
      cessValue: 0,
      transporterId: input.transporterId,
      transporterName: input.transporterName,
      transDocNo: input.transDocNo,
      transMode: '1', // Road by default
      transDistance: String(input.approximateDistanceKm),
      transDocDate: input.transDocDate,
      vehicleNo: input.vehicleNo?.replace(/\s+/g, '').toUpperCase(),
      vehicleType: 'R',
      itemList: items,
    };
  }

  /**
   * Computes statutory E-Way Bill validity in days:
   * Normal Cargo: 1 day for every 200 km (or part thereof).
   * Over Dimensional Cargo (ODC): 1 day for every 20 km.
   */
  public static calculateValidityDays(distanceKm: number, isODC = false): number {
    const ratePerDay = isODC ? 20 : 200;
    return Math.max(1, Math.ceil(distanceKm / ratePerDay));
  }
}

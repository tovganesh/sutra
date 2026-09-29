/**
 * Sutra Quality Management (QM) & Batch Traceability Types (SAP QM Equivalent)
 * Covers Inspection Lots, Characteristics, Usage Decisions, and Batch Genealogy.
 */

export type InspectionOrigin =
  | '01_GOODS_RECEIPT'
  | '04_PRODUCTION'
  | '08_STOCK_TRANSFER'
  | 'CUSTOMER_RETURN';

export type CharacteristicType = 'QUANTITATIVE' | 'QUALITATIVE';

export interface InspectionCharacteristic {
  charId: string;
  name: string;
  type: CharacteristicType;
  targetValue?: number;
  lowerLimit?: number;
  upperLimit?: number;
  uom?: string;
  expectedText?: string; // e.g. 'NO_SURFACE_DEFECTS', 'PASS'
}

export interface RecordedResult {
  charId: string;
  charName: string;
  type: CharacteristicType;
  numericValue?: number;
  textValue?: string;
  conforms: boolean;
  remarks?: string;
  testedAt: string;
  inspector: string;
}

export type UsageDecisionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'SCRAPPED';

export interface UsageDecision {
  decision: UsageDecisionStatus;
  decisionCode: string;
  movementType: '321' | '350' | '551'; // 321: Unrestricted, 350: Blocked, 551: Scrap
  decidedBy: string;
  decidedAt: string;
  notes?: string;
}

export interface InspectionLot {
  lotId: string;
  origin: InspectionOrigin;
  materialSku: string;
  batchNumber: string;
  quantity: number;
  baseUom: string;
  plantId: string;
  referenceDocument: string;
  characteristics: InspectionCharacteristic[];
  results: RecordedResult[];
  status: 'CREATED' | 'RESULTS_RECORDED' | 'UD_COMPLETED';
  usageDecision?: UsageDecision;
  createdAt: string;
}

export type BatchStockStatus = 'UNRESTRICTED' | 'IN_QUALITY' | 'BLOCKED' | 'RESTRICTED';

export interface BatchRecord {
  batchNumber: string;
  materialSku: string;
  plantId: string;
  status: BatchStockStatus;
  manufacturingDate: string;
  expiryDate?: string;
  vendorBatch?: string;
  totalQuantity: number;
  parentBatches: string[]; // Upstream raw material batches consumed
  childBatches: string[];  // Downstream finished goods lots generated
  deliveredSalesOrders: string[]; // Customer SOs fulfilled using this batch
  createdAt: string;
}

export interface CertificateOfAnalysis {
  coaNumber: string;
  inspectionLotId: string;
  materialSku: string;
  materialName: string;
  batchNumber: string;
  manufacturingDate: string;
  testedParameters: Array<{
    parameter: string;
    specification: string;
    observedValue: string;
    conformance: 'CONFORMS' | 'NON_CONFORMING';
  }>;
  overallConclusion: 'PASSED_FOR_RELEASE' | 'REJECTED_QUARANTINE';
  digitalSignatureHash: string;
  qaManager: string;
  issuedAt: string;
}

export interface BatchGenealogyTrace {
  searchedBatch: string;
  materialSku: string;
  direction: 'UPSTREAM_SUPPLIERS' | 'DOWNSTREAM_CUSTOMERS' | 'BIDIRECTIONAL';
  upstreamRawBatches: Array<{
    batchNumber: string;
    componentSku: string;
    vendorPoNumber?: string;
  }>;
  downstreamFinishedBatches: Array<{
    batchNumber: string;
    finishedSku: string;
    productionOrderNumber?: string;
  }>;
  affectedCustomers: Array<{
    salesOrderNumber: string;
    customerId?: string;
  }>;
}

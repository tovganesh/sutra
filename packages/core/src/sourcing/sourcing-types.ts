/**
 * Sutra Strategic Sourcing & Supplier Lifecycle Types (SAP SRM / Ariba Equivalent)
 * Defines Requests for Quotation (RFQ), Multi-Vendor Bid Evaluation,
 * Weighted Scoring Matrices, and Supplier Performance Scorecards.
 */

import {
  RfqStatusType,
  VendorBidStatusType,
  VendorRatingTierType,
} from '../common/constants.js';
import { PurchaseOrderInput } from '../procurement/procure-to-pay.js';

export interface RfqItem {
  itemId: string;
  sku: string;
  description: string;
  targetQuantity: number;
  unitOfMeasure: string;
  targetUnitPrice: number;
  requiredDeliveryDate: string;
  hsnCode?: string;
}

export interface CreateRfqInput {
  tenantId: string;
  rfqNumber: string;
  title: string;
  category: string;
  bidClosingDate: string;
  deliveryPlant: string;
  currency?: string;
  items: Array<Omit<RfqItem, 'itemId'>>;
  invitedVendorIds: string[];
  createdBy?: string;
}

export interface RfqDocument {
  tenantId: string;
  rfqNumber: string;
  title: string;
  category: string;
  status: RfqStatusType;
  issueDate: string;
  bidClosingDate: string;
  deliveryPlant: string;
  currency: string;
  items: RfqItem[];
  invitedVendorIds: string[];
  awardedVendorId?: string;
  awardedPoNumber?: string;
  createdBy: string;
}

export interface QuotedItem {
  sku: string;
  offeredQuantity: number;
  quotedUnitPrice: number;
  leadTimeDays: number;
  itemTotalAmount: number;
}

export interface SubmitBidInput {
  quotationId: string;
  rfqNumber: string;
  vendorId: string;
  vendorName: string;
  paymentTermsDays: number;
  warrantyMonths: number;
  technicalComplianceScore: number; // 0 - 100
  items: Array<Omit<QuotedItem, 'itemTotalAmount'>>;
  notes?: string;
}

export interface VendorQuotation {
  quotationId: string;
  rfqNumber: string;
  vendorId: string;
  vendorName: string;
  status: VendorBidStatusType;
  submissionDate: string;
  paymentTermsDays: number;
  warrantyMonths: number;
  technicalComplianceScore: number;
  items: QuotedItem[];
  totalQuoteAmount: number;
  averageLeadTimeDays: number;
  notes?: string;
}

export interface BidEvaluationScores {
  commercialScore: number; // 0 - 100, normalized against lowest quote
  technicalScore: number; // 0 - 100
  leadTimeScore: number; // 0 - 100, normalized against fastest delivery
  compositeWeightedScore: number; // 0 - 100 based on weighting config
  rank: number;
  recommendedAward: boolean;
}

export interface EvaluatedBid extends VendorQuotation {
  evaluation: BidEvaluationScores;
}

export interface EvaluationWeights {
  commercialWeight: number; // e.g. 0.50
  technicalWeight: number; // e.g. 0.30
  leadTimeWeight: number; // e.g. 0.20
}

export interface ComparativeBidMatrix {
  rfqNumber: string;
  currency: string;
  evaluatedAt: string;
  weights: EvaluationWeights;
  lowestPriceOffered: number;
  fastestLeadTimeDays: number;
  evaluatedBids: EvaluatedBid[];
  recommendedWinningBidId: string;
  recommendedWinningVendorName: string;
  projectedCostSavings: number; // target budget vs winning quote
}

export interface AwardRfqResult {
  rfq: RfqDocument;
  awardedQuotation: VendorQuotation;
  generatedPo: PurchaseOrderInput;
}

export interface VendorDeliveryMetricInput {
  totalShipments: number;
  onTimeInFullShipments: number; // OTIF
  totalUnitsReceived: number;
  acceptedUnits: number;
  rejectedUnits: number;
  benchmarkPriceIndexRatio: number; // e.g. 1.0 = at benchmark, 0.95 = 5% cheaper than benchmark
}

export interface VendorScorecard {
  vendorId: string;
  vendorName: string;
  evaluationDate: string;
  metrics: {
    totalShipments: number;
    otifPercentage: number; // On-Time In-Full %
    qualityAcceptanceRate: number; // %
    ppmDefectRate: number; // Parts Per Million
    priceCompetitivenessScore: number; // 0 - 100
  };
  overallScore: number; // 0 - 100
  tier: VendorRatingTierType;
  isPreferredSupplier: boolean;
  correctiveActionRequired: boolean;
}

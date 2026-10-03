/**
 * Sutra Credit Risk Management & Dunning Types
 * Implements SAP FSCM-CR & SAP F150 Dunning Parity
 */

import {
  CreditRatingType,
  CreditCheckStatusType,
  CreditBlockReasonType,
  DunningLevelType,
} from '../common/constants.js';

export interface CreditExposure {
  customerId: string;
  openOrdersValue: number;
  openDeliveriesValue: number;
  openInvoicesValue: number;
  totalExposure: number;
  creditLimit: number;
  availableCredit: number;
  utilizationPercent: number;
}

export interface CustomerCreditProfile {
  customerId: string;
  customerName: string;
  creditLimit: number;
  creditRating: CreditRatingType;
  riskScore: number; // 0-100 (100 = minimum risk)
  paymentHistoryPunctualityPercent: number;
  averageDsoDays: number;
  oldestOverdueDays: number;
  totalOverdueAmount: number;
  dunningLevel?: DunningLevelType;
  isBlocked: boolean;
  blockReason?: CreditBlockReasonType;
  exposure: CreditExposure;
}

export interface CreditCheckResult {
  orderNumber: string;
  customerId: string;
  orderAmount: number;
  projectedExposure: number;
  creditLimit: number;
  utilizationPercent: number;
  status: CreditCheckStatusType;
  passed: boolean;
  blockReason?: CreditBlockReasonType;
  details: string;
}

export interface BlockedOrder {
  orderNumber: string;
  customerId: string;
  customerName: string;
  orderAmount: number;
  orderDate: string;
  blockedAt: string;
  blockReason: CreditBlockReasonType;
  status: CreditCheckStatusType;
  releaseDetails?: {
    releasedBy: string;
    releasedAt: string;
    justification: string;
  };
  rejectionDetails?: {
    rejectedBy: string;
    rejectedAt: string;
    reason: string;
  };
}

export interface DunningItem {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  daysOverdue: number;
  principalAmount: number;
  statutoryInterestAmount: number;
  totalClaimAmount: number;
}

export interface DunningNotice {
  noticeId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  noticeDate: string;
  dunningLevel: DunningLevelType;
  items: DunningItem[];
  totalPrincipalOverdue: number;
  totalInterest: number;
  dunningFee: number;
  grandTotalDemand: number;
  interestRatePercent: number;
  legalCitation: string;
  remedyDeadlineDate: string;
}

export interface DunningRunInput {
  runDate: string;
  rbiRepoRatePercent?: number; // Default: 6.5%
  graceDays?: number; // Default: 0
}

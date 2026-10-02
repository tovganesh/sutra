/**
 * Sutra Strategic Sourcing & Supplier Lifecycle Engine (SAP SRM / Ariba Equivalent)
 * Manages RFQ tendering, competitive multi-bid evaluation, normalized scoring matrices,
 * automatic PO conversion, and vendor scorecard performance tiering.
 */

import {
  RfqStatus,
  VendorBidStatus,
  VendorRatingTier,
  SourcingEvaluationWeights,
  SystemDefaults,
} from '../common/constants.js';
import {
  RfqDocument,
  CreateRfqInput,
  VendorQuotation,
  SubmitBidInput,
  EvaluationWeights,
  ComparativeBidMatrix,
  EvaluatedBid,
  AwardRfqResult,
  VendorDeliveryMetricInput,
  VendorScorecard,
} from './sourcing-types.js';

export class StrategicSourcingEngine {
  private static round2(val: number): number {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }

  /**
   * Creates a formal Request for Quotation (RFQ) document with itemized tenders.
   */
  public static createRfq(input: CreateRfqInput): RfqDocument {
    if (!input.items || input.items.length === 0) {
      throw new Error('RFQ must contain at least one tender line item');
    }

    for (const item of input.items) {
      if (item.targetQuantity <= 0) {
        throw new Error(`Invalid target quantity ${item.targetQuantity} for SKU ${item.sku}`);
      }
      if (item.targetUnitPrice <= 0) {
        throw new Error(`Invalid target unit price ${item.targetUnitPrice} for SKU ${item.sku}`);
      }
    }

    const items = input.items.map((item, index) => ({
      ...item,
      itemId: `item-${index + 1}`,
      targetUnitPrice: this.round2(item.targetUnitPrice),
    }));

    const status = input.invitedVendorIds.length > 0 ? RfqStatus.ISSUED : RfqStatus.DRAFT;

    return {
      tenantId: input.tenantId || SystemDefaults.DEFAULT_TENANT_ID,
      rfqNumber: input.rfqNumber,
      title: input.title,
      category: input.category,
      status,
      issueDate: new Date().toISOString().split('T')[0],
      bidClosingDate: input.bidClosingDate,
      deliveryPlant: input.deliveryPlant || SystemDefaults.DEFAULT_PLANT_ID,
      currency: input.currency || SystemDefaults.DEFAULT_CURRENCY,
      items,
      invitedVendorIds: [...input.invitedVendorIds],
      createdBy: input.createdBy || 'SOURCING_MANAGER',
    };
  }

  /**
   * Records a supplier's formal commercial and technical quotation bid against an RFQ.
   */
  public static submitVendorBid(rfq: RfqDocument, input: SubmitBidInput): VendorQuotation {
    if (rfq.status === RfqStatus.CANCELLED || rfq.status === RfqStatus.AWARDED) {
      throw new Error(`Cannot submit bid for RFQ in status ${rfq.status}`);
    }

    if (!input.items || input.items.length === 0) {
      throw new Error('Quotation bid must contain quoted items');
    }

    const items = input.items.map((item) => {
      const unitPrice = this.round2(item.quotedUnitPrice);
      const itemTotalAmount = this.round2(unitPrice * item.offeredQuantity);
      return {
        ...item,
        quotedUnitPrice: unitPrice,
        itemTotalAmount,
      };
    });

    const totalQuoteAmount = this.round2(items.reduce((sum, i) => sum + i.itemTotalAmount, 0));
    const averageLeadTimeDays = Math.round(
      items.reduce((sum, i) => sum + i.leadTimeDays, 0) / items.length
    );

    return {
      quotationId: input.quotationId,
      rfqNumber: input.rfqNumber,
      vendorId: input.vendorId,
      vendorName: input.vendorName,
      status: VendorBidStatus.SUBMITTED,
      submissionDate: new Date().toISOString().split('T')[0],
      paymentTermsDays: input.paymentTermsDays,
      warrantyMonths: input.warrantyMonths,
      technicalComplianceScore: Math.min(100, Math.max(0, input.technicalComplianceScore)),
      items,
      totalQuoteAmount,
      averageLeadTimeDays,
      notes: input.notes,
    };
  }

  /**
   * Generates a comparative bid evaluation matrix with normalized scoring and composite weighting.
   */
  public static evaluateBids(
    rfq: RfqDocument,
    quotations: VendorQuotation[],
    customWeights?: Partial<EvaluationWeights>
  ): ComparativeBidMatrix {
    if (!quotations || quotations.length === 0) {
      throw new Error('No vendor quotations available for evaluation');
    }

    const r = this.round2;

    const weights: EvaluationWeights = {
      commercialWeight: customWeights?.commercialWeight ?? SourcingEvaluationWeights.DEFAULT_COMMERCIAL_WEIGHT,
      technicalWeight: customWeights?.technicalWeight ?? SourcingEvaluationWeights.DEFAULT_TECHNICAL_WEIGHT,
      leadTimeWeight: customWeights?.leadTimeWeight ?? SourcingEvaluationWeights.DEFAULT_LEAD_TIME_WEIGHT,
    };

    // Normalize weights to sum exactly to 1.0
    const totalWeight = weights.commercialWeight + weights.technicalWeight + weights.leadTimeWeight;
    const normalizedWeights: EvaluationWeights = {
      commercialWeight: r(weights.commercialWeight / totalWeight),
      technicalWeight: r(weights.technicalWeight / totalWeight),
      leadTimeWeight: r(weights.leadTimeWeight / totalWeight),
    };

    const lowestPrice = Math.min(...quotations.map((q) => q.totalQuoteAmount));
    const fastestLeadTime = Math.min(...quotations.map((q) => q.averageLeadTimeDays));

    const evaluatedBids: EvaluatedBid[] = quotations.map((q) => {
      // Commercial score: lowest bid gets 100, others inversely proportional
      const commercialScore = q.totalQuoteAmount > 0 ? r((lowestPrice / q.totalQuoteAmount) * 100) : 0;
      const technicalScore = r(q.technicalComplianceScore);
      // Lead time score: shortest lead time gets 100, others inversely proportional
      const leadTimeScore = q.averageLeadTimeDays > 0 ? r((fastestLeadTime / q.averageLeadTimeDays) * 100) : 100;

      const compositeWeightedScore = r(
        commercialScore * normalizedWeights.commercialWeight +
        technicalScore * normalizedWeights.technicalWeight +
        leadTimeScore * normalizedWeights.leadTimeWeight
      );

      return {
        ...q,
        status: VendorBidStatus.UNDER_REVIEW,
        evaluation: {
          commercialScore,
          technicalScore,
          leadTimeScore,
          compositeWeightedScore,
          rank: 0,
          recommendedAward: false,
        },
      };
    });

    // Rank descending by composite score
    evaluatedBids.sort((a, b) => b.evaluation.compositeWeightedScore - a.evaluation.compositeWeightedScore);
    evaluatedBids.forEach((bid, idx) => {
      bid.evaluation.rank = idx + 1;
      bid.evaluation.recommendedAward = idx === 0;
    });

    const winningBid = evaluatedBids[0];
    const targetBudget = r(
      rfq.items.reduce((sum, item) => sum + item.targetQuantity * item.targetUnitPrice, 0)
    );
    const projectedCostSavings = r(targetBudget - winningBid.totalQuoteAmount);

    return {
      rfqNumber: rfq.rfqNumber,
      currency: rfq.currency,
      evaluatedAt: new Date().toISOString(),
      weights: normalizedWeights,
      lowestPriceOffered: lowestPrice,
      fastestLeadTimeDays: fastestLeadTime,
      evaluatedBids,
      recommendedWinningBidId: winningBid.quotationId,
      recommendedWinningVendorName: winningBid.vendorName,
      projectedCostSavings,
    };
  }

  /**
   * Finalizes the award decision on an RFQ and automatically converts the winning bid into a Purchase Order.
   */
  public static awardRfq(
    rfq: RfqDocument,
    quotations: VendorQuotation[],
    winningQuotationId: string,
    poPrefix = 'PO'
  ): AwardRfqResult {
    const winningQuotation = quotations.find((q) => q.quotationId === winningQuotationId);
    if (!winningQuotation) {
      throw new Error(`Quotation with ID ${winningQuotationId} not found`);
    }

    const updatedRfq: RfqDocument = {
      ...rfq,
      status: RfqStatus.AWARDED,
      awardedVendorId: winningQuotation.vendorId,
      awardedPoNumber: `${poPrefix}-${rfq.rfqNumber}`,
    };

    const awardedQuotation: VendorQuotation = {
      ...winningQuotation,
      status: VendorBidStatus.AWARDED,
    };

    // Auto-generate Purchase Order input ready for P2P execution
    const generatedPo = {
      tenantId: rfq.tenantId,
      poNumber: updatedRfq.awardedPoNumber!,
      vendorId: winningQuotation.vendorId,
      supplierStateCode: SystemDefaults.DEFAULT_SUPPLIER_STATE_CODE,
      deliveryPlant: rfq.deliveryPlant,
      createdBy: 'STRATEGIC_SOURCING_AUTO_AWARD',
      items: winningQuotation.items.map((i) => ({
        sku: i.sku,
        quantity: i.offeredQuantity,
        unitPrice: i.quotedUnitPrice,
      })),
    };

    return {
      rfq: updatedRfq,
      awardedQuotation,
      generatedPo,
    };
  }

  /**
   * Computes comprehensive Vendor Performance Scorecard & Tier Rating based on historical deliveries.
   */
  public static calculateVendorScorecard(
    vendorId: string,
    vendorName: string,
    metrics: VendorDeliveryMetricInput
  ): VendorScorecard {
    const r = this.round2;

    const otifPercentage = metrics.totalShipments > 0
      ? r((metrics.onTimeInFullShipments / metrics.totalShipments) * 100)
      : 100;

    const qualityAcceptanceRate = metrics.totalUnitsReceived > 0
      ? r((metrics.acceptedUnits / metrics.totalUnitsReceived) * 100)
      : 100;

    const ppmDefectRate = metrics.totalUnitsReceived > 0
      ? Math.round((metrics.rejectedUnits / metrics.totalUnitsReceived) * 1000000)
      : 0;

    // Price competitiveness: 1.0 ratio = 100 score, ratio < 1.0 (cheaper) capped at 100
    const priceCompetitivenessScore = metrics.benchmarkPriceIndexRatio > 0
      ? Math.min(100, r((1 / metrics.benchmarkPriceIndexRatio) * 100))
      : 100;

    // Overall Score: 40% OTIF + 40% Quality + 20% Price
    const overallScore = r(
      otifPercentage * 0.4 +
      qualityAcceptanceRate * 0.4 +
      priceCompetitivenessScore * 0.2
    );

    let tier: (typeof VendorRatingTier)[keyof typeof VendorRatingTier];
    let isPreferredSupplier = false;
    let correctiveActionRequired = false;

    if (overallScore >= 90) {
      tier = VendorRatingTier.GRADE_A_PLUS;
      isPreferredSupplier = true;
    } else if (overallScore >= 80) {
      tier = VendorRatingTier.GRADE_A;
      isPreferredSupplier = true;
    } else if (overallScore >= 65) {
      tier = VendorRatingTier.GRADE_B;
      correctiveActionRequired = true;
    } else {
      tier = VendorRatingTier.GRADE_C;
      correctiveActionRequired = true;
    }

    return {
      vendorId,
      vendorName,
      evaluationDate: new Date().toISOString().split('T')[0],
      metrics: {
        totalShipments: metrics.totalShipments,
        otifPercentage,
        qualityAcceptanceRate,
        ppmDefectRate,
        priceCompetitivenessScore,
      },
      overallScore,
      tier,
      isPreferredSupplier,
      correctiveActionRequired,
    };
  }
}

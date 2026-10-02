import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  StrategicSourcingEngine,
  RfqStatus,
  VendorBidStatus,
  VendorRatingTier,
  SourcingEvaluationWeights,
  SystemDefaults,
} from '../packages/core/dist/index.js';

describe('Sutra Strategic Sourcing & Supplier Lifecycle Suite (SAP SRM/Ariba)', () => {
  const sampleItems = [
    {
      sku: 'RAW-TI-001',
      description: 'Aerospace Grade Titanium Round Bar 6Al-4V',
      targetQuantity: 2500,
      unitOfMeasure: 'KG',
      targetUnitPrice: 1650,
      requiredDeliveryDate: '2026-11-15',
      hsnCode: '81089010',
    },
    {
      sku: 'COMP-FAST-44',
      description: 'Titanium Grade 5 Hex Machine Bolts M8x40',
      targetQuantity: 10000,
      unitOfMeasure: 'PCS',
      targetUnitPrice: 45,
      requiredDeliveryDate: '2026-11-15',
      hsnCode: '73181500',
    },
  ];

  describe('RFQ Tender Document Management', () => {
    test('creates RFQ in DRAFT status when no vendors invited yet', () => {
      const rfq = StrategicSourcingEngine.createRfq({
        rfqNumber: 'RFQ-TEST-001',
        title: 'Turbine Casing Forgings',
        category: 'DIRECT_MATERIALS',
        bidClosingDate: '2026-11-01',
        items: sampleItems,
        invitedVendorIds: [],
      });

      assert.equal(rfq.rfqNumber, 'RFQ-TEST-001');
      assert.equal(rfq.status, RfqStatus.DRAFT);
      assert.equal(rfq.items.length, 2);
      assert.equal(rfq.items[0].itemId, 'item-1');
      assert.equal(rfq.tenantId, SystemDefaults.DEFAULT_TENANT_ID);
      assert.equal(rfq.deliveryPlant, SystemDefaults.DEFAULT_PLANT_ID);
    });

    test('creates RFQ in ISSUED status when invited vendor IDs are provided', () => {
      const rfq = StrategicSourcingEngine.createRfq({
        rfqNumber: 'RFQ-TEST-002',
        title: 'Precision Machined Flanges',
        category: 'DIRECT_MATERIALS',
        bidClosingDate: '2026-11-10',
        items: sampleItems,
        invitedVendorIds: ['VEND-001', 'VEND-002'],
      });

      assert.equal(rfq.status, RfqStatus.ISSUED);
      assert.equal(rfq.invitedVendorIds.length, 2);
    });

    test('rejects RFQ creation with empty items or non-positive quantity/price', () => {
      assert.throws(
        () => StrategicSourcingEngine.createRfq({
          rfqNumber: 'RFQ-FAIL',
          title: 'Empty items',
          category: 'DIRECT_MATERIALS',
          bidClosingDate: '2026-11-10',
          items: [],
          invitedVendorIds: [],
        }),
        /at least one tender line item/
      );

      assert.throws(
        () => StrategicSourcingEngine.createRfq({
          rfqNumber: 'RFQ-FAIL',
          title: 'Negative qty',
          category: 'DIRECT_MATERIALS',
          bidClosingDate: '2026-11-10',
          items: [{ ...sampleItems[0], targetQuantity: 0 }],
          invitedVendorIds: [],
        }),
        /Invalid target quantity/
      );
    });
  });

  describe('Vendor Quotation Submission', () => {
    const rfq = StrategicSourcingEngine.createRfq({
      rfqNumber: 'RFQ-2026-081',
      title: 'Precision Titanium Castings & Fasteners',
      category: 'DIRECT_MATERIALS',
      bidClosingDate: '2026-10-15',
      items: sampleItems,
      invitedVendorIds: ['VEND-001', 'VEND-002', 'VEND-003'],
    });

    test('accurately calculates item line amounts, total quote, and average lead time', () => {
      const quote = StrategicSourcingEngine.submitVendorBid(rfq, {
        quotationId: 'QUO-V1-081',
        rfqNumber: rfq.rfqNumber,
        vendorId: 'VEND-001',
        vendorName: 'Tata Advanced Materials Ltd',
        paymentTermsDays: 45,
        warrantyMonths: 24,
        technicalComplianceScore: 96,
        items: [
          { sku: 'RAW-TI-001', offeredQuantity: 2500, quotedUnitPrice: 1600, leadTimeDays: 14 },
          { sku: 'COMP-FAST-44', offeredQuantity: 10000, quotedUnitPrice: 45, leadTimeDays: 14 },
        ],
        notes: 'AS9100D certified aerospace forging.',
      });

      assert.equal(quote.status, VendorBidStatus.SUBMITTED);
      assert.equal(quote.items[0].itemTotalAmount, 4000000);
      assert.equal(quote.items[1].itemTotalAmount, 450000);
      assert.equal(quote.totalQuoteAmount, 4450000);
      assert.equal(quote.averageLeadTimeDays, 14);
      assert.equal(quote.technicalComplianceScore, 96);
    });

    test('prevents quotation submission for cancelled or already awarded RFQs', () => {
      const cancelledRfq = { ...rfq, status: RfqStatus.CANCELLED };
      assert.throws(
        () => StrategicSourcingEngine.submitVendorBid(cancelledRfq, {
          quotationId: 'QUO-FAIL',
          rfqNumber: rfq.rfqNumber,
          vendorId: 'VEND-001',
          vendorName: 'Test Vendor',
          paymentTermsDays: 30,
          warrantyMonths: 12,
          technicalComplianceScore: 80,
          items: [{ sku: 'RAW-TI-001', offeredQuantity: 100, quotedUnitPrice: 50, leadTimeDays: 7 }],
        }),
        /Cannot submit bid/
      );
    });
  });

  describe('Comparative Bid Evaluation Matrix', () => {
    const rfq = StrategicSourcingEngine.createRfq({
      rfqNumber: 'RFQ-2026-081',
      title: 'Precision Titanium Castings & Fasteners',
      category: 'DIRECT_MATERIALS',
      bidClosingDate: '2026-10-15',
      items: sampleItems,
      invitedVendorIds: ['VEND-001', 'VEND-002', 'VEND-003'],
    });

    // Total target budget = (2500 * 1650) + (10000 * 45) = 4,125,000 + 450,000 = 4,575,000
    const quote1 = StrategicSourcingEngine.submitVendorBid(rfq, {
      quotationId: 'QUO-V1-081',
      rfqNumber: rfq.rfqNumber,
      vendorId: 'VEND-001',
      vendorName: 'Tata Advanced Materials Ltd',
      paymentTermsDays: 45,
      warrantyMonths: 24,
      technicalComplianceScore: 96,
      items: [
        { sku: 'RAW-TI-001', offeredQuantity: 2500, quotedUnitPrice: 1600, leadTimeDays: 14 },
        { sku: 'COMP-FAST-44', offeredQuantity: 10000, quotedUnitPrice: 45, leadTimeDays: 14 },
      ],
    }); // Total = 4,450,000, avg lead time = 14

    const quote2 = StrategicSourcingEngine.submitVendorBid(rfq, {
      quotationId: 'QUO-V2-081',
      rfqNumber: rfq.rfqNumber,
      vendorId: 'VEND-002',
      vendorName: 'Bharat Forge Aerospace Division',
      paymentTermsDays: 30,
      warrantyMonths: 18,
      technicalComplianceScore: 92,
      items: [
        { sku: 'RAW-TI-001', offeredQuantity: 2500, quotedUnitPrice: 1520, leadTimeDays: 21 },
        { sku: 'COMP-FAST-44', offeredQuantity: 10000, quotedUnitPrice: 40, leadTimeDays: 21 },
      ],
    }); // Total = 4,200,000 (lowest price), avg lead time = 21

    const quote3 = StrategicSourcingEngine.submitVendorBid(rfq, {
      quotationId: 'QUO-V3-081',
      rfqNumber: rfq.rfqNumber,
      vendorId: 'VEND-003',
      vendorName: 'Precision Fasteners & Alloys Ltd',
      paymentTermsDays: 30,
      warrantyMonths: 12,
      technicalComplianceScore: 84,
      items: [
        { sku: 'RAW-TI-001', offeredQuantity: 2500, quotedUnitPrice: 1680, leadTimeDays: 28 },
        { sku: 'COMP-FAST-44', offeredQuantity: 10000, quotedUnitPrice: 45, leadTimeDays: 28 },
      ],
    }); // Total = 4,650,000, avg lead time = 28

    test('generates normalized scores and ranks bids by composite score', () => {
      const matrix = StrategicSourcingEngine.evaluateBids(rfq, [quote1, quote2, quote3]);

      assert.equal(matrix.lowestPriceOffered, 4200000);
      assert.equal(matrix.fastestLeadTimeDays, 14);
      assert.equal(matrix.evaluatedBids.length, 3);

      // Weights default: Commercial 50%, Technical 30%, Lead Time 20%
      assert.equal(matrix.weights.commercialWeight, SourcingEvaluationWeights.DEFAULT_COMMERCIAL_WEIGHT);
      assert.equal(matrix.weights.technicalWeight, SourcingEvaluationWeights.DEFAULT_TECHNICAL_WEIGHT);
      assert.equal(matrix.weights.leadTimeWeight, SourcingEvaluationWeights.DEFAULT_LEAD_TIME_WEIGHT);

      const lowestBid = matrix.evaluatedBids.find((b) => b.quotationId === 'QUO-V2-081');
      assert.ok(lowestBid);
      // Lowest price gets 100 commercial score
      assert.equal(lowestBid.evaluation.commercialScore, 100);

      const fastestBid = matrix.evaluatedBids.find((b) => b.quotationId === 'QUO-V1-081');
      assert.ok(fastestBid);
      // Fastest lead time (14 days) gets 100 lead time score
      assert.equal(fastestBid.evaluation.leadTimeScore, 100);

      // Verify ranks 1, 2, 3
      assert.equal(matrix.evaluatedBids[0].evaluation.rank, 1);
      assert.equal(matrix.evaluatedBids[1].evaluation.rank, 2);
      assert.equal(matrix.evaluatedBids[2].evaluation.rank, 3);

      // Recommended award is rank 1
      assert.equal(matrix.recommendedWinningBidId, matrix.evaluatedBids[0].quotationId);
      assert.equal(matrix.evaluatedBids[0].evaluation.recommendedAward, true);
      assert.equal(matrix.evaluatedBids[1].evaluation.recommendedAward, false);

      // Projected savings vs target budget (4,575,000)
      assert.ok(matrix.projectedCostSavings > 0);
    });

    test('supports custom weight sensitivity analysis (e.g. 100% technical weighting)', () => {
      const technicalMatrix = StrategicSourcingEngine.evaluateBids(
        rfq,
        [quote1, quote2, quote3],
        { commercialWeight: 0, technicalWeight: 1.0, leadTimeWeight: 0 }
      );

      // Quote 1 has technical score 96 (highest), Quote 2 has 92, Quote 3 has 84
      assert.equal(technicalMatrix.recommendedWinningBidId, 'QUO-V1-081');
      assert.equal(technicalMatrix.evaluatedBids[0].evaluation.compositeWeightedScore, 96);
    });
  });

  describe('Award Decision & Auto Purchase Order Generation', () => {
    const rfq = StrategicSourcingEngine.createRfq({
      rfqNumber: 'RFQ-2026-081',
      title: 'Precision Titanium Castings & Fasteners',
      category: 'DIRECT_MATERIALS',
      bidClosingDate: '2026-10-15',
      items: sampleItems,
      invitedVendorIds: ['VEND-001', 'VEND-002'],
    });

    const quote1 = StrategicSourcingEngine.submitVendorBid(rfq, {
      quotationId: 'QUO-V1-081',
      rfqNumber: rfq.rfqNumber,
      vendorId: 'VEND-001',
      vendorName: 'Tata Advanced Materials Ltd',
      paymentTermsDays: 45,
      warrantyMonths: 24,
      technicalComplianceScore: 96,
      items: [
        { sku: 'RAW-TI-001', offeredQuantity: 2500, quotedUnitPrice: 1600, leadTimeDays: 14 },
        { sku: 'COMP-FAST-44', offeredQuantity: 10000, quotedUnitPrice: 45, leadTimeDays: 14 },
      ],
    });

    test('awards winning bid and formats auto Purchase Order for P2P engine', () => {
      const result = StrategicSourcingEngine.awardRfq(rfq, [quote1], 'QUO-V1-081', 'PO-2026');

      assert.equal(result.rfq.status, RfqStatus.AWARDED);
      assert.equal(result.rfq.awardedVendorId, 'VEND-001');
      assert.equal(result.rfq.awardedPoNumber, 'PO-2026-RFQ-2026-081');

      assert.equal(result.awardedQuotation.status, VendorBidStatus.AWARDED);

      // Verify generated PO schema matches PurchaseOrderInput
      assert.equal(result.generatedPo.poNumber, 'PO-2026-RFQ-2026-081');
      assert.equal(result.generatedPo.vendorId, 'VEND-001');
      assert.equal(result.generatedPo.deliveryPlant, rfq.deliveryPlant);
      assert.equal(result.generatedPo.items.length, 2);
      assert.equal(result.generatedPo.items[0].sku, 'RAW-TI-001');
      assert.equal(result.generatedPo.items[0].quantity, 2500);
      assert.equal(result.generatedPo.items[0].unitPrice, 1600);
    });
  });

  describe('Supplier Scorecard & Vendor Rating Engine', () => {
    test('computes Grade A+ rating for high OTIF, high quality, and low defect PPM', () => {
      const scorecard = StrategicSourcingEngine.calculateVendorScorecard(
        'VEND-001',
        'Tata Advanced Materials Ltd',
        {
          totalShipments: 48,
          onTimeInFullShipments: 47,
          totalUnitsReceived: 1000000,
          acceptedUnits: 994500,
          rejectedUnits: 550,
          benchmarkPriceIndexRatio: 1.05,
        }
      );

      assert.equal(scorecard.vendorId, 'VEND-001');
      assert.equal(scorecard.metrics.totalShipments, 48);
      assert.equal(scorecard.metrics.otifPercentage, 97.92);
      assert.equal(scorecard.metrics.qualityAcceptanceRate, 99.45);
      assert.equal(scorecard.metrics.ppmDefectRate, 550);
      assert.ok(scorecard.overallScore >= 90);
      assert.equal(scorecard.tier, VendorRatingTier.GRADE_A_PLUS);
      assert.equal(scorecard.isPreferredSupplier, true);
      assert.equal(scorecard.correctiveActionRequired, false);
    });

    test('flags Grade C probationary rating and triggers corrective action for poor performance', () => {
      const scorecard = StrategicSourcingEngine.calculateVendorScorecard(
        'VEND-POOR',
        'Defective Supplier Corp',
        {
          totalShipments: 20,
          onTimeInFullShipments: 10, // 50% OTIF
          totalUnitsReceived: 10000,
          acceptedUnits: 6000,       // 60% Quality
          rejectedUnits: 4000,       // 400,000 PPM
          benchmarkPriceIndexRatio: 1.4, // Overpriced
        }
      );

      assert.equal(scorecard.metrics.otifPercentage, 50);
      assert.equal(scorecard.metrics.qualityAcceptanceRate, 60);
      assert.equal(scorecard.metrics.ppmDefectRate, 400000);
      assert.ok(scorecard.overallScore < 65);
      assert.equal(scorecard.tier, VendorRatingTier.GRADE_C);
      assert.equal(scorecard.isPreferredSupplier, false);
      assert.equal(scorecard.correctiveActionRequired, true);
    });
  });
});

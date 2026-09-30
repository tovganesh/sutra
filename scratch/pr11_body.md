# Indian Customs Landed Cost CIF Valuation, Rule 96A Export LUT Verification & Cross-Border Tax Engine

## Overview
This PR implements comprehensive cross-border trade and statutory customs compliance for Sutra, completing the "Built for India First, Configurable for the World" architectural tenet:
1. **Indian Customs Import Valuation & Landed Cost Engine**:
   - Computes CIF (Cost, Insurance & Freight) Assessable Value under Section 14 of the Customs Act 1962.
   - Evaluates statutory cascade: Basic Customs Duty (BCD), Social Welfare Surcharge (SWS at 10% of BCD under Finance Act 2018), Integrated GST (IGST under Section 3(7) of Customs Tariff Act 1975 on `CIF + BCD + SWS + Anti-Dumping`), and Compensation Cess.
   - Segregates Creditable ITC (IGST and Cess eligible for GSTR-3B Table 4(A)(1)) from Non-Creditable Duty Costs (BCD and SWS capitalized into Raw Materials inventory moving average price).
   - Generates balanced double-entry GL clearance voucher (`120100 Dr Raw Materials Landed Cost`, `130100 Dr Import IGST ITC`, `210500 Cr Customs Duties Payable`, `210100 Cr Foreign Trade AP CIF`).
2. **Rule 96A Letter of Undertaking (LUT) Export Verification**:
   - Validates official 14-character GSTN ARN format (`AD{StateCode}{MM}{YY}{6Digits}{Alphanumeric}`) for zero-rated export of goods and services without payment of integrated tax under bond/LUT.
   - Generates statutory compliance payload adhering to CGST Rules 2017.
3. **Pluggable Global Tax Jurisdiction Engine Integration**:
   - Full support for multi-jurisdiction tax calculations (India Dual GST, US State/Local Nexus, EU Cross-Border VIES Reverse Charge Art 194, UAE FTA VAT 5%).
4. **Enterprise UI Cockpit in ComplianceIndia.vue**:
   - Added Tab 4: "Customs & Cross-Border Trade" with interactive calculators for CIF landed cost, Rule 96A LUT verification, and cross-border multi-country tax simulations.
5. **PostgreSQL DDL (Section 23)**:
   - Added tables `customs_import_declarations` (Bill of Entry tracking) and `export_lut_filings`.
6. **Named Constants Compliance**:
   - Exclusively uses `HttpStatus.*` named constants across all endpoints and routes.

## Test Validation
- Monorepo tests: 47/47 passing (`npm test`).
- Full monorepo TypeScript build: clean (`npm run build`).

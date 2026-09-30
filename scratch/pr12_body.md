# Transportation Management (SAP TM) & Fleet Logistics Engine

## Overview
This PR implements **Transportation Management (SAP TM) & Fleet Logistics** for Sutra:
1. **Transportation Core Engine (`TransportationEngine`)**:
   - Carrier master & multi-modal tariff agreements (distance-based `₹/KM`, weight-based `₹/KG`, and flat trip).
   - Dynamic diesel fuel surcharge indexing referencing base benchmarks (e.g. ₹90.00/L with 30% fuel operating expense weighting).
   - Statutory withholding under Section 194C of the Indian Income Tax Act:
     - Transporters owning $\le 10$ goods carriages with PAN declaration qualify for 0% TDS under Section 194C(6).
     - Corporate contractors subject to 2% TDS.
     - Individual contractors subject to 1% TDS.
   - Consignment execution & Lorry Receipt (LR / Bilty) lifecycle (Planned &rarr; Dispatched &rarr; In Transit &rarr; Arrived &rarr; Delivered).
   - Electronic Proof of Delivery (e-POD) with secure 6-digit OTP verification and digital signature tokens.
   - Automated double-entry GL freight settlement voucher posting:
     - `520100 Dr Freight Outward & Distribution Logistics Expense` (or Inward Freight capitalized if purchase)
     - `210400 Cr Accounts Payable - Freight Carrier` (Net payable)
     - `210600 Cr TDS Payable on Transporters (Sec 194C)` (where applicable)
2. **REST API Gateway**:
   - `GET /api/v1/transportation/carriers`
   - `GET /api/v1/transportation/vehicles`
   - `GET /api/v1/transportation/orders`
   - `GET /api/v1/transportation/orders/:orderNumber`
   - `POST /api/v1/transportation/freight/calculate`
   - `POST /api/v1/transportation/orders/create`
   - `POST /api/v1/transportation/orders/dispatch`
   - `POST /api/v1/transportation/orders/milestone`
   - `POST /api/v1/transportation/orders/confirm-delivery`
   - Strictly uses `HttpStatus.*` named constants throughout.
3. **Enterprise UI Cockpit in SupplyChainERP.vue**:
   - Added Tab 15: "Transportation & Fleet (TM)" with live carrier master, vehicle fleet telematics, active freight order tracking, and e-POD verification modal.
4. **PostgreSQL DDL (Section 24)**:
   - Added tables `tm_carriers`, `tm_vehicles`, and `tm_freight_orders`.
5. **Testing & Documentation**:
   - Comprehensive test suite in `test/enterprise-core.test.mjs` verifying freight rating, dynamic fuel surcharges, dispatch, and e-POD GL settlements (50/50 tests pass).
   - Documented in `docs/ARCHITECTURE.md` (Section 3.19).

# India Compliance Specification in Sutra

This document explains the technical implementation of Indian statutory and tax compliance in **Sutra — The Open Enterprise Operating System**.

---

## 1. Indian GST (Goods and Services Tax)

### 1.1 GSTIN Validation (Modulo-36 Algorithm)
An Indian GSTIN is a 15-character alphanumeric code structured as follows:
* Characters 1–2: 2-digit State Code (e.g. `27` for Maharashtra, `29` for Karnataka, `07` for Delhi).
* Characters 3–12: 10-character Permanent Account Number (PAN).
* Character 13: Entity code (1-9 or A-Z).
* Character 14: Default character `Z`.
* Character 15: Checksum character calculated via Modulo-36 (ISO/IEC 7064).

**Implementation in Sutra**:
Located in [`packages/compliance-india/src/gst/gstin-validator.ts`](file:///c:/Users/werko/Developer/code/sutra/packages/compliance-india/src/gst/gstin-validator.ts). Validates format regex, state code presence, and calculates the expected 15th checksum character.

---

### 1.2 Tax Determination Rules
Sutra automatically evaluates whether a supply is Intra-State or Inter-State:
* **Intra-State Supply**: When Supplier State Code equals Place of Supply (POS) State Code.
  * Split: **CGST (50%) + SGST (50%)**
* **Inter-State Supply**: When Supplier State Code does not equal Place of Supply State Code.
  * Applicable: **IGST (100%)**
* **Union Territories**: When supply is within a UT without legislature (e.g. Ladakh `38`, Chandigarh `04`), UTGST applies in place of SGST.

---

### 1.3 NIC E-Invoicing & IRN (Invoice Reference Number)
According to Rule 48(4) of the CGST Rules, B2B invoices exceeding statutory turnover thresholds must register an electronic invoice on the NIC Invoice Registration Portal (IRP).

* **IRN Computation Formula**:
  ```text
  IRN = SHA256(SupplierGSTIN + FinancialYear + DocumentType + DocumentNumber)
  ```
* **Signed QR Code**:
  Sutra generates a signed base64 payload containing IRN, supplier GSTIN, buyer GSTIN, document number, date, total value, and item counts for printing on physical bills and PDF invoices.

---

## 2. Tax Deducted at Source (TDS) under Income Tax Act, 1961

Sutra implements statutory deduction rules across common enterprise sections:
* **Section 194C**: Contractors (1% for Individual/HUF, 2% for Corporate entities; single invoice threshold ₹30,000 / aggregate ₹1,00,000).
* **Section 194J(a)**: Fees for Technical Services (FTS) at 2%.
* **Section 194J(b)**: Fees for Professional Services and Royalty at 10%.
* **Section 194Q**: Purchase of Goods exceeding ₹50 Lakhs in aggregate at 0.1%.
* **Section 206AA Penalty**: Automatically enforces higher 20% TDS rate if a valid PAN is not provided.

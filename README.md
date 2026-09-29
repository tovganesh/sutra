# Sutra — The Open Enterprise Operating System

<div align="center">

![Sutra License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)
![Node Version](https://img.shields.io/badge/Node-v20%2B-green.svg)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016%20%2B%20pgvector-336791.svg)
![MinIO](https://img.shields.io/badge/Storage-MinIO%20S3-c72c48.svg)
![Docker](https://img.shields.io/badge/Deploy-Docker%20Compose-2496ED.svg)
![Jurisdiction](https://img.shields.io/badge/Compliance-India%20First%20%7C%20World%20Ready-orange.svg)

**A modern, security-first, open-source replacement for SAP S/4HANA.**  
*Free from vendor lock-in. Powered by Docker, Node.js, PostgreSQL, MinIO, No-Code Studio, and Gen AI.*

[Architecture](docs/ARCHITECTURE.md) • [India Compliance](docs/INDIA_COMPLIANCE.md) • [SAP Migration Guide](docs/SAP_MIGRATION_GUIDE.md) • [Getting Started](#-quick-start-with-docker)

</div>

---

## 🌟 Why Sutra?

Traditional enterprise ERPs (like SAP S/4HANA) cost millions of dollars in licensing, rely on arcane proprietary languages (ABAP), force vendor lock-in, and require armies of consultants for basic business modifications.

**Sutra** reimagines the enterprise operating system from the ground up:
* **Zero Vendor Lock-in**: 100% open source under the **Apache-2.0 License**.
* **Modern Cloud-Native Tech Stack**: Built on TypeScript/Node.js, PostgreSQL (with pgvector), MinIO S3 object vault, Valkey in-memory cache, and Docker.
* **Pluggable Identity & JWT Authentication**: Built-in **JWT-based login** with bcrypt password encryption, paired with a pluggable identity architecture supporting corporate **OIDC (Azure AD, Keycloak)** and **SAML 2.0 (Okta, ADFS)** with per-tenant SSO policies.
* **Security & Multi-Tenancy First**: Granular Role-Based Access Control (RBAC), Attribute-Based Access Control (ABAC), and immutable tamper-evident audit logging for statutory compliance.
* **No-Code / Low-Code Extensibility**: Build custom entities, business logic, and automated workflows via **Sutra Studio** without writing SQL or compiling code.
* **Built for India First, Configurable for the World**: Out-of-the-box GSTIN Modulo-36 validation, Intra/Inter-state CGST/SGST/IGST tax calculation, NIC E-Invoicing (IRN Hash + QR payload), and Income Tax TDS (Sec 194C, 194J, 194Q).
* **Strong Embedded Analytics**: Real-time Trial Balance, Profit & Loss (P&L), Balance Sheet, Days Sales Outstanding (DSO), and working capital analytics directly from PostgreSQL with zero ETL lag.
* **Sovereign Gen AI Core**: Model-agnostic AI assistant that runs air-gapped on **Local LLMs (Ollama / vLLM)** or connects to **Cloud Providers (OpenAI, Gemini, Anthropic)** for natural language ERP queries and zero-shot invoice OCR (IDP).

---

## 🏛️ SAP Parity Matrix

| SAP Module / Capability | **Sutra Open Equivalent** | Advantage in Sutra |
| :--- | :--- | :--- |
| **FI / CO** (Finance & Controlling) | **Sutra Ledger & Tax Engine** | Double-entry ledger, Indian GST/E-Invoicing natively integrated, open schema. |
| **MM** (Materials Management) | **Sutra Supply & Inventory** | MinIO document storage, automated reorder triggers, batch tracking. |
| **SD** (Sales & Distribution) | **Sutra Commerce** | Quotations, Sales Orders, E-Way Bill generation, real-time receivables. |
| **SAP NetWeaver / IAS SSO** | **Sutra Pluggable Auth Core** | Standard JWT authentication + pluggable enterprise SSO (Azure AD OIDC / Okta SAML). |
| **Z-Tables & ABAP Code** | **Sutra No-Code Studio** | Dynamic JSONB entities & drag-and-drop workflow state machines. |
| **SAP BW / SAC** | **Sutra Embedded OLAP** | Real-time financial statement generator and executive KPI cockpit. |
| **SAP Joule Copilot** | **Sutra Gen AI Core** | Bring-your-own-model (Ollama or Cloud), Text-to-ERP query engine, zero-shot IDP invoice extractor. |


---

## 🚀 Quick Start with Docker

Launch the entire Sutra Enterprise Operating System (PostgreSQL 16 with pgvector, MinIO, Valkey, Sutra API, and Sutra Web Console) in one command:

```bash
# 1. Clone repository
git clone https://github.com/tovganesh/sutra.git
cd sutra

# 2. Copy environment file
cp .env.example .env

# 3. Start all services
docker compose up -d
```

### Accessing Endpoints:
* 🖥️ **Sutra Web Console & Studio**: `http://localhost:3000`
* 🌐 **Sutra API Gateway**: `http://localhost:4000/api/v1/health`
* 🗄️ **MinIO S3 Storage Console**: `http://localhost:9001` (User: `sutra_minio_admin` / Pass: `sutra_minio_secret_key_123`)
* 🐘 **PostgreSQL 16**: `localhost:5432` (`sutra_db`)

---

## 📦 Monorepo Architecture

```text
sutra/
├── apps/
│   ├── api/                    # Core Express/TypeScript API Gateway & Microservices
│   └── web/                    # Enterprise Web Console & Studio (Vue 3 + Vite + Glassmorphism SPA)
├── packages/
│   ├── core/                   # RBAC, Pluggable Auth, Double-Entry Ledger, MM, O2C, P2P, Valkey Queue
│   ├── compliance-india/       # GSTIN (Modulo-36), GSTR-1/3B, E-Invoice, E-Way Bill, Payroll & TDS Engine
│   ├── no-code/                # Dynamic Entity Modeler & Workflow State Machine Engine
│   ├── analytics/              # Real-time P&L, Balance Sheet & Executive KPI Evaluator
│   └── ai-agent/               # Unified LLM Client (Ollama / Cloud), Text-to-ERP, IDP OCR
├── docker/
│   ├── Dockerfile.api          # Container definition for backend
│   ├── Dockerfile.web          # Container definition for web console
│   └── postgres-init/          # SQL DDL migrations, pgvector, and initial seed data
├── docs/                       # Architectural blueprints, migration guides, compliance docs
├── test/                       # Automated unit tests for compliance, ledger, and enterprise core
├── docker-compose.yml          # Complete orchestration (PostgreSQL 16, Valkey 8, MinIO, API, Web)
├── LICENSE                     # Apache 2.0 License
└── README.md
```

---

## 🏭 Enterprise ERP Operations (MM, SD, P2P, FI)

Sutra includes end-to-end operational workflows on modern cloud-native foundations:
1. **Materials Management (SAP MM)**:
   * Multi-type Material Master (`ROH` Raw Materials, `HALB` Semi-Finished, `FERT` Finished Goods, `HAWA` Trading Goods).
   * Real-time Moving Average Price (MAP) recalculation on receipt:
     $$\text{New MAP} = \frac{(\text{Current Qty} \times \text{Current MAP}) + (\text{Receipt Qty} \times \text{Unit Cost})}{\text{Current Qty} + \text{Receipt Qty}}$$
   * Movement types (`101` Goods Receipt, `102` Reversal, `201` Consumption, `311` Storage Transfer, `601` Sales Delivery).
   * Automated double-entry GL postings (`Dr Inventory`, `Cr GR/IR Clearing Account`).
2. **Order-to-Cash (SAP SD / O2C)**:
   * Real-time Available-to-Promise (ATP) stock checks and Customer Credit Limit enforcement.
   * Outbound Delivery Picking and Post Goods Issue (PGI Movement 601) with live COGS accounting.
   * Billing Invoice generation with official NIC E-Invoice 64-char IRN hash and automatic E-Way Bill triggers (&gt; ₹50,000).
3. **Procure-to-Pay (SAP MM / FI-AP / P2P)**:
   * Purchase Order creation with MSME Section 43B(h) statutory payment deadline calculation (45-day cap).
   * Dock Goods Receipt (GRN Movement 101) updating inventory and MAP.
   * **3-Way Matching Verification**: Audits PO price & quantity vs GRN physical receipt vs Vendor Invoice.
   * Statutory Income Tax TDS withholding (Sec 194Q for goods &gt; ₹50L @ 0.1%, Sec 194C contractor @ 2%, Sec 194J professional @ 10%).
4. **Subledger Aging & Working Capital (SAP FI-AR / FI-AP)**:
   * Real-time aging buckets: Current (0–30 Days), 31–60 Days, 61–90 Days, and Overdue (&gt; 90 Days).
   * Days Sales Outstanding (DSO) and Days Payable Outstanding (DPO) gauges with net working capital exposure analysis.

---

## 🇮🇳 India-First Compliance Engine

Sutra is specifically tuned for Indian enterprise statutory regulations:
1. **GSTIN Validation**: Verifies 15-character format, state code, and Modulo-36 checksum according to ISO/IEC 7064.
2. **Intra vs Inter-State Tax Determination**:
   * Intra-State (`Supplier State == Place of Supply`): Splits tax into `CGST (50%) + SGST (50%)`.
   * Inter-State (`Supplier State != Place of Supply`): Applies `IGST (100%)`.
3. **Official GSTR Returns**:
   * **GSTR-1**: Generates official JSON payloads (Table 4 B2B, Table 12 HSN Summary, Table 13 Document Issue).
   * **GSTR-3B**: Full summary with statutory **Rule 88A set-off order** (IGST ITC fully exhausted before CGST/SGST).
4. **NIC E-Invoicing & E-Way Bill**:
   * Computes 64-character SHA-256 IRN hash and signed QR code payload.
   * E-Way Bill JSON generation with distance-based statutory validity calculation (200 km/day).
5. **Indian Payroll & TDS**:
   * Statutory EPF (12%), EPS (8.33%), EDLI, Admin charges, and ESI (0.75% / 3.25%).
   * State-wise Professional Tax (Maharashtra, Karnataka, Telangana, Tamil Nadu, West Bengal).
   * Income Tax TDS (Sections 194C, 194J, 194Q) with Section 206AA penalty rate checks (20%) for missing PANs.

---

## 🤖 Dual-Engine Generative AI

Sutra provides an enterprise-ready Gen AI layer that respects data privacy:
* **Air-Gapped & Sovereign**: Run local LLMs with **Ollama** (`llama3.2`, `mistral`, `deepseek`) or **vLLM** without sending proprietary enterprise financial data outside your perimeter.
* **Cloud High-Throughput**: Switch to **OpenAI** (`gpt-4o`), **Google Gemini**, or **Anthropic** with a single configuration flag (`AI_PROVIDER=openai`).
* **Text-to-ERP**: Translate natural language questions ("Which customers in Pune have unpaid bills over ₹50,000?") into safe, structured database operations.
* **Intelligent Document Processing (IDP)**: Zero-shot extraction of vendor bills, line items, and tax breakdowns from scanned PDFs or raw OCR text.

---

## 🧪 Automated Test Suite

Run the complete test suite validating compliance algorithms, double-entry ledger invariants, and enterprise core engines:

```bash
# Run 22+ automated tests using native Node.js test runner
npm test
```

---

## 🛠️ Local Development (Without Docker)

If you prefer running locally with Node.js:

```bash
# 1. Install dependencies
npm.cmd install

# 2. Build packages
npm.cmd run build

# 3. Run automated tests
npm.cmd test

# 4. Start API gateway
npm.cmd run dev:api

# 5. In a separate terminal, serve Vue 3 Web Console
npm.cmd run dev:web
```

---

## 📜 License

This project is licensed under the **Apache License, Version 2.0**.  
See the [LICENSE](LICENSE) file for details.

---

<div align="center">
Built with ❤️ for an open, unencumbered enterprise future by <a href="https://github.com/tovganesh">tovganesh</a> and Sutra contributors.
</div>

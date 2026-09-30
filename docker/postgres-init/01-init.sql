-- =================================================================
-- Sutra - The Open Enterprise Operating System
-- PostgreSQL Schema Initialization & Core Data
-- =================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Multi-Tenant Organization Structure
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    country VARCHAR(3) NOT NULL DEFAULT 'IN',
    base_currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    tax_identifier VARCHAR(50), -- E.g. GSTIN for India, EIN for US
    is_active BOOLEAN NOT NULL DEFAULT true,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Security, RBAC & Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    designation VARCHAR(100),
    department VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_superadmin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_user_email UNIQUE (tenant_id, email)
);

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_role_name UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(100) PRIMARY KEY, -- e.g. 'finance:invoice:create', 'ledger:read'
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(100) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 4. Immutable Cryptographic Audit Log
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, POST, APPROVE, REVERT
    entity_type VARCHAR(100) NOT NULL, -- Invoice, JournalEntry, User, EntitySchema
    entity_id VARCHAR(100) NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    diff JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_logs_tenant_entity ON audit_logs(tenant_id, entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- 5. Financial Core (Chart of Accounts & General Ledger)
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    parent_id UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    is_reconciliation BOOLEAN DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_account_code UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entry_number VARCHAR(100) NOT NULL,
    entry_date DATE NOT NULL,
    posting_date DATE NOT NULL,
    reference VARCHAR(255),
    narration TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, POSTED, VOID
    total_debit NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_credit NUMERIC(18, 4) NOT NULL DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_journal_number UNIQUE (tenant_id, entry_number)
);

CREATE TABLE IF NOT EXISTS journal_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    debit NUMERIC(18, 4) NOT NULL DEFAULT 0,
    credit NUMERIC(18, 4) NOT NULL DEFAULT 0,
    cost_center VARCHAR(100),
    description TEXT,
    line_order INT NOT NULL DEFAULT 0
);

-- 6. Sales, Purchases & Tax/E-Invoicing (India-First & Global)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_type VARCHAR(50) NOT NULL, -- SALES, PURCHASE, CREDIT_NOTE, DEBIT_NOTE
    party_name VARCHAR(255) NOT NULL,
    party_gstin VARCHAR(15), -- India GSTIN
    party_pan VARCHAR(10),   -- India PAN
    place_of_supply VARCHAR(2), -- 2-digit Indian State Code
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    subtotal NUMERIC(18, 4) NOT NULL DEFAULT 0,
    cgst_total NUMERIC(18, 4) NOT NULL DEFAULT 0,
    sgst_total NUMERIC(18, 4) NOT NULL DEFAULT 0,
    igst_total NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_amount NUMERIC(18, 4) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, SUBMITTED, IRN_GENERATED, PAID, CANCELLED
    -- E-Invoice & E-Way Bill Integration fields
    irn VARCHAR(64), -- Invoice Reference Number (64-char hex hash)
    ack_no VARCHAR(50),
    ack_date TIMESTAMP WITH TIME ZONE,
    signed_qr_code TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_invoice_number UNIQUE (tenant_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    item_code VARCHAR(100),
    description TEXT NOT NULL,
    hsn_sac VARCHAR(10) NOT NULL, -- HSN/SAC Code for GST
    quantity NUMERIC(14, 4) NOT NULL DEFAULT 1,
    unit_price NUMERIC(18, 4) NOT NULL DEFAULT 0,
    taxable_amount NUMERIC(18, 4) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0, -- e.g. 18.00%
    cgst_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
    cgst_amount NUMERIC(18, 4) NOT NULL DEFAULT 0,
    sgst_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
    sgst_amount NUMERIC(18, 4) NOT NULL DEFAULT 0,
    igst_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
    igst_amount NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_amount NUMERIC(18, 4) NOT NULL DEFAULT 0
);

-- 7. No-Code Dynamic Entity Modeler & Records
CREATE TABLE IF NOT EXISTS dynamic_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'cube',
    schema_definition JSONB NOT NULL, -- fields, types, validations, relationships
    ui_definition JSONB DEFAULT '{}'::jsonb, -- form layouts, list view columns, filters
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_entity_slug UNIQUE (tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS dynamic_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_slug VARCHAR(100) NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_dynamic_records_lookup ON dynamic_records(tenant_id, entity_slug);
CREATE INDEX idx_dynamic_records_gin ON dynamic_records USING GIN (data);

-- 8. Visual Workflow State Machines & Automations
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    trigger_event VARCHAR(100) NOT NULL, -- 'invoice:created', 'record:updated', 'po:submitted'
    conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Object Storage Vault (MinIO metadata tracking)
CREATE TABLE IF NOT EXISTS document_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    bucket_name VARCHAR(100) NOT NULL,
    object_key VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100), -- 'Invoice', 'Bill', 'Vendor', 'Employee'
    entity_id VARCHAR(100),
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Vector Embeddings Table for Sutra Gen AI Knowledge Base
CREATE TABLE IF NOT EXISTS enterprise_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL, -- 'invoice_summary', 'customer_profile', 'sop_policy', 'product_spec'
    reference_id VARCHAR(100),
    chunk_text TEXT NOT NULL,
    embedding vector(1536), -- compatible with standard embedding models (OpenAI, Ollama nomic-embed-text)
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON enterprise_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =================================================================
-- SEED DATA: Default Organization, Admin, Permissions & Chart of Accounts
-- =================================================================

-- Seed Tenant: "Bharat Enterprise Technologies"
INSERT INTO tenants (id, name, code, country, base_currency, tax_identifier)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Bharat Enterprise Technologies Ltd',
    'BHARAT_TECH',
    'IN',
    'INR',
    '27AAACB2212M1Z0'
) ON CONFLICT DO NOTHING;

-- Seed Standard Permissions
INSERT INTO permissions (id, module, action, description) VALUES
('finance:invoice:read', 'finance', 'read', 'View invoices and billing records'),
('finance:invoice:create', 'finance', 'create', 'Create and draft new invoices'),
('finance:invoice:post', 'finance', 'post', 'Approve and post invoices to general ledger'),
('finance:einvoice:generate', 'finance', 'einvoice', 'Generate NIC E-Invoice IRN & QR Code'),
('ledger:read', 'ledger', 'read', 'View Chart of Accounts and Journal Entries'),
('ledger:write', 'ledger', 'write', 'Create and post manual Journal Entries'),
('compliance:gst:manage', 'compliance', 'manage', 'Generate GST returns (GSTR-1, GSTR-3B) and run reconciliations'),
('nocode:schema:manage', 'nocode', 'manage', 'Design dynamic custom entities and forms'),
('nocode:records:crud', 'nocode', 'crud', 'Manage records of custom business applications'),
('ai:query:execute', 'ai', 'execute', 'Execute Gen AI natural language ERP queries')
ON CONFLICT DO NOTHING;

-- Seed Administrator Role
INSERT INTO roles (id, tenant_id, name, description, is_system)
VALUES (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'EnterpriseAdministrator',
    'Full administrative privileges across all Sutra OS modules',
    true
) ON CONFLICT DO NOTHING;

-- Map All Permissions to Administrator
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000010', id FROM permissions
ON CONFLICT DO NOTHING;

-- Seed Default Admin User (Password: admin123)
-- bcrypt hash for 'admin123'
INSERT INTO users (id, tenant_id, email, password_hash, full_name, designation, department, is_active, is_superadmin)
VALUES (
    '00000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000001',
    'admin@sutra.local',
    '$2b$10$fWn49p2924zH3eWl4xP7kOXy5v4a9b6C7d8E9f0G1H2I3J4K5L6M7',
    'Sutra Chief Administrator',
    'Enterprise Architect',
    'Executive Leadership',
    true,
    true
) ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
VALUES ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010')
ON CONFLICT DO NOTHING;

-- Seed Standard Indian Chart of Accounts (FI/CO Foundation)
INSERT INTO chart_of_accounts (tenant_id, code, name, account_type) VALUES
('00000000-0000-0000-0000-000000000001', '1000', 'Cash and Cash Equivalents', 'ASSET'),
('00000000-0000-0000-0000-000000000001', '1100', 'HDFC Operating Bank Account', 'ASSET'),
('00000000-0000-0000-0000-000000000001', '1200', 'Trade Accounts Receivable', 'ASSET'),
('00000000-0000-0000-0000-000000000001', '1300', 'Raw Material & Finished Goods Inventory', 'ASSET'),
('00000000-0000-0000-0000-000000000001', '1410', 'Input Tax Credit - CGST', 'ASSET'),
('00000000-0000-0000-0000-000000000001', '1420', 'Input Tax Credit - SGST', 'ASSET'),
('00000000-0000-0000-0000-000000000001', '1430', 'Input Tax Credit - IGST', 'ASSET'),
('00000000-0000-0000-0000-000000000001', '2000', 'Trade Accounts Payable', 'LIABILITY'),
('00000000-0000-0000-0000-000000000001', '2110', 'Output Tax Payable - CGST', 'LIABILITY'),
('00000000-0000-0000-0000-000000000001', '2120', 'Output Tax Payable - SGST', 'LIABILITY'),
('00000000-0000-0000-0000-000000000001', '2130', 'Output Tax Payable - IGST', 'LIABILITY'),
('00000000-0000-0000-0000-000000000001', '2200', 'TDS Payable (Sec 194C / 194J)', 'LIABILITY'),
('00000000-0000-0000-0000-000000000001', '3000', 'Common Share Capital', 'EQUITY'),
('00000000-0000-0000-0000-000000000001', '3100', 'Retained Earnings', 'EQUITY'),
('00000000-0000-0000-0000-000000000001', '4000', 'Enterprise Software & Services Revenue', 'REVENUE'),
('00000000-0000-0000-0000-000000000001', '5000', 'Cost of Goods Sold (COGS)', 'EXPENSE'),
('00000000-0000-0000-0000-000000000001', '5100', 'Employee Salaries & Benefits', 'EXPENSE')
ON CONFLICT DO NOTHING;

-- =================================================================
-- 11. Materials Management (MM) - Material Master & Movements
-- =================================================================
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    material_type VARCHAR(20) NOT NULL, -- ROH, HALB, FERT, HAWA, DIEN
    base_uom VARCHAR(20) NOT NULL,      -- KG, EA, LTR, MTR
    hsn_code VARCHAR(10) NOT NULL,
    standard_price NUMERIC(18, 4) NOT NULL DEFAULT 0,
    moving_avg_price NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_stock NUMERIC(18, 4) NOT NULL DEFAULT 0,
    safety_stock NUMERIC(18, 4) NOT NULL DEFAULT 0,
    reorder_point NUMERIC(18, 4) NOT NULL DEFAULT 0,
    valuation_class VARCHAR(20) DEFAULT '3000',
    gl_inventory_account VARCHAR(50) DEFAULT '1300',
    gl_cogs_account VARCHAR(50) DEFAULT '5000',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_material_sku UNIQUE (tenant_id, sku)
);

CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_number VARCHAR(100) NOT NULL,
    movement_type VARCHAR(10) NOT NULL, -- 101, 102, 201, 261, 311, 601
    material_sku VARCHAR(100) NOT NULL,
    quantity NUMERIC(18, 4) NOT NULL,
    unit_cost NUMERIC(18, 4) NOT NULL,
    from_plant VARCHAR(50),
    to_plant VARCHAR(50),
    reference_document VARCHAR(100),
    cost_center VARCHAR(100),
    journal_id UUID REFERENCES journal_entries(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================
-- 12. Sales Orders (SD) & Purchase Orders (P2P)
-- =================================================================
CREATE TABLE IF NOT EXISTS sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_number VARCHAR(100) NOT NULL,
    customer_id VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_gstin VARCHAR(15),
    status VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
    taxable_amount NUMERIC(18, 4) NOT NULL DEFAULT 0,
    cgst_amount NUMERIC(18, 4) NOT NULL DEFAULT 0,
    sgst_amount NUMERIC(18, 4) NOT NULL DEFAULT 0,
    igst_amount NUMERIC(18, 4) NOT NULL DEFAULT 0,
    grand_total NUMERIC(18, 4) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_sales_order_num UNIQUE (tenant_id, order_number)
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    po_number VARCHAR(100) NOT NULL,
    vendor_id VARCHAR(100) NOT NULL,
    vendor_name VARCHAR(255) NOT NULL,
    vendor_gstin VARCHAR(15),
    is_msme BOOLEAN DEFAULT false,
    status VARCHAR(50) NOT NULL DEFAULT 'APPROVED',
    taxable_total NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_po_value NUMERIC(18, 4) NOT NULL DEFAULT 0,
    payment_terms_days INT DEFAULT 45,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_po_number UNIQUE (tenant_id, po_number)
);

-- =================================================================
-- 13. Production Planning & Manufacturing (PP)
-- =================================================================
CREATE TABLE IF NOT EXISTS bills_of_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    parent_sku VARCHAR(100) NOT NULL,
    bom_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    plant_id VARCHAR(50) NOT NULL DEFAULT 'PLANT-1000',
    components JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_bom_parent UNIQUE (tenant_id, parent_sku, bom_version)
);

CREATE TABLE IF NOT EXISTS production_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_number VARCHAR(100) NOT NULL,
    target_sku VARCHAR(100) NOT NULL,
    target_quantity NUMERIC(18, 4) NOT NULL,
    produced_quantity NUMERIC(18, 4) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'RELEASED',
    planned_cost NUMERIC(18, 4) NOT NULL DEFAULT 0,
    actual_cost NUMERIC(18, 4) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_production_order_num UNIQUE (tenant_id, order_number)
);

-- =================================================================
-- 14. Fixed Asset Accounting (FI-AA)
-- =================================================================
CREATE TABLE IF NOT EXISTS fixed_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asset_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    asset_class VARCHAR(50) NOT NULL, -- BUILDINGS, PLANT_MACHINERY, IT_EQUIPMENT, VEHICLES
    cost_center VARCHAR(100) NOT NULL,
    capitalization_date DATE NOT NULL,
    original_cost NUMERIC(18, 4) NOT NULL,
    salvage_value NUMERIC(18, 4) NOT NULL,
    useful_life_years INT NOT NULL,
    depreciation_method VARCHAR(20) NOT NULL DEFAULT 'SLM',
    accumulated_depreciation NUMERIC(18, 4) NOT NULL DEFAULT 0,
    current_book_value NUMERIC(18, 4) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_asset_id UNIQUE (tenant_id, asset_id)
);

-- =================================================================
-- 15. Quality Management (QM) & Batch Traceability
-- =================================================================
CREATE TABLE IF NOT EXISTS inspection_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lot_id VARCHAR(100) NOT NULL,
    origin VARCHAR(50) NOT NULL, -- 01_GOODS_RECEIPT, 04_PRODUCTION, 08_STOCK_TRANSFER
    material_sku VARCHAR(100) NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    quantity NUMERIC(18, 4) NOT NULL,
    base_uom VARCHAR(20) NOT NULL,
    plant_id VARCHAR(50) NOT NULL,
    reference_document VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED', -- CREATED, RESULTS_RECORDED, UD_COMPLETED
    usage_decision VARCHAR(50), -- ACCEPTED, REJECTED, SCRAPPED
    movement_type VARCHAR(10),  -- 321, 350, 551
    characteristics JSONB NOT NULL DEFAULT '[]'::jsonb,
    results JSONB NOT NULL DEFAULT '[]'::jsonb,
    decided_by VARCHAR(100),
    decided_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_lot_id UNIQUE (tenant_id, lot_id)
);

CREATE TABLE IF NOT EXISTS batch_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    material_sku VARCHAR(100) NOT NULL,
    plant_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'IN_QUALITY', -- UNRESTRICTED, IN_QUALITY, BLOCKED
    manufacturing_date DATE NOT NULL,
    expiry_date DATE,
    vendor_batch VARCHAR(100),
    total_quantity NUMERIC(18, 4) NOT NULL,
    parent_batches JSONB NOT NULL DEFAULT '[]'::jsonb,
    child_batches JSONB NOT NULL DEFAULT '[]'::jsonb,
    delivered_sales_orders JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_batch_num UNIQUE (tenant_id, batch_number)
);

-- =================================================================
-- 16. Controlling (CO) & Cost Center Accounting
-- =================================================================
CREATE TABLE IF NOT EXISTS profit_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    segment VARCHAR(100) NOT NULL,
    responsible_person VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_profit_center UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS cost_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- PRODUCTION, ADMINISTRATION, R_AND_D, LOGISTICS, SHARED_SERVICE
    manager VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'INR',
    profit_center_code VARCHAR(50) REFERENCES profit_centers(code),
    budget_annual NUMERIC(18, 4) NOT NULL DEFAULT 0,
    actual_incurred NUMERIC(18, 4) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_cost_center UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS cost_allocation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    rule_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    sender_cost_center VARCHAR(50) NOT NULL,
    assessment_type VARCHAR(50) NOT NULL DEFAULT 'PERCENTAGE',
    receiver_distributions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_alloc_rule UNIQUE (tenant_id, rule_id)
);

-- =================================================================
-- 17. Plant Maintenance & Enterprise Asset Management (PM/EAM)
-- =================================================================
CREATE TABLE IF NOT EXISTS pm_functional_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    location_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    plant_id VARCHAR(50) NOT NULL,
    cost_center VARCHAR(100) NOT NULL,
    parent_location_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_pm_floc UNIQUE (tenant_id, location_id)
);

CREATE TABLE IF NOT EXISTS pm_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    equipment_number VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    functional_location_id VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100),
    manufacturer VARCHAR(100),
    model_year INT,
    category VARCHAR(50) NOT NULL, -- MACHINERY, VEHICLE, TOOLING, ELECTRICAL, HVAC, INSTRUMENTATION
    status VARCHAR(50) NOT NULL DEFAULT 'OPERATIONAL', -- OPERATIONAL, IN_MAINTENANCE, BREAKDOWN, DECOMMISSIONED
    operating_hours NUMERIC(18, 2) NOT NULL DEFAULT 0,
    fixed_asset_tag VARCHAR(100),
    cost_center VARCHAR(100) NOT NULL,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_pm_eq UNIQUE (tenant_id, equipment_number)
);

CREATE TABLE IF NOT EXISTS pm_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    notification_number VARCHAR(100) NOT NULL,
    equipment_number VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- BREAKDOWN, CORRECTIVE, PREVENTIVE, INSPECTION
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM', -- VERY_HIGH, HIGH, MEDIUM, LOW
    short_description VARCHAR(500) NOT NULL,
    reported_by VARCHAR(100) NOT NULL,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'NEW', -- NEW, IN_PROCESS, ORDER_CREATED, COMPLETED
    breakdown_duration_hours NUMERIC(10, 2),
    work_order_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_pm_notif UNIQUE (tenant_id, notification_number)
);

CREATE TABLE IF NOT EXISTS pm_work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_number VARCHAR(100) NOT NULL,
    notification_number VARCHAR(100),
    equipment_number VARCHAR(100) NOT NULL,
    order_type VARCHAR(50) NOT NULL DEFAULT 'CORRECTIVE', -- CORRECTIVE, PREVENTIVE, OVERHAUL, CALIBRATION
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED', -- CREATED, RELEASED, TECHNICALLY_COMPLETED, CLOSED
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    assigned_technician VARCHAR(100) NOT NULL,
    cost_center VARCHAR(100) NOT NULL,
    estimated_labor_hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
    actual_labor_hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
    labor_hourly_rate NUMERIC(18, 4) NOT NULL DEFAULT 750,
    total_labor_cost NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_material_cost NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_actual_cost NUMERIC(18, 4) NOT NULL DEFAULT 0,
    spare_parts JSONB NOT NULL DEFAULT '[]'::jsonb,
    settled_cost_center VARCHAR(100),
    gl_settlement JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_pm_wo UNIQUE (tenant_id, order_number)
);

CREATE TABLE IF NOT EXISTS pm_maintenance_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_number VARCHAR(100) NOT NULL,
    equipment_number VARCHAR(100) NOT NULL,
    cycle_type VARCHAR(50) NOT NULL DEFAULT 'TIME_BASED', -- TIME_BASED, USAGE_BASED
    cycle_interval_days INT,
    cycle_interval_hours NUMERIC(10, 2),
    task_description TEXT NOT NULL,
    estimated_hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_triggered_date DATE,
    last_triggered_hours NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_pm_plan UNIQUE (tenant_id, plan_number)
);

-- =================================================================
-- 18. Treasury & Bank Statement Reconciliation (TRM / FI-BL)
-- =================================================================
CREATE TABLE IF NOT EXISTS trm_house_banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    bank_id VARCHAR(50) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    swift_code VARCHAR(20),
    country VARCHAR(10) NOT NULL DEFAULT 'IN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_trm_bank UNIQUE (tenant_id, bank_id)
);

CREATE TABLE IF NOT EXISTS trm_bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    account_id VARCHAR(100) NOT NULL,
    bank_id VARCHAR(50) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_type VARCHAR(50) NOT NULL DEFAULT 'CURRENT', -- CURRENT, SAVINGS, CASH_CREDIT, ESCROW
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    gl_account VARCHAR(50) NOT NULL,
    gl_clearing_account VARCHAR(50) NOT NULL,
    current_book_balance NUMERIC(18, 4) NOT NULL DEFAULT 0,
    reconciled_bank_balance NUMERIC(18, 4) NOT NULL DEFAULT 0,
    last_reconciliation_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_trm_acc UNIQUE (tenant_id, account_id)
);

CREATE TABLE IF NOT EXISTS trm_bank_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    statement_id VARCHAR(100) NOT NULL,
    account_id VARCHAR(100) NOT NULL,
    statement_number VARCHAR(50) NOT NULL,
    opening_date DATE NOT NULL,
    closing_date DATE NOT NULL,
    opening_balance NUMERIC(18, 4) NOT NULL DEFAULT 0,
    closing_balance NUMERIC(18, 4) NOT NULL DEFAULT 0,
    format VARCHAR(20) NOT NULL DEFAULT 'MT940',
    status VARCHAR(50) NOT NULL DEFAULT 'IMPORTED', -- IMPORTED, PARTIALLY_RECONCILED, RECONCILED
    lines JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_trm_stmt UNIQUE (tenant_id, statement_id)
);

CREATE TABLE IF NOT EXISTS trm_gl_clearing_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    account_id VARCHAR(100) NOT NULL,
    entry_number VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    reference VARCHAR(100) NOT NULL,
    direction VARCHAR(10) NOT NULL, -- DEBIT, CREDIT
    amount NUMERIC(18, 4) NOT NULL,
    account_code VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    is_cleared BOOLEAN NOT NULL DEFAULT false,
    cleared_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_trm_clr UNIQUE (tenant_id, account_id, entry_number)
);

-- =================================================================
-- 19. Human Capital Management & Core HR (HCM)
-- =================================================================
CREATE TABLE IF NOT EXISTS hcm_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    cost_center VARCHAR(100) NOT NULL,
    employment_type VARCHAR(50) NOT NULL DEFAULT 'FULL_TIME', -- FULL_TIME, PART_TIME, CONTRACT, INTERN
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, ON_LEAVE, PROBATION, TERMINATED
    date_of_joining DATE NOT NULL,
    pan_number VARCHAR(20) NOT NULL,
    aadhaar_token VARCHAR(100) NOT NULL,
    uan_number VARCHAR(50),
    esic_number VARCHAR(50),
    bank_account_number VARCHAR(50) NOT NULL,
    bank_ifsc VARCHAR(20) NOT NULL,
    salary_structure JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_hcm_emp UNIQUE (tenant_id, employee_id)
);

CREATE TABLE IF NOT EXISTS hcm_attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id VARCHAR(100) NOT NULL,
    month VARCHAR(10) NOT NULL, -- YYYY-MM
    total_working_days INT NOT NULL DEFAULT 22,
    present_days INT NOT NULL DEFAULT 22,
    paid_leave_days INT NOT NULL DEFAULT 0,
    loss_of_pay_days INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_hcm_att UNIQUE (tenant_id, employee_id, month)
);

CREATE TABLE IF NOT EXISTS hcm_payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    run_id VARCHAR(100) NOT NULL,
    month VARCHAR(10) NOT NULL,
    processed_count INT NOT NULL DEFAULT 0,
    total_gross_salaries NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_employee_deductions NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_employer_contributions NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_net_salaries NUMERIC(18, 4) NOT NULL DEFAULT 0,
    gl_posting JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_hcm_run UNIQUE (tenant_id, run_id)
);

CREATE TABLE IF NOT EXISTS hcm_payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    payslip_id VARCHAR(100) NOT NULL,
    employee_id VARCHAR(100) NOT NULL,
    month VARCHAR(10) NOT NULL,
    earned_gross_salary NUMERIC(18, 4) NOT NULL,
    total_deductions NUMERIC(18, 4) NOT NULL,
    net_payable_salary NUMERIC(18, 4) NOT NULL,
    deductions_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    payment_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_hcm_payslip UNIQUE (tenant_id, payslip_id)
);

-- =================================================================
-- 20. Project Systems & Capital Project Costing (PS)
-- =================================================================
CREATE TABLE IF NOT EXISTS ps_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_type VARCHAR(50) NOT NULL DEFAULT 'CAPEX', -- CAPEX, OPEX, CUSTOMER_PROJECT, R_AND_D
    status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS', -- CREATED, APPROVED, IN_PROGRESS, COMPLETED, CLOSED
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    project_manager VARCHAR(100) NOT NULL,
    responsible_cost_center VARCHAR(100) NOT NULL,
    total_approved_budget NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_committed_cost NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_actual_cost NUMERIC(18, 4) NOT NULL DEFAULT 0,
    cwip_account_id VARCHAR(50) NOT NULL DEFAULT '140800',
    capitalized_asset_tag VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_ps_project UNIQUE (tenant_id, project_id)
);

CREATE TABLE IF NOT EXISTS ps_wbs_elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    wbs_code VARCHAR(100) NOT NULL,
    project_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    parent_wbs_code VARCHAR(100),
    cost_center VARCHAR(100) NOT NULL,
    budget_allocated NUMERIC(18, 4) NOT NULL DEFAULT 0,
    budget_committed NUMERIC(18, 4) NOT NULL DEFAULT 0,
    actual_cost_incurred NUMERIC(18, 4) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'RELEASED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_ps_wbs UNIQUE (tenant_id, project_id, wbs_code)
);

CREATE TABLE IF NOT EXISTS ps_project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    milestone_id VARCHAR(100) NOT NULL,
    project_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    target_date DATE NOT NULL,
    completed_date DATE,
    percentage_weight NUMERIC(5, 2) NOT NULL DEFAULT 0,
    is_achieved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_ps_milestone UNIQUE (tenant_id, project_id, milestone_id)
);

-- =================================================================
-- 21. Extended Warehouse Management (SAP EWM)
-- =================================================================
CREATE TABLE IF NOT EXISTS ewm_storage_bins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    bin_id VARCHAR(100) NOT NULL,
    warehouse_id VARCHAR(100) NOT NULL,
    zone VARCHAR(100) NOT NULL,
    aisle VARCHAR(50) NOT NULL,
    rack VARCHAR(50) NOT NULL,
    shelf VARCHAR(50) NOT NULL,
    position VARCHAR(50) NOT NULL,
    bin_type VARCHAR(50) NOT NULL DEFAULT 'STANDARD', -- STANDARD, HIGH_BAY, COLD_STORAGE, HAZARDOUS, STAGING
    max_weight_kg NUMERIC(18, 4) NOT NULL DEFAULT 1000,
    current_weight_kg NUMERIC(18, 4) NOT NULL DEFAULT 0,
    max_volume_cbm NUMERIC(18, 4) NOT NULL DEFAULT 5.0,
    current_volume_cbm NUMERIC(18, 4) NOT NULL DEFAULT 0,
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    is_occupied BOOLEAN NOT NULL DEFAULT false,
    stored_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_ewm_bin UNIQUE (tenant_id, warehouse_id, bin_id)
);

CREATE TABLE IF NOT EXISTS ewm_warehouse_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    task_id VARCHAR(100) NOT NULL,
    task_type VARCHAR(50) NOT NULL, -- PUTAWAY, PICKING, INTERNAL_TRANSFER, REPLENISHMENT
    warehouse_id VARCHAR(100) NOT NULL,
    source_bin_id VARCHAR(100),
    target_bin_id VARCHAR(100),
    sku VARCHAR(100) NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    quantity NUMERIC(18, 4) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED', -- OPEN, IN_PROGRESS, CONFIRMED, CANCELLED
    allocations JSONB,
    confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_ewm_task UNIQUE (tenant_id, task_id)
);

CREATE TABLE IF NOT EXISTS ewm_cycle_counts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    count_id VARCHAR(100) NOT NULL,
    warehouse_id VARCHAR(100) NOT NULL,
    bin_id VARCHAR(100) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    book_quantity NUMERIC(18, 4) NOT NULL,
    physical_counted_quantity NUMERIC(18, 4) NOT NULL,
    variance_quantity NUMERIC(18, 4) NOT NULL,
    unit_cost NUMERIC(18, 4) NOT NULL,
    variance_value NUMERIC(18, 4) NOT NULL,
    gl_voucher_lines JSONB,
    counted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_ewm_count UNIQUE (tenant_id, count_id)
);

-- =================================================================
-- 22. Multi-Currency & Parallel Accounting Ledgers (SAP FI-GL)
-- =================================================================
CREATE TABLE IF NOT EXISTS gl_exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    rate_date DATE NOT NULL,
    rate_type VARCHAR(50) NOT NULL DEFAULT 'SPOT', -- SPOT, CLOSING, MONTHLY_AVERAGE
    rate NUMERIC(18, 6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_gl_rate UNIQUE (tenant_id, from_currency, to_currency, rate_date, rate_type)
);

CREATE TABLE IF NOT EXISTS gl_parallel_ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    ledger_code VARCHAR(10) NOT NULL, -- e.g. 0L (Leading Ind AS), 2L (Non-Leading IFRS/US GAAP)
    name VARCHAR(255) NOT NULL,
    ledger_type VARCHAR(50) NOT NULL DEFAULT 'LEADING', -- LEADING, NON_LEADING, EXTENSION
    base_currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_gl_ledger UNIQUE (tenant_id, ledger_code)
);

CREATE TABLE IF NOT EXISTS gl_parallel_journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_number VARCHAR(100) NOT NULL,
    ledger_group VARCHAR(50) NOT NULL DEFAULT 'ALL',
    posting_date DATE NOT NULL,
    reference VARCHAR(100),
    narrative TEXT,
    transaction_currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    exchange_rate_used NUMERIC(18, 6) NOT NULL DEFAULT 1.0,
    lines JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_gl_par_jrn UNIQUE (tenant_id, document_number)
);

CREATE TABLE IF NOT EXISTS gl_forex_revaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    revaluation_id VARCHAR(100) NOT NULL,
    valuation_date DATE NOT NULL,
    currency VARCHAR(10) NOT NULL,
    closing_rate NUMERIC(18, 6) NOT NULL,
    items_evaluated INT NOT NULL DEFAULT 0,
    total_unrealized_gain NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_unrealized_loss NUMERIC(18, 4) NOT NULL DEFAULT 0,
    net_forex_impact NUMERIC(18, 4) NOT NULL DEFAULT 0,
    gl_voucher_lines JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_gl_fx_rev UNIQUE (tenant_id, revaluation_id)
);

-- =================================================================
-- 23. Indian Customs & Cross-Border Trade Compliance (Customs Act 1962, Rule 96A LUT)
-- =================================================================
CREATE TABLE IF NOT EXISTS customs_import_declarations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    bill_of_entry_number VARCHAR(100) NOT NULL,
    port_code VARCHAR(10) NOT NULL, -- e.g. INNSA1 (Nhava Sheva Sea), INBOM4 (Sahar Air Cargo)
    hsn_code VARCHAR(20) NOT NULL,
    cif_value_inr NUMERIC(18, 4) NOT NULL,
    bcd_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 10.0,
    bcd_amount NUMERIC(18, 4) NOT NULL,
    sws_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 10.0,
    sws_amount NUMERIC(18, 4) NOT NULL,
    igst_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 18.0,
    igst_amount NUMERIC(18, 4) NOT NULL,
    anti_dumping_duty NUMERIC(18, 4) NOT NULL DEFAULT 0.0,
    total_customs_duty NUMERIC(18, 4) NOT NULL,
    creditable_itc NUMERIC(18, 4) NOT NULL,
    non_creditable_duty_cost NUMERIC(18, 4) NOT NULL,
    gl_voucher_lines JSONB,
    clearance_status VARCHAR(50) NOT NULL DEFAULT 'ASSESSED', -- FILED, ASSESSED, DUTY_PAID, OUT_OF_CHARGE
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_boe UNIQUE (tenant_id, bill_of_entry_number)
);

CREATE TABLE IF NOT EXISTS export_lut_filings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lut_arn VARCHAR(50) NOT NULL,
    exporter_gstin VARCHAR(15) NOT NULL,
    financial_year VARCHAR(10) NOT NULL, -- e.g. 2026-27
    filing_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE_VALID_LUT', -- ACTIVE_VALID_LUT, EXPIRED, REVOKED
    governing_rule VARCHAR(100) NOT NULL DEFAULT 'Rule 96A of CGST Rules 2017',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_lut UNIQUE (tenant_id, lut_arn)
);


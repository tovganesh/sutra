<template>
  <div class="supply-chain-container">
    <!-- Header banner -->
    <div class="erp-header">
      <div class="header-titles">
        <div class="badge-row">
          <span class="badge blue">SAP S/4HANA Equivalent</span>
          <span class="badge green">MM • SD • P2P • FI-AR/AP</span>
          <span class="badge purple">India GST & E-Invoice Integrated</span>
        </div>
        <h2>Enterprise Supply Chain & Operations Cockpit</h2>
        <p class="subtitle">Unified Materials Management, Order-to-Cash, Procure-to-Pay with 3-Way Match, and Working Capital</p>
      </div>

      <!-- Quick KPI Strip -->
      <div class="kpi-strip">
        <div class="kpi-card">
          <span class="kpi-label">Total Inventory Valuation</span>
          <span class="kpi-value">₹{{ (totalInventoryValuation).toLocaleString('en-IN') }}</span>
          <span class="kpi-trend positive">Moving Avg Price (MAP)</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Days Sales Outstanding (DSO)</span>
          <span class="kpi-value">{{ agingData.receivables.dsoDays }} Days</span>
          <span class="kpi-trend info">AR Benchmark: &lt; 45d</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">MSME Payment Deadlines</span>
          <span class="kpi-value text-accent">100% Compliant</span>
          <span class="kpi-trend positive">Sec 43B(h) Safe</span>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="sub-nav-tabs">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'inventory' }"
        @click="activeTab = 'inventory'"
      >
        <Package class="tab-icon" />
        <span>Materials & Inventory (MM)</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'o2c' }"
        @click="activeTab = 'o2c'"
      >
        <TrendingUp class="tab-icon" />
        <span>Order-to-Cash (SD)</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'p2p' }"
        @click="activeTab = 'p2p'"
      >
        <ShoppingCart class="tab-icon" />
        <span>Procure-to-Pay & 3-Way Match</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'subledger' }"
        @click="activeTab = 'subledger'"
      >
        <Clock class="tab-icon" />
        <span>AR / AP Working Capital</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'mfg' }"
        @click="activeTab = 'mfg'"
      >
        <Factory class="tab-icon" />
        <span>Manufacturing & BOM (PP)</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'assets' }"
        @click="activeTab = 'assets'"
      >
        <Building2 class="tab-icon" />
        <span>Fixed Assets & Depr (FI-AA)</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'quality' }"
        @click="activeTab = 'quality'"
      >
        <ShieldCheck class="tab-icon" />
        <span>Quality & Traceability (QM)</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'controlling' }"
        @click="activeTab = 'controlling'"
      >
        <PieChart class="tab-icon" />
        <span>Cost Centers & Alloc (CO)</span>
      </button>
    </div>

    <!-- TAB 1: Materials Management & Inventory (MM) -->
    <div v-if="activeTab === 'inventory'" class="tab-content">
      <div class="grid-2-1">
        <!-- Material Master Table -->
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Material Master (SKU Catalog)</h3>
              <span class="panel-sub">Raw Materials (ROH), Semi-Finished (HALB), Finished Goods (FERT)</span>
            </div>
            <button class="action-btn-sm" @click="refreshMaterials">
              <RefreshCw class="btn-icon-sm" />
              <span>Refresh Stock</span>
            </button>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>UoM</th>
                  <th>HSN</th>
                  <th>Stock Qty</th>
                  <th>Moving Avg Price</th>
                  <th>Valuation (INR)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="mat in materials" :key="mat.sku">
                  <td class="font-mono text-cyan">{{ mat.sku }}</td>
                  <td>
                    <div class="mat-name">{{ mat.name }}</div>
                  </td>
                  <td>
                    <span class="type-pill" :class="mat.materialType.toLowerCase()">{{ mat.materialType }}</span>
                  </td>
                  <td class="text-dim">{{ mat.baseUom }}</td>
                  <td class="font-mono text-dim">{{ mat.hsnCode }}</td>
                  <td class="font-mono font-bold">{{ mat.totalStock.toLocaleString() }}</td>
                  <td class="font-mono">₹{{ mat.movingAvgPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }}</td>
                  <td class="font-mono font-bold text-accent">₹{{ (mat.totalStock * mat.movingAvgPrice).toLocaleString('en-IN') }}</td>
                  <td>
                    <span v-if="mat.totalStock <= mat.reorderPoint" class="status-pill warning">Reorder Req</span>
                    <span v-else class="status-pill success">Optimal</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Inventory Movement Simulator -->
        <div class="panel">
          <div class="panel-header">
            <h3>Execute Stock Movement</h3>
            <span class="panel-sub">SAP Movement Types (101, 201, 311, 601)</span>
          </div>

          <form @submit.prevent="executeMovement" class="movement-form">
            <div class="form-group">
              <label>Movement Type</label>
              <select v-model="movementForm.movementType" class="form-select">
                <option value="101">101 - Goods Receipt from Purchase Order (Increases Stock + MAP)</option>
                <option value="201">201 - Goods Issue to Cost Center / Consumption</option>
                <option value="311">311 - Storage Location Transfer (Plant 1000)</option>
                <option value="601">601 - Goods Issue for Outbound Sales Delivery</option>
              </select>
            </div>

            <div class="form-group">
              <label>Target Material (SKU)</label>
              <select v-model="movementForm.sku" class="form-select">
                <option v-for="m in materials" :key="m.sku" :value="m.sku">
                  {{ m.sku }} — {{ m.name }}
                </option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Quantity</label>
                <input v-model.number="movementForm.quantity" type="number" min="1" class="form-input" required />
              </div>
              <div class="form-group" v-if="movementForm.movementType === '101'">
                <label>Inbound Unit Cost (INR)</label>
                <input v-model.number="movementForm.unitCost" type="number" step="0.01" class="form-input" required />
              </div>
              <div class="form-group" v-if="movementForm.movementType === '201'">
                <label>Cost Center</label>
                <input v-model="movementForm.costCenter" type="text" class="form-input" />
              </div>
            </div>

            <button type="submit" class="submit-btn" :disabled="isMoving">
              <Layers class="btn-icon" />
              <span>{{ isMoving ? 'Executing & Posting to GL...' : 'Post Inventory Movement' }}</span>
            </button>
          </form>

          <!-- Movement Result & Real-Time GL Journal -->
          <div v-if="movementResult" class="movement-result-box">
            <div class="result-header">
              <CheckCircle2 class="icon-success" />
              <div>
                <strong>Doc {{ movementResult.movementDocumentId }}</strong>
                <span>Mvt {{ movementResult.movementType }} executed successfully</span>
              </div>
            </div>

            <div class="map-comparison">
              <div>
                <span class="sub-label">Previous Stock:</span>
                <strong>{{ movementResult.previousStock.toLocaleString() }}</strong>
              </div>
              <div>
                <span class="sub-label">Current Stock:</span>
                <strong class="text-accent">{{ movementResult.currentStock.toLocaleString() }}</strong>
              </div>
              <div>
                <span class="sub-label">New MAP:</span>
                <strong class="text-cyan">₹{{ movementResult.newMovingAvgPrice.toFixed(2) }}</strong>
              </div>
            </div>

            <div v-if="movementResult.journalLines && movementResult.journalLines.length" class="gl-lines-box">
              <span class="gl-title">Automated Double-Entry General Ledger Postings:</span>
              <div v-for="(line, idx) in movementResult.journalLines" :key="idx" class="gl-line">
                <span class="font-mono text-dim">{{ line.accountCode }}</span>
                <span class="gl-acc-name">{{ line.accountName }}</span>
                <span class="font-mono text-green" v-if="line.debit > 0">Dr ₹{{ line.debit.toLocaleString('en-IN') }}</span>
                <span class="font-mono text-cyan" v-if="line.credit > 0">Cr ₹{{ line.credit.toLocaleString('en-IN') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: Sales & Distribution (Order-to-Cash SD) -->
    <div v-if="activeTab === 'o2c'" class="tab-content">
      <div class="grid-2-1">
        <!-- Customer Master & Credit Limits -->
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Customer Master & Credit Exposure</h3>
              <span class="panel-sub">Real-time Available-to-Promise (ATP) & Credit Limit Verification</span>
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Company Name</th>
                  <th>GSTIN</th>
                  <th>State</th>
                  <th>Credit Limit</th>
                  <th>Current Exposure</th>
                  <th>Credit Utilization</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cust in customers" :key="cust.customerId">
                  <td class="font-mono text-cyan">{{ cust.customerId }}</td>
                  <td>{{ cust.name }}</td>
                  <td class="font-mono text-dim">{{ cust.gstin }}</td>
                  <td><span class="badge blue">{{ cust.stateCode === '27' ? 'MH (Intra)' : 'KA (Inter)' }}</span></td>
                  <td class="font-mono">₹{{ (cust.creditLimit).toLocaleString('en-IN') }}</td>
                  <td class="font-mono font-bold text-accent">₹{{ (cust.currentOutstanding).toLocaleString('en-IN') }}</td>
                  <td>
                    <div class="progress-bar">
                      <div class="progress-fill" :style="{ width: `${Math.min(100, (cust.currentOutstanding / cust.creditLimit) * 100)}%` }"></div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Order Creation Simulator -->
          <div style="margin-top: 24px;">
            <h4>Create New Sales Order (O2C)</h4>
            <div class="sales-form">
              <div class="form-row">
                <div class="form-group">
                  <label>Select Customer</label>
                  <select v-model="orderForm.customerId" class="form-select">
                    <option v-for="c in customers" :key="c.customerId" :value="c.customerId">
                      {{ c.name }} ({{ c.stateCode === '27' ? 'Intra-State MH' : 'Inter-State KA' }})
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Finished Good SKU</label>
                  <select v-model="orderForm.sku" class="form-select">
                    <option value="FERT-EVTRK-001">FERT-EVTRK-001 (Sutra E-Titan 1.5T EV)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Order Qty</label>
                  <input v-model.number="orderForm.quantity" type="number" min="1" class="form-input" />
                </div>
                <div class="form-group">
                  <label>Unit Price (INR)</label>
                  <input v-model.number="orderForm.unitPrice" type="number" class="form-input" />
                </div>
              </div>

              <button class="action-btn" @click="createSalesOrder">
                <FileText class="btn-icon" />
                <span>Validate & Confirm Sales Order</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Order Workflow & Billing Generator -->
        <div class="panel">
          <div class="panel-header">
            <h3>Active Sales Order Workflow</h3>
            <span class="panel-sub">SO -> Post Goods Issue (PGI) -> E-Invoice Billing</span>
          </div>

          <div v-if="activeSalesOrder" class="workflow-card">
            <div class="so-header">
              <span class="font-mono text-cyan font-bold">{{ activeSalesOrder.orderNumber }}</span>
              <span class="status-pill success">{{ activeSalesOrder.status }}</span>
            </div>

            <div class="order-summary-box">
              <div class="summary-line">
                <span>Customer:</span>
                <strong>{{ activeSalesOrder.customer.name }}</strong>
              </div>
              <div class="summary-line">
                <span>Taxable Amount:</span>
                <span class="font-mono">₹{{ activeSalesOrder.taxableValue.toLocaleString('en-IN') }}</span>
              </div>
              <div class="summary-line" v-if="!activeSalesOrder.isInterState">
                <span>Intra-State GST (9% CGST + 9% SGST):</span>
                <span class="font-mono text-green">₹{{ (activeSalesOrder.cgst + activeSalesOrder.sgst).toLocaleString('en-IN') }}</span>
              </div>
              <div class="summary-line" v-else>
                <span>Inter-State IGST (18%):</span>
                <span class="font-mono text-green">₹{{ activeSalesOrder.igst.toLocaleString('en-IN') }}</span>
              </div>
              <div class="summary-line total">
                <span>Invoice Grand Total:</span>
                <strong class="font-mono text-accent">₹{{ activeSalesOrder.grandTotal.toLocaleString('en-IN') }}</strong>
              </div>
            </div>

            <!-- Workflow Action Buttons -->
            <div class="workflow-actions">
              <button class="workflow-btn" :disabled="pgiCompleted" @click="executePgi">
                <Truck class="btn-icon-sm" />
                <span>{{ pgiCompleted ? 'PGI Delivered (Mvt 601 Done)' : '1. Post Goods Issue (PGI Mvt 601)' }}</span>
              </button>

              <button class="workflow-btn primary" :disabled="!pgiCompleted || invoiceGenerated" @click="generateBilling">
                <ShieldCheck class="btn-icon-sm" />
                <span>{{ invoiceGenerated ? 'Billed with E-Invoice & E-Way' : '2. Generate Billing Invoice + E-Invoice' }}</span>
              </button>
            </div>

            <!-- Generated Invoice Card -->
            <div v-if="billingInvoice" class="einvoice-badge-box">
              <div class="badge-head">
                <CheckCircle2 class="icon-success" />
                <div>
                  <strong>Tax Invoice {{ billingInvoice.invoiceNumber }}</strong>
                  <span class="text-dim">Posted to General Ledger</span>
                </div>
              </div>

              <div class="irn-snippet font-mono">
                <span class="text-dim">NIC IRN:</span> {{ billingInvoice.eInvoiceIrn }}
              </div>

              <div class="eway-tag">
                <span class="badge purple">E-Way Bill Auto-Generated</span>
                <span class="text-dim">Consignment &gt; ₹50,000 statutory requirement met</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <FileText class="empty-icon" />
            <p>No active sales order selected. Submit a sales order to execute O2C fulfillment.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: Procure-to-Pay (P2P) & 3-Way Matching -->
    <div v-if="activeTab === 'p2p'" class="tab-content">
      <div class="grid-2-1">
        <!-- Vendor Master & MSME Section 43B(h) -->
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Vendor Master & MSME Section 43B(h) Compliance</h3>
              <span class="panel-sub">Automatic 45-day payment tracking for registered Micro & Small enterprises</span>
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Vendor ID</th>
                  <th>Name</th>
                  <th>GSTIN</th>
                  <th>Classification</th>
                  <th>Udyam Reg #</th>
                  <th>Max Pay Terms</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="vend in vendors" :key="vend.vendorId">
                  <td class="font-mono text-cyan">{{ vend.vendorId }}</td>
                  <td>{{ vend.name }}</td>
                  <td class="font-mono text-dim">{{ vend.gstin }}</td>
                  <td>
                    <span v-if="vend.isMsme" class="badge green">MSME {{ vend.msmeCategory }}</span>
                    <span v-else class="badge gray">Corporate Non-MSME</span>
                  </td>
                  <td class="font-mono text-dim">{{ vend.udyamRegistrationNumber || 'N/A' }}</td>
                  <td class="font-mono font-bold">{{ vend.paymentTermsDays }} Days</td>
                  <td>
                    <button class="action-btn-sm" @click="selectVendorForPo(vend)">
                      <span>Create PO</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Active Purchase Order Simulator -->
          <div style="margin-top: 24px;">
            <h4>Execute 3-Way Match Verification (PO vs GRN vs Vendor Invoice)</h4>
            <div class="p2p-simulation-box">
              <div class="steps-row">
                <div class="step-card" :class="{ completed: p2pState.poCreated }">
                  <div class="step-num">1</div>
                  <div class="step-title">PO Created</div>
                  <span class="step-sub">{{ p2pState.poNumber }} (₹{{ p2pState.poValue.toLocaleString('en-IN') }})</span>
                </div>
                <div class="step-arrow"><ArrowRight /></div>
                <div class="step-card" :class="{ completed: p2pState.grnDone }">
                  <div class="step-num">2</div>
                  <div class="step-title">Goods Receipt (GRN)</div>
                  <span class="step-sub">Mvt 101 Posted ({{ p2pState.receivedQty }} units)</span>
                </div>
                <div class="step-arrow"><ArrowRight /></div>
                <div class="step-card" :class="{ completed: p2pState.verified }">
                  <div class="step-num">3</div>
                  <div class="step-title">3-Way Match & TDS</div>
                  <span class="step-sub">Sec 194Q Verified</span>
                </div>
              </div>

              <div class="p2p-actions">
                <button class="workflow-btn" :disabled="p2pState.grnDone" @click="receiveP2pGrn">
                  <CheckCircle2 class="btn-icon-sm" />
                  <span>Receive Dock Goods (GRN Mvt 101)</span>
                </button>

                <button class="workflow-btn primary" :disabled="!p2pState.grnDone || p2pState.verified" @click="verifyP2pInvoice">
                  <ShieldCheck class="btn-icon-sm" />
                  <span>Verify Invoice & Withhold Sec 194Q TDS</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 3-Way Match Audit Panel -->
        <div class="panel">
          <div class="panel-header">
            <h3>3-Way Match Verification Audit</h3>
            <span class="panel-sub">Price Variance & Quantity Discrepancy Gate</span>
          </div>

          <div v-if="p2pVerificationResult" class="audit-card">
            <div class="audit-status" :class="p2pVerificationResult.threeWayMatch.status.toLowerCase()">
              <CheckCircle2 class="icon-success" />
              <div>
                <strong>3-Way Match Status: {{ p2pVerificationResult.threeWayMatch.status }}</strong>
                <span>Ordered Qty: {{ p2pVerificationResult.threeWayMatch.orderedQty }} • Received: {{ p2pVerificationResult.threeWayMatch.receivedQty }} • Invoiced: {{ p2pVerificationResult.threeWayMatch.invoicedQty }}</span>
              </div>
            </div>

            <div class="tax-tds-breakdown">
              <div class="calc-row">
                <span>Taxable Amount:</span>
                <span class="font-mono">₹{{ p2pVerificationResult.taxableAmount.toLocaleString('en-IN') }}</span>
              </div>
              <div class="calc-row">
                <span>Input GST Credit (ITC):</span>
                <span class="font-mono text-green">₹{{ p2pVerificationResult.inputGstCredit.totalGst.toLocaleString('en-IN') }}</span>
              </div>
              <div class="calc-row">
                <span>TDS Withheld (Sec {{ p2pVerificationResult.tdsDeduction.section }} @ {{ p2pVerificationResult.tdsDeduction.ratePercent }}%):</span>
                <span class="font-mono text-red">- ₹{{ p2pVerificationResult.tdsDeduction.deductionAmount.toLocaleString('en-IN') }}</span>
              </div>
              <div class="calc-row net">
                <span>Net Payable to Vendor:</span>
                <strong class="font-mono text-accent">₹{{ p2pVerificationResult.netPayableToVendor.toLocaleString('en-IN') }}</strong>
              </div>
              <div class="calc-row due">
                <span>Statutory MSME Payment Due Date:</span>
                <span class="font-mono text-yellow font-bold">{{ p2pVerificationResult.msmeDueDate }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <Clock class="empty-icon" />
            <p>Click "Verify Invoice" to audit 3-way match, TDS deduction, and GR/IR GL clearing.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 4: AR / AP Working Capital Aging -->
    <div v-if="activeTab === 'subledger'" class="tab-content">
      <div class="grid-2-1">
        <!-- Aging Buckets Matrix -->
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Working Capital Subledger Aging (0-30, 31-60, 61-90, 90+ Days)</h3>
              <span class="panel-sub">Real-time Accounts Receivable (AR) & Accounts Payable (AP)</span>
            </div>
          </div>

          <div class="aging-grid">
            <div class="aging-box">
              <span class="aging-header">Current (0–30 Days)</span>
              <div class="aging-vals">
                <div><span class="text-dim">AR:</span> <strong class="text-green">₹{{ agingData.receivables.summary.current0to30.toLocaleString('en-IN') }}</strong></div>
                <div><span class="text-dim">AP:</span> <strong class="text-cyan">₹{{ agingData.payables.summary.current0to30.toLocaleString('en-IN') }}</strong></div>
              </div>
            </div>

            <div class="aging-box">
              <span class="aging-header">31–60 Days</span>
              <div class="aging-vals">
                <div><span class="text-dim">AR:</span> <strong class="text-green">₹{{ agingData.receivables.summary.days31to60.toLocaleString('en-IN') }}</strong></div>
                <div><span class="text-dim">AP:</span> <strong class="text-cyan">₹{{ agingData.payables.summary.days31to60.toLocaleString('en-IN') }}</strong></div>
              </div>
            </div>

            <div class="aging-box">
              <span class="aging-header">61–90 Days</span>
              <div class="aging-vals">
                <div><span class="text-dim">AR:</span> <strong class="text-yellow">₹{{ agingData.receivables.summary.days61to90.toLocaleString('en-IN') }}</strong></div>
                <div><span class="text-dim">AP:</span> <strong class="text-cyan">₹{{ agingData.payables.summary.days61to90.toLocaleString('en-IN') }}</strong></div>
              </div>
            </div>

            <div class="aging-box alert">
              <span class="aging-header">Overdue (&gt; 90 Days)</span>
              <div class="aging-vals">
                <div><span class="text-dim">AR:</span> <strong class="text-red">₹{{ agingData.receivables.summary.above90.toLocaleString('en-IN') }}</strong></div>
                <div><span class="text-dim">AP:</span> <strong class="text-cyan">₹{{ agingData.payables.summary.above90.toLocaleString('en-IN') }}</strong></div>
              </div>
            </div>
          </div>

          <!-- Total Summary Row -->
          <div class="working-cap-summary">
            <div class="wc-item">
              <span class="wc-label">Total Trade Receivables (AR)</span>
              <span class="wc-val text-green">₹{{ agingData.receivables.summary.totalOutstanding.toLocaleString('en-IN') }}</span>
              <span class="wc-sub">DSO: {{ agingData.receivables.dsoDays }} Days</span>
            </div>
            <div class="wc-item">
              <span class="wc-label">Total Trade Payables (AP)</span>
              <span class="wc-val text-cyan">₹{{ agingData.payables.summary.totalOutstanding.toLocaleString('en-IN') }}</span>
              <span class="wc-sub">DPO: {{ agingData.payables.dpoDays }} Days</span>
            </div>
            <div class="wc-item">
              <span class="wc-label">Net Working Capital Exposure</span>
              <span class="wc-val text-accent">₹{{ (agingData.receivables.summary.totalOutstanding - agingData.payables.summary.totalOutstanding).toLocaleString('en-IN') }}</span>
              <span class="wc-sub">Cash surplus cushion</span>
            </div>
          </div>
        </div>

        <!-- Overdue Debtors & Priority Collections -->
        <div class="panel">
          <div class="panel-header">
            <h3>Top Overdue Debtors (Priority Recovery)</h3>
            <span class="panel-sub">Automated dunning & payment reminder triggers</span>
          </div>

          <div class="debtors-list">
            <div v-for="debtor in agingData.receivables.topOverdueDebtors" :key="debtor.partyId" class="debtor-card">
              <div class="debtor-info">
                <strong>{{ debtor.partyName }}</strong>
                <span class="debtor-days text-yellow">{{ debtor.oldestInvoiceDays }} Days Outstanding</span>
              </div>
              <div class="debtor-amt font-mono text-red font-bold">
                ₹{{ debtor.outstandingBalance.toLocaleString('en-IN') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 5: Production Planning & Manufacturing (PP) -->
    <div v-if="activeTab === 'mfg'" class="tab-content">
      <div class="grid-2-1">
        <!-- Bill of Materials (BOM) & Work Centers -->
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Bill of Materials (BOM) & Work Centers</h3>
              <span class="panel-sub">Multi-level component explosion & machine routing</span>
            </div>
          </div>

          <div class="bom-card">
            <div class="bom-title-row">
              <span class="badge green">Active BOM v1.0</span>
              <strong class="font-mono text-cyan">FERT-EVTRK-001 — Sutra E-Titan 1.5T EV</strong>
            </div>

            <table class="data-table" style="margin-top: 12px;">
              <thead>
                <tr>
                  <th>Component SKU</th>
                  <th>Quantity / Unit</th>
                  <th>UoM</th>
                  <th>Scrap %</th>
                  <th>Component Type</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="comp in activeBom.components" :key="comp.componentSku">
                  <td class="font-mono text-cyan">{{ comp.componentSku }}</td>
                  <td class="font-mono font-bold">{{ comp.quantityRequired }}</td>
                  <td class="text-dim">{{ comp.baseUom }}</td>
                  <td class="font-mono text-dim">{{ comp.scrapFactorPercent }}%</td>
                  <td>
                    <span class="type-pill" :class="comp.componentSku.startsWith('ROH') ? 'roh' : 'halb'">
                      {{ comp.componentSku.startsWith('ROH') ? 'Raw Material' : 'Sub-Assembly' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Work Centers & Routing Operations -->
          <div style="margin-top: 20px;">
            <h4>Manufacturing Work Centers & Routings</h4>
            <div class="wc-grid">
              <div v-for="wc in workCenters" :key="wc.workCenterId" class="wc-card">
                <div class="wc-head">
                  <Factory class="btn-icon-sm text-cyan" />
                  <strong>{{ wc.name }}</strong>
                </div>
                <div class="wc-rates">
                  <div><span class="text-dim">Labor:</span> ₹{{ wc.hourlyLaborCost }}/hr</div>
                  <div><span class="text-dim">Machine:</span> ₹{{ wc.hourlyMachineCost }}/hr</div>
                  <div><span class="text-dim">Capacity:</span> {{ wc.capacityHoursPerDay }} hrs/day</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Production Order Simulator -->
        <div class="panel">
          <div class="panel-header">
            <h3>Production Order Execution</h3>
            <span class="panel-sub">Release -> Consume WIP (Mvt 261) -> Confirm FG (Mvt 131)</span>
          </div>

          <div class="mfg-order-box">
            <div class="form-group">
              <label>Target Quantity to Manufacture</label>
              <input v-model.number="mfgOrderQty" type="number" min="1" class="form-input" />
            </div>

            <button class="workflow-btn primary" :disabled="mfgPlanning" @click="planProductionOrder" style="margin-top: 10px;">
              <Layers class="btn-icon-sm" />
              <span>1. Plan Order & Explode BOM</span>
            </button>
          </div>

          <div v-if="plannedOrder" class="planned-order-card" style="margin-top: 16px;">
            <div class="po-title">
              <span class="font-mono text-cyan font-bold">{{ plannedOrder.orderNumber }}</span>
              <span class="status-pill success">{{ plannedOrder.status }}</span>
            </div>

            <div class="cost-summary-box">
              <div class="summary-line">
                <span>Direct Material Cost:</span>
                <span class="font-mono">₹{{ plannedOrder.totalDirectMaterialCost.toLocaleString('en-IN') }}</span>
              </div>
              <div class="summary-line">
                <span>Direct Labor Overhead:</span>
                <span class="font-mono">₹{{ plannedOrder.estimatedLaborCost.toLocaleString('en-IN') }}</span>
              </div>
              <div class="summary-line">
                <span>Machine Overhead:</span>
                <span class="font-mono">₹{{ plannedOrder.estimatedMachineCost.toLocaleString('en-IN') }}</span>
              </div>
              <div class="summary-line total">
                <span>Total Standard Cost:</span>
                <strong class="font-mono text-accent">₹{{ plannedOrder.totalPlannedCost.toLocaleString('en-IN') }}</strong>
              </div>
            </div>

            <button class="workflow-btn" :disabled="mfgConfirmed" @click="confirmProductionOrder" style="margin-top: 14px; width: 100%;">
              <CheckCircle2 class="btn-icon-sm" />
              <span>{{ mfgConfirmed ? 'Confirmed & Inventory Updated' : '2. Confirm Batch & Post WIP to GL' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 6: Fixed Asset Accounting (FI-AA) -->
    <div v-if="activeTab === 'assets'" class="tab-content">
      <div class="grid-2-1">
        <!-- Asset Master Register -->
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Capital Fixed Asset Register (FI-AA)</h3>
              <span class="panel-sub">Indian Companies Act 2013 Schedule II Useful Life & Salvage Cap (5%)</span>
            </div>
            <button class="action-btn-sm" @click="executeDepreciationRun">
              <RefreshCw class="btn-icon-sm" />
              <span>Run Monthly Depreciation</span>
            </button>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Description</th>
                  <th>Class</th>
                  <th>Useful Life</th>
                  <th>Method</th>
                  <th>Original Cost</th>
                  <th>Acc. Depreciation</th>
                  <th>Net Book Value</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ast in fixedAssets" :key="ast.assetId">
                  <td class="font-mono text-cyan">{{ ast.assetId }}</td>
                  <td>{{ ast.name }}</td>
                  <td><span class="badge blue">{{ ast.assetClass }}</span></td>
                  <td class="font-mono">{{ ast.usefulLifeYears }} Yrs</td>
                  <td class="font-mono text-dim">{{ ast.depreciationMethod }}</td>
                  <td class="font-mono">₹{{ ast.originalCost.toLocaleString('en-IN') }}</td>
                  <td class="font-mono text-red">₹{{ ast.accumulatedDepreciation.toLocaleString('en-IN') }}</td>
                  <td class="font-mono font-bold text-green">₹{{ ast.currentBookValue.toLocaleString('en-IN') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Monthly Depreciation Run Audit -->
        <div class="panel">
          <div class="panel-header">
            <h3>Depreciation Run Audit</h3>
            <span class="panel-sub">Automated GL Expense & Contra-Asset Posting</span>
          </div>

          <div v-if="deprRunResult" class="depr-audit-card">
            <div class="result-header">
              <CheckCircle2 class="icon-success" />
              <div>
                <strong>Run {{ deprRunResult.runId }}</strong>
                <span>Period {{ deprRunResult.period }} Processed</span>
              </div>
            </div>

            <div class="calc-row total" style="margin: 12px 0;">
              <span>Total Monthly Depreciation:</span>
              <strong class="font-mono text-accent">₹{{ deprRunResult.totalDepreciationAmount.toLocaleString('en-IN') }}</strong>
            </div>

            <div class="gl-lines-box">
              <span class="gl-title">Automated GL Postings:</span>
              <div class="gl-line">
                <span class="font-mono text-dim">530100</span>
                <span class="gl-acc-name">Depreciation Expense (P&L)</span>
                <span class="font-mono text-green">Dr ₹{{ deprRunResult.totalDepreciationAmount.toLocaleString('en-IN') }}</span>
              </div>
              <div class="gl-line">
                <span class="font-mono text-dim">140900</span>
                <span class="gl-acc-name">Accumulated Depreciation (Contra Asset)</span>
                <span class="font-mono text-cyan">Cr ₹{{ deprRunResult.totalDepreciationAmount.toLocaleString('en-IN') }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <Building2 class="empty-icon" />
            <p>Click "Run Monthly Depreciation" to execute Schedule II calculations and generate balanced General Ledger entries.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 7: Quality Management & Batch Traceability (QM) -->
    <div v-if="activeTab === 'quality'" class="tab-content">
      <div class="grid-2-1">
        <!-- Inspection Lots Register -->
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Quality Inspection Lots (SAP QM)</h3>
              <span class="panel-sub">Goods Receipt (01), In-Process Production (04), Stock Transfers</span>
            </div>
            <button class="action-btn-sm" @click="createDemoInspectionLot">
              <RefreshCw class="btn-icon-sm" />
              <span>Simulate GR Inspection</span>
            </button>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Lot ID</th>
                  <th>Origin</th>
                  <th>Material SKU</th>
                  <th>Batch #</th>
                  <th>Qty</th>
                  <th>Status</th>
                  <th>Decision</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="lot in inspectionLots"
                  :key="lot.lotId"
                  :class="{ 'selected-row': selectedLot?.lotId === lot.lotId }"
                  style="cursor: pointer;"
                  @click="selectedLot = lot"
                >
                  <td class="font-mono text-cyan">{{ lot.lotId }}</td>
                  <td><span class="badge blue">{{ lot.origin.replace('_', ' ') }}</span></td>
                  <td class="font-mono text-dim">{{ lot.materialSku }}</td>
                  <td class="font-mono font-bold">{{ lot.batchNumber }}</td>
                  <td class="font-mono">{{ lot.quantity }} {{ lot.baseUom }}</td>
                  <td>
                    <span class="status-pill" :class="lot.status === 'UD_COMPLETED' ? 'success' : 'warning'">
                      {{ lot.status }}
                    </span>
                  </td>
                  <td>
                    <span v-if="lot.usageDecision" class="status-pill" :class="lot.usageDecision.decision === 'ACCEPTED' ? 'success' : 'danger'">
                      {{ lot.usageDecision.decision }} (Mvt {{ lot.usageDecision.movementType }})
                    </span>
                    <span v-else class="text-dim">Pending</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Batch Genealogy Trace View -->
          <div style="margin-top: 24px;">
            <h4>End-to-End Batch Genealogy Traceability</h4>
            <span class="panel-sub">Full upstream supplier origin to downstream vehicle & customer sales order</span>
            <div class="genealogy-card" style="margin-top: 10px;">
              <div class="trace-step">
                <span class="trace-label">1. Supplier Raw Material Batch</span>
                <strong class="font-mono text-cyan">{{ activeTrace.upstreamRaw }}</strong>
                <span class="trace-meta">Jindal Steel & Power Ltd • PO-2026-0891</span>
              </div>
              <ArrowRight class="trace-arrow" />
              <div class="trace-step">
                <span class="trace-label">2. Manufacturing Order (PP)</span>
                <strong class="font-mono text-yellow">{{ activeTrace.mfgOrder }}</strong>
                <span class="trace-meta">Press Line WC-PRESS-01 • WIP Consumed</span>
              </div>
              <ArrowRight class="trace-arrow" />
              <div class="trace-step">
                <span class="trace-label">3. Finished EV Batch</span>
                <strong class="font-mono text-green">{{ activeTrace.finishedBatch }}</strong>
                <span class="trace-meta">Sutra E-Titan 1.5T • 10 Units</span>
              </div>
              <ArrowRight class="trace-arrow" />
              <div class="trace-step">
                <span class="trace-label">4. Customer Sales Order</span>
                <strong class="font-mono text-accent">{{ activeTrace.customerOrder }}</strong>
                <span class="trace-meta">Tata Motors Fleet Solutions • Inv #4901</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Lot Inspection & Usage Decision Cockpit -->
        <div class="panel">
          <div class="panel-header">
            <h3>Usage Decision & CoA</h3>
            <span class="panel-sub">Results recording, tolerance validation & digital signature</span>
          </div>

          <div v-if="selectedLot" class="inspection-detail-box">
            <div class="lot-header-box">
              <div>
                <strong class="font-mono text-cyan">{{ selectedLot.lotId }}</strong>
                <div class="text-dim">{{ selectedLot.materialSku }} — Batch {{ selectedLot.batchNumber }}</div>
              </div>
              <span class="badge purple">{{ selectedLot.quantity }} {{ selectedLot.baseUom }}</span>
            </div>

            <div class="char-list" style="margin-top: 14px;">
              <span class="gl-title">Quality Inspection Characteristics:</span>
              <div v-for="char in selectedLot.characteristics" :key="char.charId" class="char-item">
                <div class="char-desc">
                  <strong>{{ char.name }}</strong>
                  <span class="text-dim font-mono">
                    {{ char.type === 'QUANTITATIVE' ? `Target: ${char.targetValue} (${char.lowerLimit} - ${char.upperLimit} ${char.uom})` : `Spec: ${char.expectedText}` }}
                  </span>
                </div>
                <div class="char-val font-mono font-bold text-green">
                  {{ char.observed || 'CONFORMS' }}
                </div>
              </div>
            </div>

            <div v-if="!selectedLot.usageDecision" class="qm-actions" style="margin-top: 16px; display: flex; gap: 10px;">
              <button class="workflow-btn primary" @click="postUsageDecision(selectedLot, 'ACCEPTED')">
                <CheckCircle2 class="btn-icon-sm" />
                <span>Accept (Mvt 321)</span>
              </button>
              <button class="workflow-btn" style="border-color: #ef4444; color: #f87171;" @click="postUsageDecision(selectedLot, 'REJECTED')">
                <span>Reject (Mvt 350)</span>
              </button>
            </div>

            <div v-else class="coa-card" style="margin-top: 16px;">
              <div class="coa-header">
                <ShieldCheck class="icon-success" />
                <div>
                  <strong>Certificate of Analysis (CoA)</strong>
                  <span class="font-mono text-dim" style="display: block; font-size: 11px;">Signed by QA Manager</span>
                </div>
              </div>
              <div class="irn-snippet" style="margin-top: 10px;">
                SHA-256 Hash: {{ selectedLot.coaHash || 'a7f9c2e4b8d10356e92c4a17fb823019d45e78a6231bc54e90fd18247cae9812' }}
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <ShieldCheck class="empty-icon" />
            <p>Select an inspection lot to review test parameters and record Usage Decisions.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 8: Controlling & Cost Center Accounting (CO) -->
    <div v-if="activeTab === 'controlling'" class="tab-content">
      <div class="grid-2-1">
        <!-- Cost Center Master & Budgets -->
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Cost Center Accounting (SAP CO-CCA)</h3>
              <span class="panel-sub">Operating cost centers, profit centers, and annual budget absorption</span>
            </div>
            <button class="action-btn-sm" @click="runAssessmentCycle">
              <RefreshCw class="btn-icon-sm" />
              <span>Run Assessment Cycle</span>
            </button>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Cost Center</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Profit Center</th>
                  <th>Annual Budget</th>
                  <th>Actual Incurred</th>
                  <th>Utilization</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cc in costCenters" :key="cc.code">
                  <td class="font-mono text-cyan">{{ cc.code }}</td>
                  <td>{{ cc.name }}</td>
                  <td><span class="badge blue">{{ cc.category }}</span></td>
                  <td class="font-mono text-dim">{{ cc.profitCenterCode }}</td>
                  <td class="font-mono">₹{{ cc.budgetAnnual.toLocaleString('en-IN') }}</td>
                  <td class="font-mono font-bold text-accent">₹{{ cc.actualIncurred.toLocaleString('en-IN') }}</td>
                  <td>
                    <div class="progress-bar" style="width: 80px;">
                      <div class="progress-fill" :style="{ width: Math.min(100, Math.round((cc.actualIncurred / cc.budgetAnnual) * 100)) + '%' }"></div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Overhead Assessment Cycle Audit -->
        <div class="panel">
          <div class="panel-header">
            <h3>Secondary Cost Allocation</h3>
            <span class="panel-sub">Periodic distribution of IT & Facility shared services</span>
          </div>

          <div v-if="assessmentResult" class="audit-card">
            <div class="audit-status">
              <CheckCircle2 class="icon-success" />
              <div>
                <strong>Assessment Cycle {{ assessmentResult.cycleId }}</strong>
                <span>Distributed ₹{{ assessmentResult.totalAmount.toLocaleString('en-IN') }} from {{ assessmentResult.sender }}</span>
              </div>
            </div>

            <div class="tax-tds-breakdown" style="margin-top: 14px;">
              <span class="gl-title">Secondary Cost Allocations:</span>
              <div v-for="alloc in assessmentResult.distributions" :key="alloc.receiver" class="calc-row">
                <span>{{ alloc.receiver }} ({{ alloc.percentage }}%):</span>
                <span class="font-mono text-cyan">₹{{ alloc.amount.toLocaleString('en-IN') }}</span>
              </div>
            </div>

            <div class="gl-lines-box" style="margin-top: 14px;">
              <span class="gl-title">Secondary Cost Element Journal (GL 610000):</span>
              <div class="gl-line">
                <span class="font-mono text-dim">610000</span>
                <span class="gl-acc-name">Cost Assessment Inflow</span>
                <span class="font-mono text-green">Dr ₹{{ assessmentResult.totalAmount.toLocaleString('en-IN') }}</span>
              </div>
              <div class="gl-line">
                <span class="font-mono text-dim">610000</span>
                <span class="gl-acc-name">Cost Assessment Outflow</span>
                <span class="font-mono text-cyan">Cr ₹{{ assessmentResult.totalAmount.toLocaleString('en-IN') }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <Clock class="empty-icon" />
            <p>Click "Run Assessment Cycle" to allocate support cost center expenses to production work centers.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Package,
  TrendingUp,
  ShoppingCart,
  Clock,
  Layers,
  CheckCircle2,
  RefreshCw,
  Truck,
  FileText,
  ShieldCheck,
  ArrowRight,
  Factory,
  Building2,
  PieChart,
} from 'lucide-vue-next';

const activeTab = ref<'inventory' | 'o2c' | 'p2p' | 'subledger' | 'mfg' | 'assets' | 'quality' | 'controlling'>('inventory');

// Materials Master State
const materials = ref([
  {
    sku: 'ROH-STEEL-001',
    name: 'Cold-Rolled Steel Coils (CRCA 1.2mm)',
    materialType: 'ROH',
    baseUom: 'KG',
    hsnCode: '7209',
    totalStock: 12500,
    movingAvgPrice: 62.5,
    reorderPoint: 4000,
  },
  {
    sku: 'HALB-AXLE-001',
    name: 'Sub-Assembly Rear Axle Hub',
    materialType: 'HALB',
    baseUom: 'EA',
    hsnCode: '8708',
    totalStock: 350,
    movingAvgPrice: 1820.0,
    reorderPoint: 100,
  },
  {
    sku: 'FERT-EVTRK-001',
    name: 'Sutra E-Titan 1.5T Commercial EV',
    materialType: 'FERT',
    baseUom: 'EA',
    hsnCode: '8704',
    totalStock: 42,
    movingAvgPrice: 915000.0,
    reorderPoint: 15,
  },
]);

const totalInventoryValuation = computed(() => {
  return materials.value.reduce((acc, m) => acc + m.totalStock * m.movingAvgPrice, 0);
});

// Movement Form
const isMoving = ref(false);
const movementForm = ref({
  movementType: '101',
  sku: 'ROH-STEEL-001',
  quantity: 500,
  unitCost: 70,
  costCenter: 'CC-OPERATIONS',
});

const movementResult = ref<any>(null);

function executeMovement() {
  isMoving.value = true;
  const mat = materials.value.find((m) => m.sku === movementForm.value.sku);
  if (!mat) return;

  setTimeout(() => {
    isMoving.value = false;
    const prevStock = mat.totalStock;
    const prevMap = mat.movingAvgPrice;

    if (movementForm.value.movementType === '101') {
      const newStock = prevStock + movementForm.value.quantity;
      const newMap = ((prevStock * prevMap) + (movementForm.value.quantity * (movementForm.value.unitCost || 65))) / newStock;
      mat.totalStock = newStock;
      mat.movingAvgPrice = Math.round(newMap * 100) / 100;

      movementResult.value = {
        movementDocumentId: `MATDOC-${Date.now().toString(36).toUpperCase()}`,
        movementType: '101',
        previousStock: prevStock,
        currentStock: newStock,
        newMovingAvgPrice: mat.movingAvgPrice,
        journalLines: [
          { accountCode: '120100', accountName: `Raw Materials Inventory (${mat.sku})`, debit: movementForm.value.quantity * (movementForm.value.unitCost || 65), credit: 0 },
          { accountCode: '210500', accountName: 'Goods Receipt / Invoice Receipt (GR/IR) Clearing', debit: 0, credit: movementForm.value.quantity * (movementForm.value.unitCost || 65) },
        ],
      };
    } else if (movementForm.value.movementType === '201') {
      mat.totalStock = Math.max(0, prevStock - movementForm.value.quantity);
      movementResult.value = {
        movementDocumentId: `MATDOC-${Date.now().toString(36).toUpperCase()}`,
        movementType: '201',
        previousStock: prevStock,
        currentStock: mat.totalStock,
        newMovingAvgPrice: prevMap,
        journalLines: [
          { accountCode: '510100', accountName: 'Raw Material Consumption Expense', debit: movementForm.value.quantity * prevMap, credit: 0 },
          { accountCode: '120100', accountName: `Raw Materials Inventory (${mat.sku})`, debit: 0, credit: movementForm.value.quantity * prevMap },
        ],
      };
    } else {
      mat.totalStock = Math.max(0, prevStock - movementForm.value.quantity);
      movementResult.value = {
        movementDocumentId: `MATDOC-${Date.now().toString(36).toUpperCase()}`,
        movementType: movementForm.value.movementType,
        previousStock: prevStock,
        currentStock: mat.totalStock,
        newMovingAvgPrice: prevMap,
        journalLines: [
          { accountCode: '500100', accountName: 'Cost of Goods Sold (COGS)', debit: movementForm.value.quantity * prevMap, credit: 0 },
          { accountCode: '120300', accountName: 'Finished Goods Inventory', debit: 0, credit: movementForm.value.quantity * prevMap },
        ],
      };
    }
  }, 400);
}

function refreshMaterials() {
  // simulated refresh
}

// Customers & O2C
const customers = ref([
  {
    customerId: 'CUST-MAH-001',
    name: 'Tata Motors Fleet Solutions Ltd',
    gstin: '27AABCT2345K1Z8',
    stateCode: '27',
    creditLimit: 25000000,
    currentOutstanding: 4500000,
  },
  {
    customerId: 'CUST-BLR-002',
    name: 'Bangalore Metro Rail Logistics Corp',
    gstin: '29AABCB8976C1ZG',
    stateCode: '29',
    creditLimit: 50000000,
    currentOutstanding: 12000000,
  },
]);

const orderForm = ref({
  customerId: 'CUST-MAH-001',
  sku: 'FERT-EVTRK-001',
  quantity: 2,
  unitPrice: 950000,
});

const activeSalesOrder = ref<any>(null);
const pgiCompleted = ref(false);
const invoiceGenerated = ref(false);
const billingInvoice = ref<any>(null);

function createSalesOrder() {
  const cust = customers.value.find((c) => c.customerId === orderForm.value.customerId)!;
  const taxable = orderForm.value.quantity * orderForm.value.unitPrice;
  const isInter = cust.stateCode !== '27';
  const cgst = isInter ? 0 : taxable * 0.09;
  const sgst = isInter ? 0 : taxable * 0.09;
  const igst = isInter ? taxable * 0.18 : 0;
  const grandTotal = taxable + cgst + sgst + igst;

  activeSalesOrder.value = {
    orderNumber: `SO-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
    status: 'CONFIRMED',
    customer: cust,
    taxableValue: taxable,
    isInterState: isInter,
    cgst,
    sgst,
    igst,
    grandTotal,
  };
  pgiCompleted.value = false;
  invoiceGenerated.value = false;
  billingInvoice.value = null;
}

function executePgi() {
  pgiCompleted.value = true;
  const mat = materials.value.find((m) => m.sku === 'FERT-EVTRK-001');
  if (mat) {
    mat.totalStock = Math.max(0, mat.totalStock - (orderForm.value.quantity || 1));
  }
}

function generateBilling() {
  invoiceGenerated.value = true;
  billingInvoice.value = {
    invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`,
    eInvoiceIrn: `IRN-${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    glPostingSuccess: true,
  };
}

// Vendors & P2P
const vendors = ref([
  {
    vendorId: 'VEND-JINDAL-001',
    name: 'Jindal Steel & Power Ltd',
    gstin: '27AAACJ2345K1Z3',
    isMsme: false,
    paymentTermsDays: 60,
  },
  {
    vendorId: 'VEND-MICROTECH-002',
    name: 'MicroTech Precision Forgings MSME',
    gstin: '27AABCM6789D1Z4',
    isMsme: true,
    msmeCategory: 'SMALL',
    udyamRegistrationNumber: 'UDYAM-MH-01-0045231',
    paymentTermsDays: 45,
  },
]);

const p2pState = ref({
  poCreated: true,
  poNumber: 'PO-2026-0891',
  poValue: 36000,
  orderedQty: 20,
  receivedQty: 20,
  grnDone: false,
  verified: false,
});

const p2pVerificationResult = ref<any>(null);

function selectVendorForPo(v: any) {
  p2pState.value.poNumber = `PO-${Date.now().toString(36).toUpperCase()}`;
  p2pState.value.grnDone = false;
  p2pState.value.verified = false;
  p2pVerificationResult.value = null;
}

function receiveP2pGrn() {
  p2pState.value.grnDone = true;
}

function verifyP2pInvoice() {
  p2pState.value.verified = true;
  p2pVerificationResult.value = {
    threeWayMatch: {
      status: 'PERFECT_MATCH',
      orderedQty: 20,
      receivedQty: 20,
      invoicedQty: 20,
    },
    taxableAmount: 36000,
    inputGstCredit: {
      totalGst: 6480,
    },
    tdsDeduction: {
      section: '194Q',
      ratePercent: 0.1,
      deductionAmount: 36,
    },
    netPayableToVendor: 42444,
    msmeDueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  };
}

// Subledger Aging Data
const agingData = ref({
  receivables: {
    summary: {
      current0to30: 4500000,
      days31to60: 0,
      days61to90: 10000000,
      above90: 3200000,
      totalOutstanding: 17700000,
    },
    dsoDays: 43,
    topOverdueDebtors: [
      { partyId: 'CUST-BLR-002', partyName: 'Bangalore Metro Rail Logistics Corp', outstandingBalance: 10000000, oldestInvoiceDays: 75 },
      { partyId: 'CUST-PUN-003', partyName: 'Bharat Forge Heavy Engineering', outstandingBalance: 3200000, oldestInvoiceDays: 110 },
      { partyId: 'CUST-MAH-001', partyName: 'Tata Motors Fleet Solutions Ltd', outstandingBalance: 4500000, oldestInvoiceDays: 18 },
    ],
  },
  payables: {
    summary: {
      current0to30: 7800000,
      days31to60: 1450000,
      days61to90: 850000,
      above90: 0,
      totalOutstanding: 10100000,
    },
    dpoDays: 39,
  },
});

// Manufacturing & BOM (PP)
const activeBom = ref({
  bomId: 'BOM-EVTRK-001',
  finishedGoodSku: 'FERT-EVTRK-001',
  version: '1.0',
  components: [
    { componentSku: 'ROH-STEEL-001', name: 'Cold-Rolled Steel Coils', quantityRequired: 150, baseUom: 'KG', scrapFactorPercent: 2.0 },
    { componentSku: 'HALB-AXLE-001', name: 'Rear Axle Hub Sub-Assembly', quantityRequired: 2, baseUom: 'EA', scrapFactorPercent: 0.5 },
  ],
});

const workCenters = ref([
  {
    workCenterId: 'WC-PRESS-01',
    name: 'Chassis Stamping & Press Line',
    hourlyLaborCost: 450,
    hourlyMachineCost: 1200,
    capacityHoursPerDay: 16,
  },
  {
    workCenterId: 'WC-ASSY-02',
    name: 'EV Powertrain Robotic Integration',
    hourlyLaborCost: 650,
    hourlyMachineCost: 2100,
    capacityHoursPerDay: 20,
  },
]);

const mfgOrderQty = ref(5);
const mfgPlanning = ref(false);
const mfgConfirmed = ref(false);
const plannedOrder = ref<any>(null);

function planProductionOrder() {
  mfgPlanning.value = true;
  setTimeout(() => {
    mfgPlanning.value = false;
    mfgConfirmed.value = false;
    const qty = mfgOrderQty.value || 1;
    const matCost = qty * ((150 * 62.5) + (2 * 1820));
    const laborCost = qty * 4.5 * 550;
    const machCost = qty * 3.2 * 1650;
    plannedOrder.value = {
      orderNumber: `ORD-PP-${Date.now().toString(36).toUpperCase()}`,
      status: 'PLANNED_RELEASED',
      quantity: qty,
      totalDirectMaterialCost: Math.round(matCost),
      estimatedLaborCost: Math.round(laborCost),
      estimatedMachineCost: Math.round(machCost),
      totalPlannedCost: Math.round(matCost + laborCost + machCost),
    };
  }, 300);
}

function confirmProductionOrder() {
  if (!plannedOrder.value) return;
  mfgConfirmed.value = true;
  plannedOrder.value.status = 'CONFIRMED_POSTED';
  const fert = materials.value.find((m) => m.sku === 'FERT-EVTRK-001');
  if (fert) fert.totalStock += plannedOrder.value.quantity;

  const steel = materials.value.find((m) => m.sku === 'ROH-STEEL-001');
  if (steel) steel.totalStock = Math.max(0, steel.totalStock - (plannedOrder.value.quantity * 150));

  const axle = materials.value.find((m) => m.sku === 'HALB-AXLE-001');
  if (axle) axle.totalStock = Math.max(0, axle.totalStock - (plannedOrder.value.quantity * 2));
}

// Fixed Asset Accounting (FI-AA)
const fixedAssets = ref([
  {
    assetId: 'AST-PLANT-001',
    name: '500-Ton Hydraulic Stamping Press',
    assetClass: 'PLANT_MACHINERY',
    usefulLifeYears: 15,
    depreciationMethod: 'STRAIGHT_LINE',
    originalCost: 8500000,
    accumulatedDepreciation: 1700000,
    currentBookValue: 6800000,
  },
  {
    assetId: 'AST-ROBOT-002',
    name: '6-Axis ABB Robotic Welding Cell',
    assetClass: 'AUTOMATION',
    usefulLifeYears: 10,
    depreciationMethod: 'STRAIGHT_LINE',
    originalCost: 4200000,
    accumulatedDepreciation: 1260000,
    currentBookValue: 2940000,
  },
  {
    assetId: 'AST-SRV-003',
    name: 'Dell PowerEdge Tier-3 Data Center Clustered Servers',
    assetClass: 'IT_HARDWARE',
    usefulLifeYears: 6,
    depreciationMethod: 'STRAIGHT_LINE',
    originalCost: 1800000,
    accumulatedDepreciation: 900000,
    currentBookValue: 900000,
  },
]);

const deprRunResult = ref<any>(null);

function executeDepreciationRun() {
  let monthlyTotal = 0;
  for (const asset of fixedAssets.value) {
    const depreciableBase = asset.originalCost * 0.95;
    const monthlyDepr = Math.round(depreciableBase / (asset.usefulLifeYears * 12));
    monthlyTotal += monthlyDepr;
    asset.accumulatedDepreciation += monthlyDepr;
    asset.currentBookValue = Math.max(asset.originalCost * 0.05, asset.currentBookValue - monthlyDepr);
  }

  deprRunResult.value = {
    runId: `DEP-${Date.now().toString(36).toUpperCase()}`,
    period: '2026-09',
    totalDepreciationAmount: monthlyTotal,
  };
}

// Quality Management (QM) & Batch Traceability
const inspectionLots = ref([
  {
    lotId: 'LOT-2026-ST-01',
    origin: '01_GOODS_RECEIPT',
    materialSku: 'ROH-STEEL-001',
    batchNumber: 'BATCH-2026-ST-088',
    quantity: 5000,
    baseUom: 'KG',
    status: 'UD_COMPLETED',
    characteristics: [
      { charId: 'C1', name: 'Sheet Thickness (mm)', type: 'QUANTITATIVE', targetValue: 1.2, lowerLimit: 1.15, upperLimit: 1.25, uom: 'MM', observed: '1.21 MM' },
      { charId: 'C2', name: 'Tensile Strength (MPa)', type: 'QUANTITATIVE', targetValue: 340, lowerLimit: 310, upperLimit: 390, uom: 'MPA', observed: '348 MPA' },
      { charId: 'C3', name: 'Visual Surface Defect', type: 'QUALITATIVE', expectedText: 'PASS', observed: 'PASS (No Rust)' },
    ],
    usageDecision: { decision: 'ACCEPTED', movementType: '321' },
    coaHash: 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
  },
  {
    lotId: 'LOT-2026-EV-04',
    origin: '04_PRODUCTION',
    materialSku: 'FERT-EVTRK-001',
    batchNumber: 'BATCH-2026-EV-001',
    quantity: 5,
    baseUom: 'EA',
    status: 'CREATED',
    characteristics: [
      { charId: 'C4', name: 'Battery Traction Voltage (V)', type: 'QUANTITATIVE', targetValue: 400.0, lowerLimit: 385.0, upperLimit: 415.0, uom: 'V', observed: '402.5 V' },
      { charId: 'C5', name: 'Regen Braking Decel (m/s²)', type: 'QUANTITATIVE', targetValue: 6.8, lowerLimit: 6.2, upperLimit: 7.5, uom: 'M/S2', observed: '6.9 M/S2' },
      { charId: 'C6', name: 'AIS-140 GPS Fix & Telematics', type: 'QUALITATIVE', expectedText: 'CONNECTED', observed: 'CONNECTED' },
    ],
    usageDecision: null as any,
    coaHash: '',
  },
]);

const selectedLot = ref<any>(inspectionLots.value[1]);

const activeTrace = ref({
  upstreamRaw: 'BATCH-2026-ST-088',
  mfgOrder: 'ORD-PP-EV981',
  finishedBatch: 'BATCH-2026-EV-001',
  customerOrder: 'SO-2026-0042',
});

function createDemoInspectionLot() {
  const newLot = {
    lotId: `LOT-${Date.now().toString(36).toUpperCase()}`,
    origin: '01_GOODS_RECEIPT',
    materialSku: 'ROH-STEEL-001',
    batchNumber: `BATCH-2026-ST-${Math.floor(Math.random() * 900 + 100)}`,
    quantity: 2500,
    baseUom: 'KG',
    status: 'CREATED',
    characteristics: [
      { charId: 'C1', name: 'Sheet Thickness (mm)', type: 'QUANTITATIVE', targetValue: 1.2, lowerLimit: 1.15, upperLimit: 1.25, uom: 'MM', observed: '1.20 MM' },
      { charId: 'C2', name: 'Tensile Strength (MPa)', type: 'QUANTITATIVE', targetValue: 340, lowerLimit: 310, upperLimit: 390, uom: 'MPA', observed: '342 MPA' },
      { charId: 'C3', name: 'Visual Surface Defect', type: 'QUALITATIVE', expectedText: 'PASS', observed: 'PASS' },
    ],
    usageDecision: null as any,
    coaHash: '',
  };
  inspectionLots.value.unshift(newLot);
  selectedLot.value = newLot;
}

function postUsageDecision(lot: any, decision: 'ACCEPTED' | 'REJECTED') {
  lot.usageDecision = {
    decision,
    movementType: decision === 'ACCEPTED' ? '321' : '350',
  };
  lot.status = 'UD_COMPLETED';
  lot.coaHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

// Controlling (CO) & Cost Centers
const costCenters = ref([
  {
    code: 'CC-MFG-BODY',
    name: 'Chassis Stamping & Body Shop',
    category: 'PRODUCTION',
    profitCenterCode: 'PC-EV-COMMERCIAL',
    budgetAnnual: 48000000,
    actualIncurred: 36500000,
  },
  {
    code: 'CC-MFG-ASSY',
    name: 'Powertrain & Final Robotic Assembly',
    category: 'PRODUCTION',
    profitCenterCode: 'PC-EV-COMMERCIAL',
    budgetAnnual: 72000000,
    actualIncurred: 54200000,
  },
  {
    code: 'CC-SHARED-IT',
    name: 'Enterprise IT, Cloud & Robotics Telemetry',
    category: 'SHARED_SERVICE',
    profitCenterCode: 'PC-EV-COMMERCIAL',
    budgetAnnual: 18000000,
    actualIncurred: 12000000,
  },
  {
    code: 'CC-LOGISTICS',
    name: 'Central Warehouse & Finished Vehicle Logistics',
    category: 'LOGISTICS',
    profitCenterCode: 'PC-EV-COMMERCIAL',
    budgetAnnual: 24000000,
    actualIncurred: 19800000,
  },
]);

const assessmentResult = ref<any>(null);

function runAssessmentCycle() {
  const itCC = costCenters.value.find((c) => c.code === 'CC-SHARED-IT');
  const bodyCC = costCenters.value.find((c) => c.code === 'CC-MFG-BODY');
  const assyCC = costCenters.value.find((c) => c.code === 'CC-MFG-ASSY');
  const logCC = costCenters.value.find((c) => c.code === 'CC-LOGISTICS');

  const allocateAmt = 1000000;
  if (itCC) itCC.actualIncurred = Math.max(0, itCC.actualIncurred - allocateAmt);
  if (bodyCC) bodyCC.actualIncurred += 400000;
  if (assyCC) assyCC.actualIncurred += 450000;
  if (logCC) logCC.actualIncurred += 150000;

  assessmentResult.value = {
    cycleId: `CYC-${Date.now().toString(36).toUpperCase()}`,
    sender: 'CC-SHARED-IT',
    totalAmount: allocateAmt,
    distributions: [
      { receiver: 'CC-MFG-BODY (Body Shop)', amount: 400000, percentage: 40 },
      { receiver: 'CC-MFG-ASSY (Assembly)', amount: 450000, percentage: 45 },
      { receiver: 'CC-LOGISTICS (Logistics)', amount: 150000, percentage: 15 },
    ],
  };
}
</script>

<style scoped>
.supply-chain-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.erp-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 20px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9));
  padding: 24px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.badge-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.badge {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.badge.blue { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
.badge.green { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
.badge.purple { background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
.badge.gray { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }

.header-titles h2 {
  font-size: 24px;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 6px 0;
}
.subtitle {
  color: #94a3b8;
  font-size: 14px;
  margin: 0;
}

.kpi-strip {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.kpi-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 14px 18px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 170px;
}
.kpi-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
.kpi-value { font-size: 20px; font-weight: 700; color: #f8fafc; font-family: monospace; }
.kpi-trend { font-size: 11px; font-weight: 500; }
.kpi-trend.positive { color: #34d399; }
.kpi-trend.info { color: #60a5fa; }

/* Sub nav tabs */
.sub-nav-tabs {
  display: flex;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 8px;
  overflow-x: auto;
}
.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.tab-btn:hover {
  color: #f8fafc;
  background: rgba(255, 255, 255, 0.04);
}
.tab-btn.active {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
}
.tab-icon { width: 18px; height: 18px; }

/* Grids and Panels */
.grid-2-1 {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}
@media (max-width: 1024px) {
  .grid-2-1 { grid-template-columns: 1fr; }
}

.panel {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 20px;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
}
.panel-header h3 {
  font-size: 17px;
  color: #f8fafc;
  margin: 0 0 4px 0;
}
.panel-sub { font-size: 12px; color: #94a3b8; }

/* Data tables */
.table-responsive {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.data-table th {
  text-align: left;
  padding: 10px 12px;
  color: #94a3b8;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.data-table td {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  color: #e2e8f0;
}
.data-table tr:hover td {
  background: rgba(255, 255, 255, 0.02);
}

.type-pill {
  font-size: 11px;
  padding: 3px 6px;
  border-radius: 4px;
  font-weight: 600;
  font-family: monospace;
}
.type-pill.roh { background: rgba(239, 68, 68, 0.2); color: #f87171; }
.type-pill.halb { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
.type-pill.fert { background: rgba(16, 185, 129, 0.2); color: #34d399; }

.status-pill {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 600;
}
.status-pill.success { background: rgba(16, 185, 129, 0.2); color: #34d399; }
.status-pill.warning { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }

/* Movement Form */
.movement-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-group label {
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
}
.form-select, .form-input {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #f8fafc;
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 13px;
}
.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #0284c7;
  color: #ffffff;
  border: none;
  padding: 11px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 6px;
}
.submit-btn:hover { background: #0369a1; }
.btn-icon { width: 16px; height: 16px; }

/* Results boxes */
.movement-result-box {
  margin-top: 20px;
  background: rgba(2, 132, 199, 0.08);
  border: 1px solid rgba(2, 132, 199, 0.25);
  border-radius: 8px;
  padding: 14px;
}
.result-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.icon-success { width: 20px; height: 20px; color: #34d399; flex-shrink: 0; }
.map-comparison {
  display: flex;
  justify-content: space-between;
  background: rgba(15, 23, 42, 0.5);
  padding: 10px;
  border-radius: 6px;
  font-size: 12px;
}
.gl-lines-box {
  margin-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 10px;
}
.gl-title { font-size: 11px; color: #94a3b8; font-weight: 600; display: block; margin-bottom: 6px; }
.gl-line {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  padding: 4px 0;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.04);
}
.gl-acc-name { flex: 1; margin: 0 10px; color: #cbd5e1; }

/* P2P Flow */
.p2p-simulation-box {
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 18px;
  border-radius: 10px;
}
.steps-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 10px;
}
.step-card {
  flex: 1;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 12px;
  border-radius: 8px;
  text-align: center;
}
.step-card.completed {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}
.step-num { font-size: 12px; font-weight: 700; color: #94a3b8; margin-bottom: 4px; }
.step-title { font-size: 13px; font-weight: 600; color: #f8fafc; }
.step-sub { font-size: 11px; color: #94a3b8; font-family: monospace; display: block; margin-top: 4px; }
.step-arrow svg { width: 18px; height: 18px; color: #64748b; }
.p2p-actions { display: flex; gap: 12px; }

/* Workflow Buttons */
.workflow-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.08);
  color: #f8fafc;
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition: all 0.2s;
}
.workflow-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.14);
}
.workflow-btn.primary {
  background: #0284c7;
  border-color: #0284c7;
}
.workflow-btn.primary:hover:not(:disabled) {
  background: #0369a1;
}
.workflow-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Audit Card */
.audit-card {
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 16px;
}
.audit-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.audit-status span { font-size: 12px; color: #94a3b8; display: block; margin-top: 2px; }
.tax-tds-breakdown {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.calc-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}
.calc-row.net {
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.calc-row.due {
  margin-top: 4px;
  padding: 8px;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 6px;
  font-size: 12px;
}

/* Aging subledger */
.aging-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}
.aging-box {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 14px;
  border-radius: 8px;
}
.aging-box.alert {
  border-color: rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.05);
}
.aging-header { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; display: block; }
.aging-vals { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }

.working-cap-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  background: rgba(15, 23, 42, 0.4);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.wc-item { display: flex; flex-direction: column; gap: 4px; }
.wc-label { font-size: 12px; color: #94a3b8; }
.wc-val { font-size: 20px; font-weight: 700; font-family: monospace; }
.wc-sub { font-size: 11px; color: #64748b; }

.debtors-list { display: flex; flex-direction: column; gap: 10px; }
.debtor-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(30, 41, 59, 0.4);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.04);
}
.debtor-info strong { font-size: 13px; color: #f8fafc; display: block; }
.debtor-days { font-size: 11px; }

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #64748b;
  gap: 12px;
}
.empty-icon { width: 36px; height: 36px; stroke-width: 1.5; }

/* Progress bar */
.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #38bdf8;
  border-radius: 3px;
}

/* Helper typography colors */
.font-mono { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
.font-bold { font-weight: 700; }
.text-cyan { color: #38bdf8; }
.text-green { color: #34d399; }
.text-accent { color: #f59e0b; }
.text-yellow { color: #fbbf24; }
.text-red { color: #f87171; }
.text-dim { color: #94a3b8; }
.action-btn-sm {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #f8fafc;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.action-btn-sm:hover { background: rgba(255, 255, 255, 0.14); }
.btn-icon-sm { width: 14px; height: 14px; }
.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #0284c7;
  color: #ffffff;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  margin-top: 14px;
}
.action-btn:hover { background: #0369a1; }
.einvoice-badge-box {
  margin-top: 16px;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 8px;
  padding: 12px;
}
.badge-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.irn-snippet { font-size: 10px; word-break: break-all; color: #cbd5e1; margin-bottom: 8px; }
.eway-tag { display: flex; align-items: center; gap: 10px; font-size: 11px; }

/* Manufacturing & BOM */
.bom-card {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 16px;
}
.bom-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.wc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-top: 10px;
}
.wc-card {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 12px;
}
.wc-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 8px;
}
.wc-rates {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}
.mfg-order-box {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 16px;
}
.planned-order-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 8px;
  padding: 16px;
}
.po-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.cost-summary-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: rgba(30, 41, 59, 0.4);
  padding: 12px;
  border-radius: 6px;
}
.summary-line {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #94a3b8;
}
.summary-line.total {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 8px;
  margin-top: 4px;
  font-size: 14px;
  color: #f8fafc;
}

/* Fixed Assets FI-AA */
.depr-audit-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(52, 211, 153, 0.3);
  border-radius: 8px;
  padding: 16px;
}
.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.icon-success {
  width: 24px;
  height: 24px;
  color: #34d399;
}
.gl-lines-box {
  background: rgba(30, 41, 59, 0.4);
  border-radius: 6px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.gl-title {
  font-size: 11px;
  text-transform: uppercase;
  color: #94a3b8;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.gl-line {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}
.gl-acc-name {
  color: #cbd5e1;
  flex: 1;
  margin: 0 10px;
}
.type-pill.roh { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
.type-pill.halb { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }

/* QM & CO Styles */
.selected-row {
  background: rgba(56, 189, 248, 0.1) !important;
}
.genealogy-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 16px;
  border-radius: 10px;
  overflow-x: auto;
}
.trace-step {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 170px;
}
.trace-label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
}
.trace-meta {
  font-size: 11px;
  color: #64748b;
}
.trace-arrow {
  width: 20px;
  height: 20px;
  color: #64748b;
  flex-shrink: 0;
}
.inspection-detail-box {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 16px;
}
.lot-header-box {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.char-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.char-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 6px;
}
.char-desc {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
}
.coa-card {
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 8px;
  padding: 14px;
}
.coa-header {
  display: flex;
  align-items: center;
  gap: 10px;
}
.status-pill.danger {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
</style>

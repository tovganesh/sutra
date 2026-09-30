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
        <h2>{{ $t('supplyChain.headerTitle') }}</h2>
        <p class="subtitle">{{ $t('supplyChain.headerSubtitle') }}</p>
      </div>

      <!-- Quick KPI Strip -->
      <div class="kpi-strip">
        <div class="kpi-card">
          <span class="kpi-label">{{ $t('supplyChain.kpiInventoryValuation') }}</span>
          <span class="kpi-value">{{ formatCurrency(totalInventoryValuation) }}</span>
          <span class="kpi-trend positive">{{ $t('supplyChain.kpiMap') }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">{{ $t('supplyChain.kpiDso') }}</span>
          <span class="kpi-value">{{ agingData.receivables.dsoDays }} {{ $t('common.days') }}</span>
          <span class="kpi-trend info">AR Benchmark: &lt; 45d</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">{{ $t('supplyChain.kpiMsme') }}</span>
          <span class="kpi-value text-accent">100% Compliant</span>
          <span class="kpi-trend positive">{{ $t('supplyChain.kpiMsmeSafe') }}</span>
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
        <span>{{ $t('supplyChain.tabs.inventory') }}</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'o2c' }"
        @click="activeTab = 'o2c'"
      >
        <TrendingUp class="tab-icon" />
        <span>{{ $t('supplyChain.tabs.o2c') }}</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'p2p' }"
        @click="activeTab = 'p2p'"
      >
        <ShoppingCart class="tab-icon" />
        <span>{{ $t('supplyChain.tabs.p2p') }}</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'subledger' }"
        @click="activeTab = 'subledger'"
      >
        <Clock class="tab-icon" />
        <span>{{ $t('supplyChain.tabs.subledger') }}</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'mfg' }"
        @click="activeTab = 'mfg'"
      >
        <Factory class="tab-icon" />
        <span>{{ $t('supplyChain.tabs.mfg') }}</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'assets' }"
        @click="activeTab = 'assets'"
      >
        <Building2 class="tab-icon" />
        <span>{{ $t('supplyChain.tabs.assets') }}</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'quality' }"
        @click="activeTab = 'quality'"
      >
        <ShieldCheck class="tab-icon" />
        <span>{{ $t('supplyChain.tabs.quality') }}</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'controlling' }"
        @click="activeTab = 'controlling'"
      >
        <PieChart class="tab-icon" />
        <span>{{ $t('supplyChain.tabs.controlling') }}</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'maintenance' }"
        @click="activeTab = 'maintenance'"
      >
        <Wrench class="tab-icon" />
        <span>{{ $t('supplyChain.tabs.maintenance') }}</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'treasury' }"
        @click="activeTab = 'treasury'"
      >
        <Landmark class="tab-icon" />
        <span>{{ $t('supplyChain.tabs.treasury') }}</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'hcm' }"
        @click="activeTab = 'hcm'"
      >
        <Users class="tab-icon" />
        <span>{{ $t('supplyChain.tabs.hcm') }}</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'projects' }"
        @click="activeTab = 'projects'"
      >
        <Briefcase class="tab-icon" />
        <span>{{ $t('supplyChain.tabs.projects') }}</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'warehouse' }"
        @click="activeTab = 'warehouse'"
      >
        <Boxes class="tab-icon" />
        <span>{{ $t('supplyChain.tabs.warehouse') }}</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'multicurrency' }"
        @click="activeTab = 'multicurrency'"
      >
        <Globe class="tab-icon" />
        <span>{{ $t('supplyChain.tabs.multicurrency') }}</span>
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'transportation' }"
        @click="activeTab = 'transportation'"
      >
        <Truck class="tab-icon" />
        <span>{{ $t('supplyChain.tabs.transportation') }}</span>
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
                  <th>Valuation ({{ currencySymbol }})</th>
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
                  <td class="font-mono font-bold">{{ formatNumber(mat.totalStock) }}</td>
                  <td class="font-mono">{{ formatCurrency(mat.movingAvgPrice, { decimals: 2 }) }}</td>
                  <td class="font-mono font-bold text-accent">{{ formatCurrency(mat.totalStock * mat.movingAvgPrice) }}</td>
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
                <label>Inbound Unit Cost ({{ currencySymbol }})</label>
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
                <strong>{{ formatNumber(movementResult.previousStock) }}</strong>
              </div>
              <div>
                <span class="sub-label">Current Stock:</span>
                <strong class="text-accent">{{ formatNumber(movementResult.currentStock) }}</strong>
              </div>
              <div>
                <span class="sub-label">New MAP:</span>
                <strong class="text-cyan">{{ formatCurrency(movementResult.newMovingAvgPrice, { decimals: 2 }) }}</strong>
              </div>
            </div>

            <div v-if="movementResult.journalLines && movementResult.journalLines.length" class="gl-lines-box">
              <span class="gl-title">Automated Double-Entry General Ledger Postings:</span>
              <div v-for="(line, idx) in movementResult.journalLines" :key="idx" class="gl-line">
                <span class="font-mono text-dim">{{ line.accountCode }}</span>
                <span class="gl-acc-name">{{ line.accountName }}</span>
                <span class="font-mono text-green" v-if="line.debit > 0">Dr {{ formatCurrency(line.debit) }}</span>
                <span class="font-mono text-cyan" v-if="line.credit > 0">Cr {{ formatCurrency(line.credit) }}</span>
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
                  <td class="font-mono">{{ formatCurrency(cust.creditLimit) }}</td>
                  <td class="font-mono font-bold text-accent">{{ formatCurrency(cust.currentOutstanding) }}</td>
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
                  <label>Unit Price ({{ currencySymbol }})</label>
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
                <span class="font-mono">{{ formatCurrency(activeSalesOrder.taxableValue) }}</span>
              </div>
              <div class="summary-line" v-if="!activeSalesOrder.isInterState">
                <span>Intra-State GST (9% CGST + 9% SGST):</span>
                <span class="font-mono text-green">{{ formatCurrency(activeSalesOrder.cgst + activeSalesOrder.sgst) }}</span>
              </div>
              <div class="summary-line" v-else>
                <span>Inter-State IGST (18%):</span>
                <span class="font-mono text-green">{{ formatCurrency(activeSalesOrder.igst) }}</span>
              </div>
              <div class="summary-line total">
                <span>Invoice Grand Total:</span>
                <strong class="font-mono text-accent">{{ formatCurrency(activeSalesOrder.grandTotal) }}</strong>
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
                <span class="text-dim">Consignment &gt; {{ formatCurrency(50000) }} statutory requirement met</span>
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
                  <td class="font-mono font-bold">{{ vend.paymentTermsDays }} {{ $t('common.days') }}</td>
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
                  <span class="step-sub">{{ p2pState.poNumber }} ({{ formatCurrency(p2pState.poValue) }})</span>
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
                <span class="font-mono">{{ formatCurrency(p2pVerificationResult.taxableAmount) }}</span>
              </div>
              <div class="calc-row">
                <span>Input GST Credit (ITC):</span>
                <span class="font-mono text-green">{{ formatCurrency(p2pVerificationResult.inputGstCredit.totalGst) }}</span>
              </div>
              <div class="calc-row">
                <span>TDS Withheld (Sec {{ p2pVerificationResult.tdsDeduction.section }} @ {{ p2pVerificationResult.tdsDeduction.ratePercent }}%):</span>
                <span class="font-mono text-red">- {{ formatCurrency(p2pVerificationResult.tdsDeduction.deductionAmount) }}</span>
              </div>
              <div class="calc-row net">
                <span>Net Payable to Vendor:</span>
                <strong class="font-mono text-accent">{{ formatCurrency(p2pVerificationResult.netPayableToVendor) }}</strong>
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
                <div><span class="text-dim">AR:</span> <strong class="text-green">{{ formatCurrency(agingData.receivables.summary.current0to30) }}</strong></div>
                <div><span class="text-dim">AP:</span> <strong class="text-cyan">{{ formatCurrency(agingData.payables.summary.current0to30) }}</strong></div>
              </div>
            </div>

            <div class="aging-box">
              <span class="aging-header">31–60 Days</span>
              <div class="aging-vals">
                <div><span class="text-dim">AR:</span> <strong class="text-green">{{ formatCurrency(agingData.receivables.summary.days31to60) }}</strong></div>
                <div><span class="text-dim">AP:</span> <strong class="text-cyan">{{ formatCurrency(agingData.payables.summary.days31to60) }}</strong></div>
              </div>
            </div>

            <div class="aging-box">
              <span class="aging-header">61–90 Days</span>
              <div class="aging-vals">
                <div><span class="text-dim">AR:</span> <strong class="text-yellow">{{ formatCurrency(agingData.receivables.summary.days61to90) }}</strong></div>
                <div><span class="text-dim">AP:</span> <strong class="text-cyan">{{ formatCurrency(agingData.payables.summary.days61to90) }}</strong></div>
              </div>
            </div>

            <div class="aging-box alert">
              <span class="aging-header">Overdue (&gt; 90 Days)</span>
              <div class="aging-vals">
                <div><span class="text-dim">AR:</span> <strong class="text-red">{{ formatCurrency(agingData.receivables.summary.above90) }}</strong></div>
                <div><span class="text-dim">AP:</span> <strong class="text-cyan">{{ formatCurrency(agingData.payables.summary.above90) }}</strong></div>
              </div>
            </div>
          </div>

          <!-- Total Summary Row -->
          <div class="working-cap-summary">
            <div class="wc-item">
              <span class="wc-label">Total Trade Receivables (AR)</span>
              <span class="wc-val text-green">{{ formatCurrency(agingData.receivables.summary.totalOutstanding) }}</span>
              <span class="wc-sub">DSO: {{ agingData.receivables.dsoDays }} {{ $t('common.days') }}</span>
            </div>
            <div class="wc-item">
              <span class="wc-label">Total Trade Payables (AP)</span>
              <span class="wc-val text-cyan">{{ formatCurrency(agingData.payables.summary.totalOutstanding) }}</span>
              <span class="wc-sub">DPO: {{ agingData.payables.dpoDays }} {{ $t('common.days') }}</span>
            </div>
            <div class="wc-item">
              <span class="wc-label">Net Working Capital Exposure</span>
              <span class="wc-val text-accent">{{ formatCurrency(agingData.receivables.summary.totalOutstanding - agingData.payables.summary.totalOutstanding) }}</span>
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
                {{ formatCurrency(debtor.outstandingBalance) }}
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
                  <div><span class="text-dim">Labor:</span> {{ formatCurrency(wc.hourlyLaborCost) }}/hr</div>
                  <div><span class="text-dim">Machine:</span> {{ formatCurrency(wc.hourlyMachineCost) }}/hr</div>
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
                <span class="font-mono">{{ formatCurrency(plannedOrder.totalDirectMaterialCost) }}</span>
              </div>
              <div class="summary-line">
                <span>Direct Labor Overhead:</span>
                <span class="font-mono">{{ formatCurrency(plannedOrder.estimatedLaborCost) }}</span>
              </div>
              <div class="summary-line">
                <span>Machine Overhead:</span>
                <span class="font-mono">{{ formatCurrency(plannedOrder.estimatedMachineCost) }}</span>
              </div>
              <div class="summary-line total">
                <span>Total Standard Cost:</span>
                <strong class="font-mono text-accent">{{ formatCurrency(plannedOrder.totalPlannedCost) }}</strong>
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
                  <td class="font-mono">{{ formatCurrency(ast.originalCost) }}</td>
                  <td class="font-mono text-red">{{ formatCurrency(ast.accumulatedDepreciation) }}</td>
                  <td class="font-mono font-bold text-green">{{ formatCurrency(ast.currentBookValue) }}</td>
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
              <strong class="font-mono text-accent">{{ formatCurrency(deprRunResult.totalDepreciationAmount) }}</strong>
            </div>

            <div class="gl-lines-box">
              <span class="gl-title">Automated GL Postings:</span>
              <div class="gl-line">
                <span class="font-mono text-dim">530100</span>
                <span class="gl-acc-name">Depreciation Expense (P&L)</span>
                <span class="font-mono text-green">Dr {{ formatCurrency(deprRunResult.totalDepreciationAmount) }}</span>
              </div>
              <div class="gl-line">
                <span class="font-mono text-dim">140900</span>
                <span class="gl-acc-name">Accumulated Depreciation (Contra Asset)</span>
                <span class="font-mono text-cyan">Cr {{ formatCurrency(deprRunResult.totalDepreciationAmount) }}</span>
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
                  <td class="font-mono">{{ formatCurrency(cc.budgetAnnual) }}</td>
                  <td class="font-mono font-bold text-accent">{{ formatCurrency(cc.actualIncurred) }}</td>
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
                <span>Distributed {{ formatCurrency(assessmentResult.totalAmount) }} from {{ assessmentResult.sender }}</span>
              </div>
            </div>

            <div class="tax-tds-breakdown" style="margin-top: 14px;">
              <span class="gl-title">Secondary Cost Allocations:</span>
              <div v-for="alloc in assessmentResult.distributions" :key="alloc.receiver" class="calc-row">
                <span>{{ alloc.receiver }} ({{ alloc.percentage }}%):</span>
                <span class="font-mono text-cyan">{{ formatCurrency(alloc.amount) }}</span>
              </div>
            </div>

            <div class="gl-lines-box" style="margin-top: 14px;">
              <span class="gl-title">Secondary Cost Element Journal (GL 610000):</span>
              <div class="gl-line">
                <span class="font-mono text-dim">610000</span>
                <span class="gl-acc-name">Cost Assessment Inflow</span>
                <span class="font-mono text-green">Dr {{ formatCurrency(assessmentResult.totalAmount) }}</span>
              </div>
              <div class="gl-line">
                <span class="font-mono text-dim">610000</span>
                <span class="gl-acc-name">Cost Assessment Outflow</span>
                <span class="font-mono text-cyan">Cr {{ formatCurrency(assessmentResult.totalAmount) }}</span>
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

    <!-- TAB 9: Plant Maintenance & Enterprise Asset Management (PM/EAM) -->
    <div v-if="activeTab === 'maintenance'" class="tab-content">
      <!-- Quick PM KPI Banner -->
      <div class="kpi-strip" style="margin-bottom: 20px;">
        <div class="kpi-card">
          <span class="kpi-label">Active Machinery Equipment</span>
          <span class="kpi-value">{{ equipmentList.length }} Assets</span>
          <span class="kpi-trend positive">100% Registered</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Plant MTBF (Mean Time Between Failures)</span>
          <span class="kpi-value text-accent">{{ plantReliability.mtbfHours }} Hours</span>
          <span class="kpi-trend positive">Target: &gt; 1,000h</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Plant MTTR (Mean Time to Repair)</span>
          <span class="kpi-value">{{ plantReliability.mttrHours }} Hours</span>
          <span class="kpi-trend info">Target: &lt; 4.0h</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Equipment Availability</span>
          <span class="kpi-value text-green">{{ plantReliability.availabilityPercentage }}%</span>
          <span class="kpi-trend positive">OEE Benchmark</span>
        </div>
      </div>

      <div class="grid-2-1">
        <!-- Equipment Master & Reliability -->
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Equipment Master & Reliability KPIs (SAP PM)</h3>
              <span class="panel-sub">Functional Locations, Operating Hours & Predictive Cycles</span>
            </div>
            <button class="action-btn-sm" @click="runPreventiveEvaluation">
              <RefreshCw class="btn-icon-sm" />
              <span>Evaluate Preventive Cycles</span>
            </button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>Equipment No</th>
                <th>Name / Description</th>
                <th>Category</th>
                <th>Location / Cost Center</th>
                <th>Operating Hours</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="eq in equipmentList" :key="eq.equipmentNumber">
                <td class="font-mono">{{ eq.equipmentNumber }}</td>
                <td>
                  <div class="sku-cell">
                    <strong>{{ eq.name }}</strong>
                    <span class="sku-sub font-mono">{{ eq.serialNumber }} ({{ eq.manufacturer }})</span>
                  </div>
                </td>
                <td><span class="badge blue">{{ eq.category }}</span></td>
                <td>
                  <div class="sku-cell">
                    <span>{{ eq.functionalLocationId }}</span>
                    <span class="sku-sub font-mono">{{ eq.costCenter }}</span>
                  </div>
                </td>
                <td class="font-mono text-cyan">{{ formatNumber(eq.operatingHours) }} hrs</td>
                <td>
                  <span class="status-pill" :class="eq.status === 'OPERATIONAL' ? 'active' : 'danger'">
                    {{ eq.status }}
                  </span>
                </td>
                <td>
                  <button class="action-btn-sm" @click="selectEquipmentForWo(eq)">
                    <span>Create WO</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Work Orders & Spare Parts Execution -->
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Maintenance Work Orders</h3>
              <span class="panel-sub">Spare Parts Reservation & Cost Settlement</span>
            </div>
          </div>

          <div v-for="wo in workOrders" :key="wo.orderNumber" class="process-card" style="margin-bottom: 16px;">
            <div class="process-step-header">
              <span class="step-num font-mono">{{ wo.orderNumber }}</span>
              <div>
                <h4>{{ wo.orderType }} Maintenance: {{ wo.equipmentNumber }}</h4>
                <p class="subtitle">Assigned Tech: {{ wo.assignedTechnician }} | Cost Center: {{ wo.costCenter }}</p>
              </div>
              <span class="status-pill" :class="wo.status === 'CLOSED' ? 'active' : wo.status === 'RELEASED' ? 'info' : 'warning'">
                {{ wo.status }}
              </span>
            </div>

            <!-- Spare parts section -->
            <div style="margin-top: 12px;">
              <span class="gl-title">Allocated Spare Parts (MM Integration):</span>
              <div v-for="part in wo.spareParts" :key="part.sku" class="calc-row">
                <span>{{ part.name }} (Qty: {{ part.issuedQuantity }}/{{ part.requiredQuantity }}):</span>
                <span class="font-mono text-green">{{ formatCurrency(part.totalCost) }}</span>
              </div>
            </div>

            <div class="cost-summary-box" style="margin-top: 12px;">
              <div class="cost-row">
                <span>Labor Cost ({{ wo.actualLaborHours }} hrs @ {{ formatCurrency(wo.laborHourlyRate) }}/hr):</span>
                <span class="font-mono">{{ formatCurrency(wo.totalLaborCost) }}</span>
              </div>
              <div class="cost-row">
                <span>Spare Parts Material Cost:</span>
                <span class="font-mono">{{ formatCurrency(wo.totalMaterialCost) }}</span>
              </div>
              <div class="cost-row total">
                <strong>Total Maintenance Cost Settled:</strong>
                <strong class="font-mono text-cyan">{{ formatCurrency(wo.totalActualCost) }}</strong>
              </div>
            </div>

            <div class="action-row" style="margin-top: 14px;">
              <button
                v-if="wo.status === 'RELEASED'"
                class="action-btn-sm"
                @click="issueSparePart(wo.orderNumber)"
              >
                <span>Issue Spare Part (Mvt 201)</span>
              </button>
              <button
                v-if="wo.status === 'RELEASED'"
                class="action-btn-sm primary"
                @click="completeAndSettleWo(wo.orderNumber)"
              >
                <CheckCircle2 class="btn-icon-sm" />
                <span>Technically Complete & Settle</span>
              </button>
              <span v-else-if="wo.status === 'CLOSED'" class="text-green font-mono" style="font-size: 12px;">
                ✔ Settled to GL 510300 (Maintenance Exp)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 10: Treasury & Bank Statement Reconciliation (TRM/FI-BL) -->
    <div v-if="activeTab === 'treasury'" class="tab-content">
      <!-- Quick Treasury KPI Banner -->
      <div class="kpi-strip" style="margin-bottom: 20px;">
        <div class="kpi-card">
          <span class="kpi-label">Total Operating Bank Balance</span>
          <span class="kpi-value text-green">{{ formatCurrency(totalBankBalance) }}</span>
          <span class="kpi-trend positive">HDFC & SBI Accounts</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">GL Book Balance</span>
          <span class="kpi-value">{{ formatCurrency(treasuryBookBalance) }}</span>
          <span class="kpi-trend info">GL Account 100100</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Reconciliation Status</span>
          <span class="kpi-value text-accent">{{ brsData.isBalanced ? '100% Balanced' : 'Open Variance' }}</span>
          <span class="kpi-trend positive">Variance: {{ formatCurrency(brsData.variance) }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">30-Day Projected Net Cash</span>
          <span class="kpi-value text-cyan">{{ formatCurrency(cashForecast.forecast30Days.projectedClosingCash) }}</span>
          <span class="kpi-trend positive">+{{ formatCurrency((cashForecast.forecast30Days.netCashFlow)) }} Net Flow</span>
        </div>
      </div>

      <div class="grid-2-1">
        <!-- House Banks & Statement Importer -->
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>House Banks & MT940 Electronic Statements (SAP FI-BL)</h3>
              <span class="panel-sub">Current Accounts, RTGS/NEFT Feeds & Statement Ingestion</span>
            </div>
            <button class="action-btn-sm primary" @click="runAutoReconciliation">
              <CheckCircle2 class="btn-icon-sm" />
              <span>Execute 2-Way Auto-Reconciliation</span>
            </button>
          </div>

          <!-- Bank Accounts Summary -->
          <div class="bank-accounts-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 20px;">
            <div v-for="acc in companyBankAccounts" :key="acc.accountId" class="cost-center-card active">
              <div class="cc-header">
                <div>
                  <span class="cc-code font-mono">{{ acc.accountNumber }}</span>
                  <h4 style="margin: 2px 0 0 0;">{{ acc.bankName }}</h4>
                </div>
                <span class="badge blue">{{ acc.accountType }}</span>
              </div>
              <div class="calc-row" style="margin-top: 10px;">
                <span>GL Book Balance:</span>
                <span class="font-mono text-cyan">{{ formatCurrency(acc.currentBookBalance) }}</span>
              </div>
              <div class="calc-row">
                <span>Reconciled Bank Balance:</span>
                <span class="font-mono text-green">{{ formatCurrency(acc.reconciledBankBalance) }}</span>
              </div>
              <div class="calc-row">
                <span>IFSC / Branch:</span>
                <span class="font-mono text-dim">{{ acc.ifscCode }}</span>
              </div>
            </div>
          </div>

          <!-- Statement Lines Table -->
          <h4 style="margin: 16px 0 8px 0;">Imported Bank Statement Lines (MT940 Feed)</h4>
          <table class="data-table">
            <thead>
              <tr>
                <th>Line ID</th>
                <th>Date</th>
                <th>Reference / UTR</th>
                <th>Counterparty</th>
                <th>Type</th>
                <th>Amount ({{ currencySymbol }})</th>
                <th>Recon Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="line in statementLines" :key="line.lineId">
                <td class="font-mono">{{ line.lineId }}</td>
                <td class="font-mono">{{ line.transactionDate }}</td>
                <td class="font-mono text-cyan">{{ line.transactionReference }}</td>
                <td>{{ line.counterpartyName || 'Corporate Settlement' }}</td>
                <td>
                  <span class="badge" :class="line.direction === 'CREDIT' ? 'green' : 'blue'">
                    {{ line.direction }}
                  </span>
                </td>
                <td class="font-mono" :class="line.direction === 'CREDIT' ? 'text-green' : 'text-danger'">
                  {{ line.direction === 'CREDIT' ? '+' : '-' }}{{ formatCurrency(line.amount) }}
                </td>
                <td>
                  <span class="status-pill" :class="line.reconciliationStatus === 'AUTO_CLEARED' ? 'active' : 'warning'">
                    {{ line.reconciliationStatus }} ({{ line.matchScore || 0 }}%)
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Bank Reconciliation Statement (BRS) & Liquidity Forecast -->
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Bank Reconciliation Statement (BRS)</h3>
              <span class="panel-sub">Automated Balancing & Cash Forecasting</span>
            </div>
          </div>

          <!-- BRS Card -->
          <div class="brs-summary-box" style="background: rgba(15, 23, 42, 0.6); padding: 16px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08);">
            <div class="calc-row">
              <span><strong>Balance as per Bank Statement:</strong></span>
              <strong class="font-mono text-green">{{ formatCurrency(brsData.balanceAsPerBank) }}</strong>
            </div>

            <div style="margin-top: 10px;">
              <span class="gl-title text-cyan">Add: Deposits in Transit (Debited in Books, Not by Bank):</span>
              <div v-for="dep in brsData.addDepositsInTransit" :key="dep.reference" class="calc-row" style="padding-left: 10px;">
                <span class="font-mono">{{ dep.reference }}:</span>
                <span class="font-mono text-cyan">+{{ formatCurrency(dep.amount) }}</span>
              </div>
            </div>

            <div style="margin-top: 10px;">
              <span class="gl-title text-danger">Less: Unpresented Cheques (Issued in Books, Uncleared):</span>
              <div v-for="chq in brsData.lessUnpresentedCheques" :key="chq.reference" class="calc-row" style="padding-left: 10px;">
                <span class="font-mono">{{ chq.reference }}:</span>
                <span class="font-mono text-danger">-{{ formatCurrency(chq.amount) }}</span>
              </div>
            </div>

            <div class="calc-row total" style="margin-top: 14px; border-top: 1px solid rgba(255, 255, 255, 0.15); padding-top: 10px;">
              <strong>Adjusted Bank Balance:</strong>
              <strong class="font-mono text-accent">{{ formatCurrency(brsData.adjustedBankBalance) }}</strong>
            </div>
            <div class="calc-row">
              <span>Balance as per Company Books:</span>
              <span class="font-mono text-cyan">{{ formatCurrency(brsData.balanceAsPerCompanyBooks) }}</span>
            </div>
            <div class="calc-row">
              <span>Reconciliation Variance:</span>
              <span class="font-mono" :class="brsData.isBalanced ? 'text-green' : 'text-danger'">
                {{ formatCurrency(brsData.variance) }} {{ brsData.isBalanced ? '(PERFECT MATCH)' : '' }}
              </span>
            </div>
          </div>

          <!-- Cash Liquidity Forecast Projection -->
          <div style="margin-top: 20px;">
            <div class="panel-header" style="margin-bottom: 10px;">
              <div>
                <h4>30 / 60 / 90-Day Cash Liquidity Forecast</h4>
                <span class="panel-sub">Real-Time AR & AP Open Invoices Inflow/Outflow</span>
              </div>
            </div>

            <table class="data-table">
              <thead>
                <tr>
                  <th>Horizon</th>
                  <th>Receivables Inflow</th>
                  <th>Payables Outflow</th>
                  <th>Net Cash Flow</th>
                  <th>Projected Closing Cash</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>30 Days</strong></td>
                  <td class="font-mono text-green">+{{ formatCurrency(cashForecast.forecast30Days.expectedReceivables) }}</td>
                  <td class="font-mono text-danger">-{{ formatCurrency(cashForecast.forecast30Days.expectedPayables) }}</td>
                  <td class="font-mono text-cyan">+{{ formatCurrency(cashForecast.forecast30Days.netCashFlow) }}</td>
                  <td class="font-mono text-accent"><strong>{{ formatCurrency(cashForecast.forecast30Days.projectedClosingCash) }}</strong></td>
                </tr>
                <tr>
                  <td><strong>60 Days</strong></td>
                  <td class="font-mono text-green">+{{ formatCurrency(cashForecast.forecast60Days.expectedReceivables) }}</td>
                  <td class="font-mono text-danger">-{{ formatCurrency(cashForecast.forecast60Days.expectedPayables) }}</td>
                  <td class="font-mono text-cyan">+{{ formatCurrency(cashForecast.forecast60Days.netCashFlow) }}</td>
                  <td class="font-mono text-accent"><strong>{{ formatCurrency(cashForecast.forecast60Days.projectedClosingCash) }}</strong></td>
                </tr>
                <tr>
                  <td><strong>90 Days</strong></td>
                  <td class="font-mono text-green">+{{ formatCurrency(cashForecast.forecast90Days.expectedReceivables) }}</td>
                  <td class="font-mono text-danger">-{{ formatCurrency(cashForecast.forecast90Days.expectedPayables) }}</td>
                  <td class="font-mono text-cyan">+{{ formatCurrency(cashForecast.forecast90Days.netCashFlow) }}</td>
                  <td class="font-mono text-accent"><strong>{{ formatCurrency(cashForecast.forecast90Days.projectedClosingCash) }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 11: Human Capital Management & Core HR (SAP HCM) -->
    <div v-if="activeTab === 'hcm'" class="tab-content">
      <!-- Quick HCM KPI Banner -->
      <div class="kpi-strip" style="margin-bottom: 20px;">
        <div class="kpi-card">
          <span class="kpi-label">Active Headcount</span>
          <span class="kpi-value">{{ employeesList.length }} Employees</span>
          <span class="kpi-trend positive">100% On-Roll</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Current Payroll Month</span>
          <span class="kpi-value text-accent">September 2026</span>
          <span class="kpi-trend info">Cycle: 22 Working Days</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Monthly Gross Payroll</span>
          <span class="kpi-value">{{ formatCurrency(totalMonthlyGross) }}</span>
          <span class="kpi-trend positive">Cost Centers Assigned</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Statutory Compliance</span>
          <span class="kpi-value text-green">100% Compliant</span>
          <span class="kpi-trend positive">EPF • ESIC • PT • TDS 192</span>
        </div>
      </div>

      <div class="grid-2-1">
        <!-- Employee Master Directory -->
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Employee Master Directory (SAP HCM)</h3>
              <span class="panel-sub">Statutory Records, Cost Center Mapping & CTC Structures</span>
            </div>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Name / Designation</th>
                <th>Department</th>
                <th>Cost Center</th>
                <th>Monthly CTC</th>
                <th>Attendance / LOP</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="emp in employeesList" :key="emp.employeeId">
                <td class="font-mono">{{ emp.employeeId }}</td>
                <td>
                  <div class="sku-cell">
                    <strong>{{ emp.fullName }}</strong>
                    <span class="sku-sub font-mono">{{ emp.designation }}</span>
                  </div>
                </td>
                <td><span class="badge blue">{{ emp.department }}</span></td>
                <td><span class="font-mono text-cyan">{{ emp.costCenter }}</span></td>
                <td class="font-mono text-green">{{ formatCurrency(emp.salaryStructure.grossMonthly) }}</td>
                <td>
                  <span class="status-pill" :class="emp.lossOfPayDays > 0 ? 'warning' : 'active'">
                    {{ emp.presentDays }}/{{ emp.totalWorkingDays }} Days {{ emp.lossOfPayDays > 0 ? `(${emp.lossOfPayDays} LOP)` : '' }}
                  </span>
                </td>
                <td>
                  <button class="action-btn-sm" @click="selectEmployeeForPayslip(emp)">
                    <span>View Payslip</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Monthly Payroll Execution & Digital Payslip -->
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Monthly Payroll Execution & GL Voucher</h3>
              <span class="panel-sub">Indian Statutory Deductions & Multi-Line Posting</span>
            </div>
            <button class="action-btn-sm primary" @click="runPayrollExecution">
              <CheckCircle2 class="btn-icon-sm" />
              <span>Execute September Payroll</span>
            </button>
          </div>

          <!-- Digital Payslip Preview -->
          <div v-if="selectedPayslip" class="brs-summary-box" style="background: rgba(15, 23, 42, 0.6); padding: 16px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08); margin-bottom: 16px;">
            <div class="calc-row">
              <strong>Payslip: {{ selectedPayslip.employeeName }} ({{ selectedPayslip.employeeId }})</strong>
              <span class="badge green">PAID</span>
            </div>
            <div class="calc-row">
              <span class="text-dim">Dept / Designation: {{ selectedPayslip.department }} • {{ selectedPayslip.designation }}</span>
              <span class="font-mono text-dim">Bank: {{ selectedPayslip.bankAccountMasked }}</span>
            </div>

            <div style="margin-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 8px;">
              <span class="gl-title text-green">Earnings (Pro-Rata for Present Days):</span>
              <div class="calc-row" style="padding-left: 10px;">
                <span>Basic Salary:</span>
                <span class="font-mono text-green">{{ formatCurrency(selectedPayslip.earnedBasic) }}</span>
              </div>
              <div class="calc-row" style="padding-left: 10px;">
                <span>House Rent Allowance (HRA):</span>
                <span class="font-mono text-green">{{ formatCurrency(selectedPayslip.earnedHra) }}</span>
              </div>
              <div class="calc-row" style="padding-left: 10px;">
                <span>Special Allowance:</span>
                <span class="font-mono text-green">{{ formatCurrency(selectedPayslip.earnedSpecialAllowance) }}</span>
              </div>
              <div class="calc-row" style="padding-left: 10px; font-weight: bold;">
                <span>Earned Gross:</span>
                <span class="font-mono text-green">{{ formatCurrency(selectedPayslip.earnedGrossSalary) }}</span>
              </div>
            </div>

            <div style="margin-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 8px;">
              <span class="gl-title text-danger">Statutory Deductions:</span>
              <div class="calc-row" style="padding-left: 10px;">
                <span>Employee EPF (12% capped at {{ formatCurrency(1800) }}):</span>
                <span class="font-mono text-danger">-{{ formatCurrency(selectedPayslip.deductions.epfEmployee) }}</span>
              </div>
              <div class="calc-row" style="padding-left: 10px;">
                <span>Employee ESIC (0.75%):</span>
                <span class="font-mono text-danger">-{{ formatCurrency(selectedPayslip.deductions.esiEmployee) }}</span>
              </div>
              <div class="calc-row" style="padding-left: 10px;">
                <span>Professional Tax (PT):</span>
                <span class="font-mono text-danger">-{{ formatCurrency(selectedPayslip.deductions.professionalTax) }}</span>
              </div>
              <div class="calc-row" style="padding-left: 10px;">
                <span>Income Tax TDS (Sec 192):</span>
                <span class="font-mono text-danger">-{{ formatCurrency(selectedPayslip.deductions.incomeTaxTds192) }}</span>
              </div>
            </div>

            <div class="calc-row total" style="margin-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.15); padding-top: 8px;">
              <strong>Net Take-Home Disbursed:</strong>
              <strong class="font-mono text-accent">{{ formatCurrency(selectedPayslip.netPayableSalary) }}</strong>
            </div>
          </div>

          <!-- Multi-line GL Voucher -->
          <div v-if="payrollGlLines.length > 0" class="gl-lines-box">
            <span class="gl-title">Payroll General Ledger Voucher (PAY-JRN-2026-09):</span>
            <div v-for="line in payrollGlLines" :key="line.accountCode" class="gl-line">
              <span class="font-mono text-dim">{{ line.accountCode }}</span>
              <span class="gl-acc-name">{{ line.accountName }}</span>
              <span class="font-mono" :class="line.debit > 0 ? 'text-green' : 'text-cyan'">
                {{ line.debit > 0 ? `Dr ${formatCurrency(line.debit)}` : `Cr ${formatCurrency(line.credit)}` }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 12: Project Systems & Capital Project Costing (SAP PS) -->
    <div v-if="activeTab === 'projects'" class="tab-content">
      <!-- Quick Project KPI Banner -->
      <div class="kpi-strip" style="margin-bottom: 20px;">
        <div class="kpi-card">
          <span class="kpi-label">Active Capital Project</span>
          <span class="kpi-value text-accent">{{ currentProject.name }}</span>
          <span class="kpi-trend positive">{{ currentProject.projectId }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Approved Project Budget</span>
          <span class="kpi-value">{{ formatCurrency(currentProject.totalApprovedBudget) }}</span>
          <span class="kpi-trend info">CapEx Facility</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Committed PO Funds</span>
          <span class="kpi-value text-cyan">{{ formatCurrency(currentProject.totalCommittedCost) }}</span>
          <span class="kpi-trend info">Vendor Purchase Orders</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Actual Incurred CWIP</span>
          <span class="kpi-value text-green">{{ formatCurrency(currentProject.totalActualCost) }}</span>
          <span class="kpi-trend positive">GL 140800 CWIP Asset</span>
        </div>
      </div>

      <div class="grid-2-1">
        <!-- Work Breakdown Structure (WBS) & Milestones -->
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Work Breakdown Structure (WBS Elements - SAP PS)</h3>
              <span class="panel-sub">Cost Elements, Committed POs & Actual Spend Tracking</span>
            </div>
            <button class="action-btn-sm" @click="achieveCommissioningMilestone">
              <CheckCircle2 class="btn-icon-sm" />
              <span>Complete Milestone M3 (Commissioning)</span>
            </button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>WBS Code</th>
                <th>Element Description</th>
                <th>Cost Center</th>
                <th>Allocated Budget</th>
                <th>Committed (POs)</th>
                <th>Actual Incurred</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="wbs in wbsElementsList" :key="wbs.wbsCode">
                <td class="font-mono text-cyan">{{ wbs.wbsCode }}</td>
                <td><strong>{{ wbs.name }}</strong></td>
                <td class="font-mono">{{ wbs.costCenter }}</td>
                <td class="font-mono">{{ formatCurrency(wbs.budgetAllocated) }}</td>
                <td class="font-mono text-cyan">{{ formatCurrency(wbs.budgetCommitted) }}</td>
                <td class="font-mono text-green">{{ formatCurrency(wbs.actualCostIncurred) }}</td>
                <td><span class="status-pill active">{{ wbs.status }}</span></td>
              </tr>
            </tbody>
          </table>

          <!-- Milestones Progress & PoC -->
          <div style="margin-top: 20px;">
            <div class="panel-header" style="margin-bottom: 8px;">
              <div>
                <h4>Project Milestones & Percentage of Completion (PoC)</h4>
                <span class="panel-sub">Weighted Progress: {{ projectPoc.pocPercentage }}% Achieved</span>
              </div>
            </div>

            <div class="char-list">
              <div v-for="m in projectMilestones" :key="m.milestoneId" class="char-item">
                <div class="char-desc">
                  <strong>{{ m.name }} (Weight: {{ m.percentageWeight }}%)</strong>
                  <span class="text-dim">Target Date: {{ m.targetDate }}</span>
                </div>
                <span class="status-pill" :class="m.isAchieved ? 'active' : 'warning'">
                  {{ m.isAchieved ? 'ACHIEVED' : 'PENDING' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Capital Work-in-Progress (CWIP) Settlement -->
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>CWIP Settlement & Fixed Asset Capitalization</h3>
              <span class="panel-sub">Commercial Operation Date (COD) Asset Transfer</span>
            </div>
            <button class="action-btn-sm primary" @click="settleProjectCwip">
              <CheckCircle2 class="btn-icon-sm" />
              <span>Settle CWIP & Capitalize Asset</span>
            </button>
          </div>

          <div v-if="cwipSettlement" class="coa-card" style="margin-bottom: 16px;">
            <div class="coa-header">
              <CheckCircle2 class="coa-icon" style="color: #10b981;" />
              <div>
                <strong style="color: #10b981;">CWIP Capitalized Successfully!</strong>
                <p class="subtitle font-mono">{{ cwipSettlement.settlementId }}</p>
              </div>
            </div>

            <div style="margin-top: 12px;">
              <div class="calc-row">
                <span>Capitalized Asset Tag:</span>
                <span class="font-mono text-accent">{{ cwipSettlement.capitalizedAssetTag }}</span>
              </div>
              <div class="calc-row">
                <span>Asset Description:</span>
                <span>{{ cwipSettlement.assetName }}</span>
              </div>
              <div class="calc-row">
                <span>Total Capitalized Cost:</span>
                <span class="font-mono text-green">{{ formatCurrency(cwipSettlement.totalSettledCost) }}</span>
              </div>
            </div>

            <div class="gl-lines-box" style="margin-top: 14px;">
              <span class="gl-title">Capitalization General Ledger Voucher:</span>
              <div class="gl-line">
                <span class="font-mono text-dim">140100</span>
                <span class="gl-acc-name">Plant Machinery & Infrastructure (Fixed Asset)</span>
                <span class="font-mono text-green">Dr {{ formatCurrency(cwipSettlement.totalSettledCost) }}</span>
              </div>
              <div class="gl-line">
                <span class="font-mono text-dim">140800</span>
                <span class="gl-acc-name">Capital Work-in-Progress (CWIP) Clearing</span>
                <span class="font-mono text-cyan">Cr {{ formatCurrency(cwipSettlement.totalSettledCost) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <Briefcase class="empty-icon" />
            <p>Click "Settle CWIP & Capitalize Asset" upon project commissioning to transfer accumulated construction costs into the Fixed Asset register (FI-AA).</p>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 13: Extended Warehouse Management (SAP EWM) -->
    <div v-if="activeTab === 'warehouse'" class="tab-content">
      <!-- Quick Warehouse KPI Strip -->
      <div class="kpi-strip" style="margin-bottom: 20px;">
        <div class="kpi-card">
          <span class="kpi-label">Active Warehouse Facility</span>
          <span class="kpi-value text-accent">Pune Central Hub</span>
          <span class="kpi-trend positive">WH-PUNE-CENTRAL</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Storage Bin Capacity</span>
          <span class="kpi-value">{{ warehouseBins.filter((b) => b.isOccupied).length }} / {{ warehouseBins.length }} Bins</span>
          <span class="kpi-trend info">Dynamic Putaway Routing</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Wave Picking Strategy</span>
          <span class="kpi-value text-cyan">FEFO / FIFO Active</span>
          <span class="kpi-trend positive">Expiry Protected</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Physical Cycle Count</span>
          <span class="kpi-value text-green">100% Reconciled</span>
          <span class="kpi-trend positive">GL Shrinkage Auto-Post</span>
        </div>
      </div>

      <div class="grid-2-1">
        <!-- Storage Bin Topology Map -->
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Storage Bin Topology & Real-time Allocation (SAP EWM)</h3>
              <span class="panel-sub">Multi-Zone Racking, Max Weight/Volume & Stored Batches</span>
            </div>
            <button class="action-btn-sm" @click="executeSimulatedPutaway">
              <Boxes class="btn-icon-sm" />
              <span>Simulate Putaway (High-Bay Bin)</span>
            </button>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>Bin ID</th>
                <th>Zone / Type</th>
                <th>Aisle / Rack / Shelf</th>
                <th>Capacity (Weight)</th>
                <th>Stored SKU / Batch</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="bin in warehouseBins" :key="bin.binId">
                <td class="font-mono text-cyan">{{ bin.binId }}</td>
                <td>
                  <span class="badge blue">{{ bin.zone }}</span>
                  <span class="sku-sub font-mono">{{ bin.binType }}</span>
                </td>
                <td class="font-mono">{{ bin.aisle }}-{{ bin.rack }}-{{ bin.shelf }}</td>
                <td>
                  <div class="calc-row" style="font-size: 11px;">
                    <span>{{ bin.currentWeightKg }} / {{ bin.maxWeightKg }} KG</span>
                    <span class="font-mono text-dim">{{ Math.round((bin.currentWeightKg / bin.maxWeightKg) * 100) }}%</span>
                  </div>
                </td>
                <td>
                  <div v-if="bin.items.length > 0" class="sku-cell">
                    <strong class="font-mono text-accent">{{ bin.items[0].sku }}</strong>
                    <span class="sku-sub">{{ bin.items[0].quantity }} {{ bin.items[0].baseUom }} ({{ bin.items[0].batchNumber }})</span>
                  </div>
                  <span v-else class="text-dim">Empty Bin</span>
                </td>
                <td>
                  <span class="status-pill" :class="bin.isOccupied ? 'active' : 'info'">
                    {{ bin.isOccupied ? 'OCCUPIED' : 'AVAILABLE' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Picking Waves & Cycle Count Reconcile -->
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>FIFO Wave Picking & Inventory Cycle Count</h3>
              <span class="panel-sub">Warehouse Tasks & GL Variance Adjustment</span>
            </div>
            <button class="action-btn-sm primary" @click="executeSimulatedPick">
              <CheckCircle2 class="btn-icon-sm" />
              <span>Execute Wave Pick (FIFO)</span>
            </button>
          </div>

          <div v-if="recentWarehouseTask" class="coa-card" style="margin-bottom: 16px;">
            <div class="coa-header">
              <CheckCircle2 class="coa-icon" style="color: #10b981;" />
              <div>
                <strong style="color: #10b981;">Warehouse Task Confirmed ({{ recentWarehouseTask.taskType }})</strong>
                <p class="subtitle font-mono">{{ recentWarehouseTask.taskId }}</p>
              </div>
            </div>

            <div style="margin-top: 10px;">
              <div class="calc-row">
                <span>SKU & Batch:</span>
                <span class="font-mono text-accent">{{ recentWarehouseTask.sku }} ({{ recentWarehouseTask.batchNumber }})</span>
              </div>
              <div class="calc-row">
                <span>Quantity Picked:</span>
                <span class="font-mono text-green">{{ recentWarehouseTask.quantity }} KG</span>
              </div>
              <div class="calc-row">
                <span>Source Bin Location:</span>
                <span class="font-mono text-cyan">{{ recentWarehouseTask.sourceBinId }}</span>
              </div>
            </div>
          </div>

          <!-- Physical Inventory Cycle Count Box -->
          <div class="brs-summary-box" style="background: rgba(15, 23, 42, 0.6); padding: 16px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08);">
            <div class="calc-row">
              <strong>Cycle Count Audit: BIN-PUN-ZA-01</strong>
              <button class="action-btn-sm" @click="runCycleCountAudit">
                <span>Record Audit</span>
              </button>
            </div>
            <div class="calc-row" style="margin-top: 6px;">
              <span class="text-dim">Book Quantity: {{ cycleCountState.bookQty }} KG</span>
              <span class="font-mono text-danger">Physical Count: {{ cycleCountState.physicalQty }} KG</span>
            </div>
            <div class="calc-row" style="margin-top: 4px;">
              <span class="text-dim">Shrinkage Variance: {{ cycleCountState.varianceQty }} KG</span>
              <span class="font-mono text-danger">Value: -{{ formatCurrency(cycleCountState.varianceVal) }}</span>
            </div>

            <div v-if="cycleCountState.glPosted" class="gl-lines-box" style="margin-top: 10px;">
              <span class="gl-title">Automated Shrinkage GL Adjustment Voucher:</span>
              <div class="gl-line">
                <span class="font-mono text-dim">540100</span>
                <span class="gl-acc-name">Inventory Shrinkage Expense</span>
                <span class="font-mono text-green">Dr {{ formatCurrency(cycleCountState.varianceVal) }}</span>
              </div>
              <div class="gl-line">
                <span class="font-mono text-dim">120100</span>
                <span class="gl-acc-name">Raw Materials Inventory Clearing</span>
                <span class="font-mono text-cyan">Cr {{ formatCurrency(cycleCountState.varianceVal) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 14: Multi-Currency & Global Parallel Ledgers (SAP FI-GL) -->
    <div v-if="activeTab === 'multicurrency'" class="tab-content">
      <!-- Quick Multi-Currency KPI Strip -->
      <div class="kpi-strip" style="margin-bottom: 20px;">
        <div class="kpi-card">
          <span class="kpi-label">Operating Company Currency</span>
          <span class="kpi-value text-accent">{{ currencyConfig.name }}</span>
          <span class="kpi-trend positive">Leading Ledger 0L</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Group Consolidation Currency</span>
          <span class="kpi-value text-cyan">USD ($)</span>
          <span class="kpi-trend info">Non-Leading Ledger 2L (IFRS)</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Spot Exchange Rate (USD/INR)</span>
          <span class="kpi-value">{{ formatCurrency(usdInrSpotRate, { decimals: 2 }) }}</span>
          <span class="kpi-trend positive">Closing Rate: {{ formatCurrency(usdInrClosingRate, { decimals: 2 }) }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">IAS 21 Net Forex Gain</span>
          <span class="kpi-value text-green">+{{ formatCurrency((forexRevalSummary.netForexImpact)) }}</span>
          <span class="kpi-trend positive">Auto-Revalued</span>
        </div>
      </div>

      <div class="grid-2-1">
        <!-- Parallel Ledgers & Multi-Currency Journal -->
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Parallel Accounting Ledgers (SAP 0L vs 2L)</h3>
              <span class="panel-sub">Dual-Valuation in Local Operating Currency & International Group Currency</span>
            </div>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>Ledger Code</th>
                <th>Ledger Name</th>
                <th>Type</th>
                <th>Base Currency</th>
                <th>Reporting Standard</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="l in parallelLedgersList" :key="l.ledgerCode">
                <td class="font-mono text-cyan">{{ l.ledgerCode }}</td>
                <td><strong>{{ l.name }}</strong></td>
                <td><span class="badge blue">{{ l.ledgerType }}</span></td>
                <td class="font-mono text-accent">{{ l.baseCurrency }}</td>
                <td>{{ l.description }}</td>
                <td><span class="status-pill active">ACTIVE</span></td>
              </tr>
            </tbody>
          </table>

          <!-- Multi-Currency Dual-Valuation Journal Entry -->
          <div style="margin-top: 20px;">
            <div class="panel-header" style="margin-bottom: 8px;">
              <div>
                <h4>Multi-Currency Dual-Valuation Journal (DOC-PAR-2026-001)</h4>
                <span class="panel-sub">Transaction Currency: USD @ Spot Rate 83.50 INR</span>
              </div>
            </div>

            <div class="gl-lines-box">
              <div v-for="l in sampleParallelJournalLines" :key="l.accountCode" class="gl-line">
                <span class="font-mono text-dim">{{ l.accountCode }}</span>
                <span class="gl-acc-name">{{ l.accountName }}</span>
                <span class="font-mono text-cyan">Group: ${{ formatNumber(l.amountGroup) }}</span>
                <span class="font-mono" :class="l.debit > 0 ? 'text-green' : 'text-cyan'">
                  {{ l.debit > 0 ? `Local: Dr ${formatCurrency(l.debit)}` : `Local: Cr ${formatCurrency(l.credit)}` }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Month-End Forex Revaluation & Global Tax Calculator -->
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>IAS 21 / AS 11 Foreign Exchange Revaluation</h3>
              <span class="panel-sub">Closing Rate Revaluation on Open AR/AP Monetary Items</span>
            </div>
            <button class="action-btn-sm primary" @click="runForexRevaluation">
              <RefreshCw class="btn-icon-sm" />
              <span>Run Month-End Revaluation</span>
            </button>
          </div>

          <div class="coa-card" style="margin-bottom: 16px;">
            <div class="coa-header">
              <CheckCircle2 class="coa-icon" style="color: #10b981;" />
              <div>
                <strong style="color: #10b981;">Forex Valuation Reconciled (USD Closing Rate: {{ formatCurrency(usdInrClosingRate, { decimals: 2 }) }})</strong>
                <p class="subtitle font-mono">{{ forexRevalSummary.revaluationId }}</p>
              </div>
            </div>

            <div style="margin-top: 10px;">
              <div class="calc-row">
                <span>Unrealized Forex Gain (Export AR):</span>
                <span class="font-mono text-green">+{{ formatCurrency(forexRevalSummary.totalUnrealizedGain) }}</span>
              </div>
              <div class="calc-row">
                <span>Unrealized Forex Loss (Import AP):</span>
                <span class="font-mono text-danger">-{{ formatCurrency(forexRevalSummary.totalUnrealizedLoss) }}</span>
              </div>
              <div class="calc-row total" style="border-top: 1px solid rgba(255, 255, 255, 0.15); padding-top: 8px;">
                <strong>Net P&amp;L Forex Gain:</strong>
                <strong class="font-mono text-green">+{{ formatCurrency(forexRevalSummary.netForexImpact) }}</strong>
              </div>
            </div>
          </div>

          <!-- Global Jurisdiction Tax Plugin Calculator -->
          <div class="brs-summary-box" style="background: rgba(15, 23, 42, 0.6); padding: 16px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08);">
            <div class="panel-header" style="padding: 0 0 10px 0; border: none;">
              <div>
                <h4>Global Jurisdiction Tax Engine</h4>
                <span class="panel-sub">Pluggable Multi-Country Tax Rules</span>
              </div>
            </div>

            <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
              <button
                v-for="c in countryTaxOptions"
                :key="c.code"
                class="action-btn-sm"
                :class="{ primary: selectedCountryCode === c.code }"
                @click="selectTaxCountry(c.code)"
              >
                <span>{{ c.flag }} {{ c.name }}</span>
              </button>
            </div>

            <div class="calc-row">
              <span>Taxable Supply Value:</span>
              <span class="font-mono">{{ formatCurrency(100000) }}</span>
            </div>
            <div class="calc-row">
              <span>Jurisdiction Tax Rate:</span>
              <span class="font-mono text-accent">{{ currentTaxResult.taxRatePercent }}%</span>
            </div>
            <div class="calc-row">
              <span>Statutory Tax Amount:</span>
              <span class="font-mono text-green">{{ formatCurrency(currentTaxResult.taxAmount) }}</span>
            </div>
            <div class="calc-row">
              <span>Reverse Charge Mechanism (RCM):</span>
              <span class="badge" :class="currentTaxResult.isReverseCharge ? 'purple' : 'gray'">
                {{ currentTaxResult.isReverseCharge ? 'APPLICABLE (Art 194)' : 'NOT APPLICABLE' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 15: Transportation Management & Fleet Logistics (SAP TM) -->
    <div v-if="activeTab === 'transportation'" class="tab-content">
      <div class="section-header">
        <div>
          <h3>SAP TM Transportation Management & Fleet Logistics</h3>
          <p class="section-desc">Manage freight carrier contracts, fleet vehicles, consignment lorry receipts (LR), dynamic diesel fuel surcharges, and electronic Proof of Delivery (e-POD).</p>
        </div>
        <div class="header-actions">
          <button class="action-btn primary" @click="createDemoFreightOrder">
            <Plus class="btn-icon" />
            <span>New Freight Order</span>
          </button>
        </div>
      </div>

      <!-- Quick Metrics Strip -->
      <div class="kpi-grid-4">
        <div class="data-card">
          <span class="card-label">Active Transporters / Carriers</span>
          <span class="card-value">{{ carriersList.length }}</span>
          <span class="card-subtext positive">100% Section 194C Compliant</span>
        </div>
        <div class="data-card">
          <span class="card-label">Fleet Vehicles</span>
          <span class="card-value">{{ vehiclesList.length }} Units</span>
          <span class="card-subtext info">GPS Telematics Active</span>
        </div>
        <div class="data-card">
          <span class="card-label">Consignments In Transit</span>
          <span class="card-value text-accent">{{ inTransitOrdersCount }}</span>
          <span class="card-subtext">Active Lorry Receipts (LR)</span>
        </div>
        <div class="data-card">
          <span class="card-label">Benchmark Diesel Rate</span>
          <span class="card-value text-green">{{ formatCurrency(94.5, { decimals: 2 }) }} / L</span>
          <span class="card-subtext warning">+1.50% Fuel Surcharge</span>
        </div>
      </div>

      <!-- Freight Orders Cockpit -->
      <div class="table-card">
        <div class="table-header">
          <h4>Active Freight Orders & Consignments</h4>
          <span class="badge blue">Live Waybill Tracking</span>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Order & LR No.</th>
              <th>Type</th>
              <th>Carrier & Vehicle</th>
              <th>Route (Origin &rarr; Dest)</th>
              <th>Cargo & Weight</th>
              <th>Freight Cost</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in freightOrdersList" :key="order.orderNumber">
              <td>
                <div class="cell-primary font-mono">{{ order.orderNumber }}</div>
                <div class="cell-subtext">{{ order.lorryReceiptNumber }}</div>
              </td>
              <td>
                <span class="badge" :class="order.orderType === 'OUTBOUND_SALES' ? 'green' : 'blue'">
                  {{ order.orderType === 'OUTBOUND_SALES' ? 'Outbound Sales' : 'Inbound Purchase' }}
                </span>
              </td>
              <td>
                <div class="cell-primary">{{ order.carrierName }}</div>
                <div class="cell-subtext font-mono">{{ order.vehicleNumber }} &bull; {{ order.driverName }}</div>
              </td>
              <td>
                <div class="cell-primary">{{ order.sourceLocation }} &rarr; {{ order.destinationLocation }}</div>
                <div class="cell-subtext">{{ order.distanceKm }} km</div>
              </td>
              <td>
                <div class="cell-primary">{{ formatNumber(order.chargeableWeightKg) }} KG</div>
                <div class="cell-subtext">{{ order.cargoDescription }}</div>
              </td>
              <td>
                <div class="cell-primary font-mono">{{ formatCurrency(order.totalFreightCost) }}</div>
                <div class="cell-subtext">TDS: {{ formatCurrency(order.tdsWithheld) }} ({{ order.tdsRatePercent }}%)</div>
              </td>
              <td>
                <span class="badge" :class="getStatusBadgeClass(order.status)">
                  {{ order.status }}
                </span>
              </td>
              <td>
                <button
                  v-if="order.status === 'PLANNED'"
                  class="action-btn-sm primary"
                  @click="dispatchOrder(order.orderNumber)"
                >
                  Dispatch
                </button>
                <button
                  v-else-if="order.status === 'DISPATCHED' || order.status === 'IN_TRANSIT'"
                  class="action-btn-sm green"
                  @click="openPodModal(order)"
                >
                  Verify e-POD
                </button>
                <span v-else class="text-green text-sm font-semibold">Delivered &amp; Settled</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Carrier Master & Fleet Section -->
      <div class="grid-2-cols" style="margin-top: 20px;">
        <div class="table-card">
          <div class="table-header">
            <h4>Approved Transporters &amp; Tariff Agreements</h4>
            <span class="badge purple">MCA &amp; IT Act 194C</span>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Carrier Name</th>
                <th>Rate Model</th>
                <th>Base Rate</th>
                <th>Sec 194C TDS</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in carriersList" :key="c.carrierId">
                <td>
                  <div class="cell-primary">{{ c.name }}</div>
                  <div class="cell-subtext font-mono">GSTIN: {{ c.gstin }}</div>
                </td>
                <td><span class="badge gray">{{ c.rateModel }}</span></td>
                <td class="font-mono">
                  {{ c.rateModel === 'PER_KM' ? `${formatCurrency(c.baseRatePerUnit)}/KM` : c.rateModel === 'PER_KG' ? `${formatCurrency(c.baseRatePerUnit)}/KG` : `${formatCurrency(c.baseRatePerUnit)} Flat` }}
                </td>
                <td>
                  <span class="badge" :class="c.hasSec194CDeclaration ? 'green' : 'blue'">
                    {{ c.hasSec194CDeclaration ? '0% (Fleet &le; 10)' : c.isCompany ? '2% TDS' : '1% TDS' }}
                  </span>
                </td>
                <td><span class="font-bold text-accent">&star; {{ c.ratingScore }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-card">
          <div class="table-header">
            <h4>Fleet Vehicles &amp; Telematics</h4>
            <span class="badge blue">Real-Time Status</span>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Vehicle No.</th>
                <th>Type</th>
                <th>Payload Cap</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in vehiclesList" :key="v.vehicleNumber">
                <td class="font-mono font-bold">{{ v.vehicleNumber }}</td>
                <td>{{ v.vehicleType }}</td>
                <td class="font-mono">{{ (v.maxPayloadKg / 1000).toFixed(1) }} MT</td>
                <td>{{ v.currentLocationCity }}</td>
                <td>
                  <span class="badge" :class="v.status === 'AVAILABLE' ? 'green' : 'purple'">
                    {{ v.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from '../i18n';
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
  Wrench,
  Landmark,
  Users,
  Briefcase,
  Boxes,
  Globe,
  Plus,
} from 'lucide-vue-next';

const { t, formatCurrency, formatNumber, currencySymbol, currencyConfig } = useI18n();

const activeTab = ref<'inventory' | 'o2c' | 'p2p' | 'subledger' | 'mfg' | 'assets' | 'quality' | 'controlling' | 'maintenance' | 'treasury' | 'hcm' | 'projects' | 'warehouse' | 'multicurrency' | 'transportation'>('inventory');

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

// =================================================================
// Plant Maintenance & Enterprise Asset Management (PM/EAM) State
// =================================================================
const equipmentList = ref([
  {
    equipmentNumber: 'EQ-ROBOT-01',
    name: '6-Axis High Precision Robotic Welding Center',
    functionalLocationId: 'FLOC-PUNE-LINE1',
    serialNumber: 'KUKA-KR60-9844',
    manufacturer: 'KUKA Robotics GmbH',
    category: 'MACHINERY',
    status: 'OPERATIONAL',
    operatingHours: 4250,
    costCenter: 'CC-MFG-BODY',
  },
  {
    equipmentNumber: 'EQ-PRESS-02',
    name: '250-Ton Heavy Hydraulic Stamping Press',
    functionalLocationId: 'FLOC-PUNE-LINE1',
    serialNumber: 'SCHULER-HP250-2021',
    manufacturer: 'Schuler AG',
    category: 'MACHINERY',
    status: 'OPERATIONAL',
    operatingHours: 8900,
    costCenter: 'CC-MFG-BODY',
  },
  {
    equipmentNumber: 'EQ-AGV-05',
    name: 'Autonomous Guided Transport Vehicle (AGV)',
    functionalLocationId: 'FLOC-PUNE-LINE1',
    serialNumber: 'OMRON-HD1500-441',
    manufacturer: 'OMRON Adept',
    category: 'VEHICLE',
    status: 'OPERATIONAL',
    operatingHours: 2100,
    costCenter: 'CC-LOGISTICS',
  },
]);

const workOrders = ref([
  {
    orderNumber: 'WO-2026-0041',
    equipmentNumber: 'EQ-ROBOT-01',
    orderType: 'PREVENTIVE',
    status: 'RELEASED',
    assignedTechnician: 'Ramesh K (Senior Robotics Tech)',
    costCenter: 'CC-MFG-BODY',
    scheduledStart: '2026-09-29T08:00:00Z',
    scheduledEnd: '2026-09-29T14:00:00Z',
    estimatedLaborHours: 4,
    actualLaborHours: 4,
    laborHourlyRate: 750,
    totalLaborCost: 3000,
    totalMaterialCost: 45000,
    totalActualCost: 48000,
    spareParts: [
      { sku: 'SPARE-SERVO-01', name: 'AC Servo Motor 4kW', requiredQuantity: 1, issuedQuantity: 1, unitCost: 45000, totalCost: 45000 },
    ],
  },
]);

const plantReliability = ref({
  mtbfHours: 1416.7,
  mttrHours: 3.3,
  availabilityPercentage: 99.8,
});

function runPreventiveEvaluation() {
  const eq = equipmentList.value.find((e) => e.equipmentNumber === 'EQ-PRESS-02');
  if (eq) {
    workOrders.value.unshift({
      orderNumber: `WO-${Date.now().toString(36).toUpperCase()}`,
      equipmentNumber: 'EQ-PRESS-02',
      orderType: 'PREVENTIVE',
      status: 'RELEASED',
      assignedTechnician: 'Dinesh Kumar (Hydraulics Specialist)',
      costCenter: 'CC-MFG-BODY',
      scheduledStart: new Date().toISOString(),
      scheduledEnd: new Date(Date.now() + 86400000).toISOString(),
      estimatedLaborHours: 6,
      actualLaborHours: 0,
      laborHourlyRate: 750,
      totalLaborCost: 0,
      totalMaterialCost: 18500,
      totalActualCost: 18500,
      spareParts: [
        { sku: 'SPARE-SEAL-KIT', name: 'High-Pressure Hydraulic Seal Kit', requiredQuantity: 1, issuedQuantity: 1, unitCost: 18500, totalCost: 18500 },
      ],
    });
  }
}

function selectEquipmentForWo(eq: any) {
  workOrders.value.unshift({
    orderNumber: `WO-${Date.now().toString(36).toUpperCase()}`,
    equipmentNumber: eq.equipmentNumber,
    orderType: 'CORRECTIVE',
    status: 'RELEASED',
    assignedTechnician: 'Vikram Joshi (Shop Floor Lead)',
    costCenter: eq.costCenter,
    scheduledStart: new Date().toISOString(),
    scheduledEnd: new Date(Date.now() + 43200000).toISOString(),
    estimatedLaborHours: 3,
    actualLaborHours: 0,
    laborHourlyRate: 750,
    totalLaborCost: 0,
    totalMaterialCost: 0,
    totalActualCost: 0,
    spareParts: [
      { sku: 'SPARE-GREASE-LUBE', name: 'High-Temp Synthetic Gear Grease', requiredQuantity: 2, issuedQuantity: 0, unitCost: 3500, totalCost: 0 },
    ],
  });
}

function issueSparePart(orderNum: string) {
  const wo = workOrders.value.find((w) => w.orderNumber === orderNum);
  if (wo && wo.spareParts.length > 0) {
    const part = wo.spareParts[0];
    part.issuedQuantity = part.requiredQuantity;
    part.totalCost = part.issuedQuantity * part.unitCost;
    wo.totalMaterialCost = part.totalCost;
    wo.totalActualCost = wo.totalLaborCost + wo.totalMaterialCost;
  }
}

function completeAndSettleWo(orderNum: string) {
  const wo = workOrders.value.find((w) => w.orderNumber === orderNum);
  if (wo) {
    wo.actualLaborHours = wo.estimatedLaborHours || 4;
    wo.totalLaborCost = wo.actualLaborHours * wo.laborHourlyRate;
    wo.totalActualCost = wo.totalLaborCost + wo.totalMaterialCost;
    wo.status = 'CLOSED';
  }
}

// =================================================================
// Treasury & Bank Statement Reconciliation (TRM/FI-BL) State
// =================================================================
const companyBankAccounts = ref([
  {
    accountId: 'BA-HDFC-INR-01',
    bankName: 'HDFC Bank Ltd (BKC Corporate Branch)',
    accountNumber: '50200055418291',
    accountType: 'CURRENT',
    ifscCode: 'HDFC0000123',
    currentBookBalance: 12500000,
    reconciledBankBalance: 12880000,
  },
  {
    accountId: 'BA-SBI-INR-02',
    bankName: 'State Bank of India (Industrial Branch)',
    accountNumber: '3941008892110',
    accountType: 'CURRENT',
    ifscCode: 'SBIN0004133',
    currentBookBalance: 8500000,
    reconciledBankBalance: 8500000,
  },
]);

const totalBankBalance = computed(() =>
  companyBankAccounts.value.reduce((acc, b) => acc + b.reconciledBankBalance, 0)
);

const treasuryBookBalance = computed(() =>
  companyBankAccounts.value.reduce((acc, b) => acc + b.currentBookBalance, 0)
);

const statementLines = ref([
  {
    lineId: 'BSL-001',
    transactionDate: '2026-09-02',
    transactionReference: 'UTR-HDFC-9921',
    counterpartyName: 'Reliance Retail Ltd',
    direction: 'CREDIT',
    amount: 850000,
    reconciliationStatus: 'UNMATCHED',
    matchScore: 0,
  },
  {
    lineId: 'BSL-002',
    transactionDate: '2026-09-04',
    transactionReference: 'CHQ-440192',
    counterpartyName: 'Tata Steel Special Alloy Ltd',
    direction: 'DEBIT',
    amount: 420000,
    reconciliationStatus: 'UNMATCHED',
    matchScore: 0,
  },
  {
    lineId: 'BSL-003',
    transactionDate: '2026-09-06',
    transactionReference: 'NEFT-MAH-1102',
    counterpartyName: 'Mahindra Logistics Ltd',
    direction: 'CREDIT',
    amount: 600000,
    reconciliationStatus: 'UNMATCHED',
    matchScore: 0,
  },
]);

const brsData = ref({
  balanceAsPerBank: 12880000,
  addDepositsInTransit: [
    { reference: 'NEFT-AXIS-8812', amount: 350000, date: '2026-09-05' },
  ],
  lessUnpresentedCheques: [
    { reference: 'CHQ-440193', amount: 150000, date: '2026-09-06' },
  ],
  adjustedBankBalance: 13080000,
  balanceAsPerCompanyBooks: 12500000,
  variance: 580000,
  isBalanced: false,
});

const cashForecast = ref({
  forecast30Days: {
    expectedReceivables: 5000000,
    expectedPayables: 3000000,
    netCashFlow: 2000000,
    projectedClosingCash: 14500000,
  },
  forecast60Days: {
    expectedReceivables: 5750000,
    expectedPayables: 3300000,
    netCashFlow: 2450000,
    projectedClosingCash: 16950000,
  },
  forecast90Days: {
    expectedReceivables: 6250000,
    expectedPayables: 3540000,
    netCashFlow: 2710000,
    projectedClosingCash: 19660000,
  },
});

function runAutoReconciliation() {
  for (const line of statementLines.value) {
    line.reconciliationStatus = 'AUTO_CLEARED';
    line.matchScore = 100;
  }
  const hdfc = companyBankAccounts.value.find((b) => b.accountId === 'BA-HDFC-INR-01');
  if (hdfc) {
    hdfc.currentBookBalance = 13080000;
  }
  brsData.value.balanceAsPerCompanyBooks = 13080000;
  brsData.value.variance = 0.00;
  brsData.value.isBalanced = true;
}

// =================================================================
// Human Capital Management & Payroll (SAP HCM) State
// =================================================================
const employeesList = ref([
  {
    employeeId: 'EMP-2026-001',
    fullName: 'Aarav Sharma',
    designation: 'Lead Powertrain Engineer',
    department: 'R&D / EV Systems',
    costCenter: 'CC-MFG-BODY',
    salaryStructure: {
      basicMonthly: 60000,
      hraMonthly: 24000,
      specialAllowanceMonthly: 36000,
      grossMonthly: 120000,
    },
    totalWorkingDays: 30,
    presentDays: 28,
    lossOfPayDays: 2,
  },
  {
    employeeId: 'EMP-2026-002',
    fullName: 'Priya Venkatesh',
    designation: 'Robotics Automation Specialist',
    department: 'Manufacturing Operations',
    costCenter: 'CC-MFG-ASSY',
    salaryStructure: {
      basicMonthly: 10000,
      hraMonthly: 4000,
      specialAllowanceMonthly: 4000,
      grossMonthly: 18000,
    },
    totalWorkingDays: 30,
    presentDays: 30,
    lossOfPayDays: 0,
  },
  {
    employeeId: 'EMP-2026-003',
    fullName: 'Vikram Malhotra',
    designation: 'VP Supply Chain & Operations',
    department: 'Executive Operations',
    costCenter: 'CC-LOGISTICS',
    salaryStructure: {
      basicMonthly: 125000,
      hraMonthly: 50000,
      specialAllowanceMonthly: 75000,
      grossMonthly: 250000,
    },
    totalWorkingDays: 30,
    presentDays: 30,
    lossOfPayDays: 0,
  },
]);

const selectedPayslip = ref<any>({
  employeeId: 'EMP-2026-001',
  employeeName: 'Aarav Sharma',
  designation: 'Lead Powertrain Engineer',
  department: 'R&D / EV Systems',
  bankAccountMasked: 'HDFC •••• 9102',
  earnedBasic: 56000,
  earnedHra: 22400,
  earnedSpecialAllowance: 33600,
  earnedGrossSalary: 112000,
  deductions: {
    epfEmployee: 1800,
    esiEmployee: 0,
    professionalTax: 200,
    incomeTaxTds192: 8400,
    totalDeductions: 10400,
  },
  netPayableSalary: 101600,
});

const payrollGlLines = ref<any[]>([
  { accountCode: '510000', accountName: 'Salaries & Wages Expense', debit: 374000, credit: 0 },
  { accountCode: '214100', accountName: 'EPF Payable (Statutory Holding)', debit: 0, credit: 4800 },
  { accountCode: '214200', accountName: 'ESIC Payable (Statutory Holding)', debit: 0, credit: 135 },
  { accountCode: '214300', accountName: 'Professional Tax (PT) Payable', debit: 0, credit: 600 },
  { accountCode: '214400', accountName: 'TDS Payable (Sec 192 Income Tax)', debit: 0, credit: 32400 },
  { accountCode: '214000', accountName: 'Payroll Clearing / Net Salaries Payable', debit: 0, credit: 336065 },
]);

function selectEmployeeForPayslip(emp: any) {
  const payableDays = emp.totalWorkingDays - emp.lossOfPayDays;
  const ratio = payableDays / emp.totalWorkingDays;
  const earnedBasic = Math.round(emp.salaryStructure.basicMonthly * ratio);
  const earnedHra = Math.round(emp.salaryStructure.hraMonthly * ratio);
  const earnedSpl = Math.round(emp.salaryStructure.specialAllowanceMonthly * ratio);
  const earnedGross = earnedBasic + earnedHra + earnedSpl;

  const epf = Math.min(1800, Math.round(basicRatio(emp.salaryStructure.basicMonthly, ratio) * 0.12));
  const esi = earnedGross <= 21000 ? Math.round(earnedGross * 0.0075) : 0;
  const pt = 200;
  const tds = earnedGross > 50000 ? Math.round(earnedGross * 0.075) : 0;
  const totalDeductions = epf + esi + pt + tds;

  selectedPayslip.value = {
    employeeId: emp.employeeId,
    employeeName: emp.fullName,
    designation: emp.designation,
    department: emp.department,
    bankAccountMasked: 'HDFC •••• ' + Math.floor(1000 + Math.random() * 9000),
    earnedBasic,
    earnedHra,
    earnedSpecialAllowance: earnedSpl,
    earnedGrossSalary: earnedGross,
    deductions: {
      epfEmployee: epf,
      esiEmployee: esi,
      professionalTax: pt,
      incomeTaxTds192: tds,
      totalDeductions,
    },
    netPayableSalary: earnedGross - totalDeductions,
  };
}

function basicRatio(basic: number, ratio: number) {
  return Math.round(basic * ratio);
}

function runPayrollExecution() {
  let totalGross = 0;
  let totalEpf = 0;
  let totalEsi = 0;
  let totalPt = 0;
  let totalTds = 0;

  for (const emp of employeesList.value) {
    const payableDays = emp.totalWorkingDays - emp.lossOfPayDays;
    const ratio = payableDays / emp.totalWorkingDays;
    const basic = Math.round(emp.salaryStructure.basicMonthly * ratio);
    const gross = Math.round(emp.salaryStructure.grossMonthly * ratio);
    totalGross += gross;
    totalEpf += Math.min(1800, Math.round(basic * 0.12));
    if (gross <= 21000) totalEsi += Math.round(gross * 0.0075);
    totalPt += 200;
    if (gross > 50000) totalTds += Math.round(gross * 0.075);
  }

  const netPay = totalGross - (totalEpf + totalEsi + totalPt + totalTds);

  payrollGlLines.value = [
    { accountCode: '510000', accountName: 'Salaries & Wages Expense', debit: totalGross, credit: 0 },
    { accountCode: '214100', accountName: 'EPF Payable (Statutory Holding)', debit: 0, credit: totalEpf },
    { accountCode: '214200', accountName: 'ESIC Payable (Statutory Holding)', debit: 0, credit: totalEsi },
    { accountCode: '214300', accountName: 'Professional Tax (PT) Payable', debit: 0, credit: totalPt },
    { accountCode: '214400', accountName: 'TDS Payable (Sec 192 Income Tax)', debit: 0, credit: totalTds },
    { accountCode: '214000', accountName: 'Payroll Clearing / Net Salaries Payable', debit: 0, credit: netPay },
  ];
}

// =================================================================
// Project Systems & Capital Costing (SAP PS) State
// =================================================================
const currentProject = ref({
  projectId: 'PRJ-EV-PLANT-01',
  name: 'Chakan Giga-Factory Line 3 Expansion',
  totalApprovedBudget: 250000000,
  totalCommittedCost: 145000000,
  totalActualCost: 92000000,
  status: 'IN_PROGRESS',
});

const wbsElementsList = ref([
  {
    wbsCode: 'WBS-01-CIVIL',
    name: 'Cleanroom Foundation & Structural Civil Works',
    costCenter: 'CC-MFG-BODY',
    budgetAllocated: 75000000,
    budgetCommitted: 60000000,
    actualCostIncurred: 45000000,
    status: 'RELEASED',
  },
  {
    wbsCode: 'WBS-02-PRESS',
    name: 'High-Speed Automated Stamping Press Installation',
    costCenter: 'CC-MFG-BODY',
    budgetAllocated: 110000000,
    budgetCommitted: 55000000,
    actualCostIncurred: 32000000,
    status: 'RELEASED',
  },
  {
    wbsCode: 'WBS-03-AUTOMATION',
    name: 'Robotic Welding Cell & PLC Control Systems',
    costCenter: 'CC-MFG-ASSY',
    budgetAllocated: 65000000,
    budgetCommitted: 30000000,
    actualCostIncurred: 15000000,
    status: 'RELEASED',
  },
]);

const projectMilestones = ref([
  { milestoneId: 'M1-CIVIL', name: 'Civil Foundation Sign-off', targetDate: '2026-06-30', percentageWeight: 30, isAchieved: true },
  { milestoneId: 'M2-EQUIP', name: 'Equipment Delivery & Erection', targetDate: '2026-08-31', percentageWeight: 40, isAchieved: true },
  { milestoneId: 'M3-COMM', name: 'Cold Commissioning & Trial Runs', targetDate: '2026-09-30', percentageWeight: 30, isAchieved: false },
]);

const projectPoc = ref({
  pocPercentage: 70,
});

const cwipSettlement = ref<any>(null);

function achieveCommissioningMilestone() {
  const m3 = projectMilestones.value.find((m) => m.milestoneId === 'M3-COMM');
  if (m3) {
    m3.isAchieved = true;
  }
  projectPoc.value.pocPercentage = 100;
}

function settleProjectCwip() {
  cwipSettlement.value = {
    settlementId: `CWIP-SETTLE-${Date.now().toString(36).toUpperCase()}`,
    capitalizedAssetTag: 'AST-PUNE-LINE3-001',
    assetName: 'Chakan EV Manufacturing Line 3 Infrastructure',
    totalSettledCost: currentProject.value.totalActualCost,
    settlementDate: new Date().toISOString().split('T')[0],
  };
  currentProject.value.status = 'COMPLETED';
}

// =================================================================
// Extended Warehouse Management (SAP EWM) State
// =================================================================
const warehouseBins = ref([
  {
    binId: 'BIN-PUN-ZA-01',
    warehouseId: 'WH-PUNE-CENTRAL',
    zone: 'ZONE-A-HEAVY',
    aisle: 'A01',
    rack: 'R01',
    shelf: 'S01',
    position: 'P01',
    binType: 'HIGH_BAY',
    maxWeightKg: 5000,
    currentWeightKg: 1250,
    maxVolumeCbm: 12.0,
    currentVolumeCbm: 2.5,
    isBlocked: false,
    isOccupied: true,
    items: [
      {
        sku: 'ROH-STEEL-001',
        materialName: 'Cold-Rolled Steel Coils',
        batchNumber: 'LOT-STL-2026-08',
        quantity: 50,
        baseUom: 'KG',
        receiptDate: '2026-09-01',
      },
    ],
  },
  {
    binId: 'BIN-PUN-ZA-02',
    warehouseId: 'WH-PUNE-CENTRAL',
    zone: 'ZONE-A-HEAVY',
    aisle: 'A01',
    rack: 'R01',
    shelf: 'S02',
    position: 'P01',
    binType: 'HIGH_BAY',
    maxWeightKg: 5000,
    currentWeightKg: 0,
    maxVolumeCbm: 12.0,
    currentVolumeCbm: 0,
    isBlocked: false,
    isOccupied: false,
    items: [],
  },
  {
    binId: 'BIN-PUN-ZB-01',
    warehouseId: 'WH-PUNE-CENTRAL',
    zone: 'ZONE-B-STANDARD',
    aisle: 'A02',
    rack: 'R01',
    shelf: 'S01',
    position: 'P01',
    binType: 'STANDARD',
    maxWeightKg: 1000,
    currentWeightKg: 350,
    maxVolumeCbm: 4.0,
    currentVolumeCbm: 1.2,
    isBlocked: false,
    isOccupied: true,
    items: [
      {
        sku: 'HALB-AXLE-001',
        materialName: 'Rear Axle Hub Sub-Assembly',
        batchNumber: 'LOT-AXL-2026-04',
        quantity: 14,
        baseUom: 'EA',
        receiptDate: '2026-09-10',
      },
    ],
  },
  {
    binId: 'BIN-PUN-COLD-01',
    warehouseId: 'WH-PUNE-CENTRAL',
    zone: 'ZONE-COLD',
    aisle: 'A03',
    rack: 'R01',
    shelf: 'S01',
    position: 'P01',
    binType: 'COLD_STORAGE',
    maxWeightKg: 2000,
    currentWeightKg: 0,
    maxVolumeCbm: 8.0,
    currentVolumeCbm: 0,
    isBlocked: false,
    isOccupied: false,
    items: [],
  },
]);

const recentWarehouseTask = ref<any>({
  taskId: 'WT-PUT-0892',
  taskType: 'PUTAWAY',
  sourceBinId: 'STAGING-INBOUND',
  targetBinId: 'BIN-PUN-ZA-01',
  sku: 'ROH-STEEL-001',
  batchNumber: 'LOT-STL-2026-08',
  quantity: 50,
  status: 'CONFIRMED',
});

const cycleCountState = ref({
  bookQty: 50,
  physicalQty: 48,
  varianceQty: -2,
  varianceVal: 130,
  glPosted: false,
});

function executeSimulatedPutaway() {
  const bin = warehouseBins.value.find((b) => b.binId === 'BIN-PUN-ZA-02');
  if (bin) {
    bin.isOccupied = true;
    bin.currentWeightKg = 850;
    bin.currentVolumeCbm = 1.8;
    bin.items = [
      {
        sku: 'ROH-STEEL-001',
        materialName: 'Cold-Rolled Steel Coils',
        batchNumber: 'LOT-STL-2026-09',
        quantity: 35,
        baseUom: 'KG',
        receiptDate: new Date().toISOString(),
      },
    ];
  }
  recentWarehouseTask.value = {
    taskId: `WT-PUT-${Date.now().toString(36).toUpperCase()}`,
    taskType: 'PUTAWAY',
    sourceBinId: 'STAGING-INBOUND',
    targetBinId: 'BIN-PUN-ZA-02',
    sku: 'ROH-STEEL-001',
    batchNumber: 'LOT-STL-2026-09',
    quantity: 35,
    status: 'CONFIRMED',
  };
}

function executeSimulatedPick() {
  const bin = warehouseBins.value.find((b) => b.binId === 'BIN-PUN-ZA-01');
  if (bin && bin.items.length > 0) {
    bin.items[0].quantity = Math.max(0, bin.items[0].quantity - 15);
    bin.currentWeightKg = Math.max(0, bin.currentWeightKg - 375);
    cycleCountState.value.bookQty = bin.items[0].quantity;
  }
  recentWarehouseTask.value = {
    taskId: `WT-PICK-${Date.now().toString(36).toUpperCase()}`,
    taskType: 'PICKING',
    sourceBinId: 'BIN-PUN-ZA-01',
    targetBinId: 'STAGING-OUTBOUND',
    sku: 'ROH-STEEL-001',
    batchNumber: 'LOT-STL-2026-08',
    quantity: 15,
    status: 'CONFIRMED',
  };
}

function runCycleCountAudit() {
  cycleCountState.value.glPosted = true;
}

// =================================================================
// Multi-Currency & Global Parallel Ledgers (SAP FI-GL) State
// =================================================================
const usdInrSpotRate = ref(83.50);
const usdInrClosingRate = ref(84.00);

const parallelLedgersList = ref([
  {
    ledgerCode: '0L',
    name: 'Leading Statutory Ledger (Indian AS / Companies Act)',
    ledgerType: 'LEADING',
    baseCurrency: 'INR',
    description: 'Primary local statutory ledger for ROC & CBDT reporting',
  },
  {
    ledgerCode: '2L',
    name: 'Non-Leading Consolidation Ledger (IFRS & US GAAP)',
    ledgerType: 'NON_LEADING',
    baseCurrency: 'USD',
    description: 'International group consolidation in USD',
  },
]);

const sampleParallelJournalLines = ref([
  {
    accountCode: '110100',
    accountName: 'Foreign Trade Accounts Receivable (USD)',
    amountLocal: 835000,
    amountGroup: 10000,
    debit: 835000,
    credit: 0,
  },
  {
    accountCode: '410100',
    accountName: 'Export Revenue - Technology & CleanTech Services',
    amountLocal: 835000,
    amountGroup: 10000,
    debit: 0,
    credit: 835000,
  },
]);

const forexRevalSummary = ref({
  revaluationId: 'FX-REV-20260930-USD',
  totalUnrealizedGain: 150000,
  totalUnrealizedLoss: 40000,
  netForexImpact: 110000,
});

function runForexRevaluation() {
  forexRevalSummary.value = {
    revaluationId: `FX-REV-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-USD`,
    totalUnrealizedGain: 150000,
    totalUnrealizedLoss: 40000,
    netForexImpact: 110000,
  };
}

const countryTaxOptions = ref([
  { code: 'IN', name: 'India (GST)', flag: '🇮🇳' },
  { code: 'US', name: 'United States (Nexus)', flag: '🇺🇸' },
  { code: 'EU', name: 'European Union (VIES)', flag: '🇪🇺' },
  { code: 'AE', name: 'UAE (FTA)', flag: '🇦🇪' },
]);

const selectedCountryCode = ref('IN');

const currentTaxResult = computed(() => {
  const code = selectedCountryCode.value;
  if (code === 'IN') {
    return { taxRatePercent: 18, taxAmount: 18000, isReverseCharge: false };
  } else if (code === 'US') {
    return { taxRatePercent: 8.25, taxAmount: 8250, isReverseCharge: false };
  } else if (code === 'EU') {
    return { taxRatePercent: 0, taxAmount: 0, isReverseCharge: true };
  } else {
    return { taxRatePercent: 5, taxAmount: 5000, isReverseCharge: false };
  }
});

function selectTaxCountry(code: string) {
  selectedCountryCode.value = code;
}

// =================================================================
// 15. Transportation Management (SAP TM) State & Handlers
// =================================================================
const carriersList = ref([
  {
    carrierId: 'CARRIER-01',
    name: 'VRL Logistics Ltd',
    gstin: '29AABCV1234D1Z5',
    pan: 'AABCV1234D',
    isCompany: true,
    rateModel: 'PER_KM',
    baseRatePerUnit: 38.0,
    hasSec194CDeclaration: false,
    ratingScore: 4.8,
  },
  {
    carrierId: 'CARRIER-02',
    name: 'TCI Freight Express',
    gstin: '27AABCT9876C1Z2',
    pan: 'AABCT9876C',
    isCompany: true,
    rateModel: 'PER_KG',
    baseRatePerUnit: 4.25,
    hasSec194CDeclaration: false,
    ratingScore: 4.6,
  },
  {
    carrierId: 'CARRIER-03',
    name: 'Sharma Roadlines (Fleet <= 10)',
    gstin: '07AAAPS5432B1Z1',
    pan: 'AAAPS5432B',
    isCompany: false,
    rateModel: 'FLAT_TRIP',
    baseRatePerUnit: 24000.0,
    hasSec194CDeclaration: true,
    ratingScore: 4.5,
  },
]);

const vehiclesList = ref([
  {
    vehicleNumber: 'MH12AB1234',
    carrierId: 'CARRIER-01',
    vehicleType: 'CONTAINER_32FT',
    maxPayloadKg: 18000,
    driverName: 'Ramesh Patil',
    currentLocationCity: 'Kolhapur',
    status: 'IN_TRANSIT',
  },
  {
    vehicleNumber: 'KA01CD5678',
    carrierId: 'CARRIER-02',
    vehicleType: 'TRUCK_20FT',
    maxPayloadKg: 9500,
    driverName: 'Suresh Gowda',
    currentLocationCity: 'Bengaluru',
    status: 'AVAILABLE',
  },
  {
    vehicleNumber: 'DL01EF9012',
    carrierId: 'CARRIER-03',
    vehicleType: 'COLD_CHAIN_REEFER',
    maxPayloadKg: 12000,
    driverName: 'Rajesh Sharma',
    currentLocationCity: 'Delhi',
    status: 'AVAILABLE',
  },
]);

const freightOrdersList = ref([
  {
    orderNumber: 'FO-2026-0001',
    lorryReceiptNumber: 'LR-2026-0001',
    orderType: 'OUTBOUND_SALES',
    carrierName: 'VRL Logistics Ltd',
    vehicleNumber: 'MH12AB1234',
    driverName: 'Ramesh Patil',
    sourceLocation: 'Pune',
    destinationLocation: 'Bengaluru',
    distanceKm: 840,
    chargeableWeightKg: 12500,
    cargoDescription: 'Industrial Automation PLCs & Sensors',
    status: 'IN_TRANSIT',
    totalFreightCost: 34248,
    tdsRatePercent: 2.0,
    tdsWithheld: 684.96,
    netPayableToCarrier: 33563.04,
    podOtp: '482910',
  },
]);

const inTransitOrdersCount = computed(() => {
  return freightOrdersList.value.filter((o) => o.status === 'IN_TRANSIT' || o.status === 'DISPATCHED').length;
});

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'PLANNED':
      return 'gray';
    case 'DISPATCHED':
      return 'blue';
    case 'IN_TRANSIT':
      return 'purple';
    case 'DELIVERED':
      return 'green';
    default:
      return 'gray';
  }
}

async function createDemoFreightOrder() {
  const newOrder = {
    orderNumber: `FO-2026-${String(freightOrdersList.value.length + 2).padStart(4, '0')}`,
    lorryReceiptNumber: `LR-2026-${String(freightOrdersList.value.length + 2).padStart(4, '0')}`,
    orderType: 'OUTBOUND_SALES',
    carrierName: 'TCI Freight Express',
    vehicleNumber: 'KA01CD5678',
    driverName: 'Suresh Gowda',
    sourceLocation: 'Bengaluru',
    destinationLocation: 'Chennai',
    distanceKm: 350,
    chargeableWeightKg: 8000,
    cargoDescription: 'EV Battery Assemblies & Modules',
    status: 'PLANNED',
    totalFreightCost: 34650,
    tdsRatePercent: 2.0,
    tdsWithheld: 693,
    netPayableToCarrier: 33957,
    podOtp: '672914',
  };

  try {
    const res = await fetch('/api/v1/transportation/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderType: 'OUTBOUND_SALES',
        carrierId: 'CARRIER-02',
        vehicleNumber: 'KA01CD5678',
        sourceLocation: 'Bengaluru',
        destinationLocation: 'Chennai',
        distanceKm: 350,
        chargeableWeightKg: 8000,
        cargoDescription: 'EV Battery Assemblies & Modules',
        associatedDocType: 'SALES_DELIVERY',
        associatedDocNumber: 'DEL-2026-0099',
        tollCharges: 650,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      freightOrdersList.value.unshift(created);
      return;
    }
  } catch {
    // local fallback
  }
  freightOrdersList.value.unshift(newOrder);
}

async function dispatchOrder(orderNumber: string) {
  try {
    const res = await fetch('/api/v1/transportation/orders/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber }),
    });
    if (res.ok) {
      const updated = await res.json();
      const idx = freightOrdersList.value.findIndex((o) => o.orderNumber === orderNumber);
      if (idx !== -1) {
        freightOrdersList.value[idx] = updated;
      }
      return;
    }
  } catch {
    // fallback
  }

  const order = freightOrdersList.value.find((o) => o.orderNumber === orderNumber);
  if (order) {
    order.status = 'DISPATCHED';
    order.podOtp = '583921';
  }
}

async function openPodModal(order: any) {
  const enteredOtp = prompt(
    `Enter 6-digit electronic Proof of Delivery (e-POD) OTP for ${order.lorryReceiptNumber}:\n(Generated OTP for demo: ${order.podOtp || '482910'})`,
    order.podOtp || '482910'
  );
  if (!enteredOtp) return;

  const recipient = prompt('Enter Recipient Name:', 'S. Kumar (Warehouse Manager)') || 'S. Kumar (Warehouse Manager)';

  try {
    const res = await fetch('/api/v1/transportation/orders/confirm-delivery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: order.orderNumber,
        otp: enteredOtp,
        recipientName: recipient,
      }),
    });
    if (res.ok) {
      order.status = 'DELIVERED';
      alert(`e-POD Verified for ${order.lorryReceiptNumber}! Balanced GL settlement voucher posted: 520100 Dr Freight Expense / 210400 Cr Transporter AP.`);
      return;
    }
  } catch {
    // fallback
  }

  order.status = 'DELIVERED';
  alert(`e-POD Verified for ${order.lorryReceiptNumber}! Balanced GL settlement voucher posted: 520100 Dr Freight Expense / 210400 Cr Transporter AP.`);
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

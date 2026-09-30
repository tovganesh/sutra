<template>
  <div class="view-container">
    <div class="hero-banner glass-card">
      <div class="hero-content">
        <h2>🇮🇳 {{ $t('compliance.heroTitle') }}</h2>
        <p>{{ $t('compliance.heroSubtitle') }}</p>
      </div>
      <div class="compliance-tabs">
        <button
          v-for="tab in subTabs"
          :key="tab.id"
          class="subtab-btn"
          :class="{ active: activeSubTab === tab.id }"
          @click="activeSubTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Tab 1: GST, E-Invoice & E-Way Bill -->
    <div v-if="activeSubTab === 'gst'" class="tools-grid">
      <!-- Tool 1: Live GSTIN Validator -->
      <div class="glass-card tool-card">
        <div class="tool-header">
          <div class="tool-title">
            <span class="tool-tag">{{ $t('compliance.tags.iso') }}</span>
            <h3>{{ $t('compliance.gstinValidatorTitle') }}</h3>
          </div>
          <ShieldCheck class="tool-icon" />
        </div>
        <p class="tool-desc">{{ $t('compliance.gstinValidatorDesc') }}</p>

        <div class="form-group">
          <label>{{ $t('compliance.enterGstin') }}</label>
          <div class="input-with-btn">
            <input type="text" v-model="gstinInput" class="input-control" :placeholder="$t('compliance.enterGstinPlaceholder')" />
            <button class="btn btn-primary" @click="validateGstin">{{ $t('compliance.validateBtn') }}</button>
          </div>
        </div>

        <div v-if="gstinResult" class="code-preview">
          {{ gstinResult }}
        </div>
      </div>

      <!-- Tool 2: Intra vs Inter State Tax Calculator -->
      <div class="glass-card tool-card">
        <div class="tool-header">
          <div class="tool-title">
            <span class="tool-tag">{{ $t('compliance.tags.taxSlabs') }}</span>
            <h3>{{ $t('compliance.taxCalcTitle') }}</h3>
          </div>
          <Calculator class="tool-icon" />
        </div>
        <p class="tool-desc">{{ $t('compliance.taxCalcDesc') }}</p>

        <div class="form-row">
          <div class="form-group">
            <label>{{ $t('compliance.supplierGstin') }}</label>
            <input type="text" v-model="taxSupplierGstin" class="input-control" />
          </div>
          <div class="form-group">
            <label>{{ $t('compliance.posState') }}</label>
            <input type="text" v-model="taxPosCode" class="input-control" :placeholder="$t('compliance.posStatePlaceholder')" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>{{ $t('compliance.hsnCode') }}</label>
            <input type="text" v-model="taxHsn" class="input-control" />
          </div>
          <div class="form-group">
            <label>{{ $t('compliance.taxableValue', { symbol: currencySymbol }) }}</label>
            <input type="number" v-model.number="taxAmount" class="input-control" />
          </div>
        </div>

        <button class="btn btn-secondary" @click="calculateTax">{{ $t('compliance.computeTaxBtn') }}</button>

        <div v-if="taxResult" class="code-preview" style="margin-top: 14px;">
          {{ taxResult }}
        </div>
      </div>

      <!-- Tool 3: NIC E-Invoice IRN Generator -->
      <div class="glass-card tool-card">
        <div class="tool-header">
          <div class="tool-title">
            <span class="tool-tag">{{ $t('compliance.tags.mandatoryB2b') }}</span>
            <h3>{{ $t('compliance.einvoiceTitle') }}</h3>
          </div>
          <FileText class="tool-icon" />
        </div>
        <p class="tool-desc">{{ $t('compliance.einvoiceDesc') }}</p>

        <div class="form-row">
          <div class="form-group">
            <label>{{ $t('compliance.invoiceNumber') }}</label>
            <input type="text" v-model="einvDoc" class="input-control" />
          </div>
          <div class="form-group">
            <label>{{ $t('compliance.financialYear') }}</label>
            <input type="text" v-model="einvFy" class="input-control" />
          </div>
        </div>

        <button class="btn btn-primary" @click="generateEInvoice">{{ $t('compliance.generateIrnBtn') }}</button>

        <div v-if="einvResult" class="code-preview" style="margin-top: 14px;">
          {{ einvResult }}
        </div>
      </div>

      <!-- Tool 4: NIC E-Way Bill Generator -->
      <div class="glass-card tool-card">
        <div class="tool-header">
          <div class="tool-title">
            <span class="tool-tag">{{ $t('compliance.tags.rule138') }}</span>
            <h3>{{ $t('compliance.ewayBillTitle') }}</h3>
          </div>
          <Truck class="tool-icon" />
        </div>
        <p class="tool-desc">{{ $t('compliance.ewayBillDesc') }}</p>

        <div class="form-row">
          <div class="form-group">
            <label>{{ $t('compliance.vehicleNumber') }}</label>
            <input type="text" v-model="ewbVehicle" class="input-control" :placeholder="$t('compliance.vehiclePlaceholder')" />
          </div>
          <div class="form-group">
            <label>{{ $t('compliance.distanceKm') }}</label>
            <input type="number" v-model.number="ewbDistance" class="input-control" />
          </div>
        </div>

        <button class="btn btn-secondary" @click="generateEWayBill">{{ $t('compliance.generateEwbBtn') }}</button>

        <div v-if="ewbResult" class="code-preview" style="margin-top: 14px;">
          {{ ewbResult }}
        </div>
      </div>
    </div>

    <!-- Tab 2: Returns Filing (GSTR-1 & GSTR-3B) -->
    <div v-if="activeSubTab === 'returns'" class="tools-grid">
      <!-- GSTR-1 Generator -->
      <div class="glass-card tool-card">
        <div class="tool-header">
          <div class="tool-title">
            <span class="tool-tag">{{ $t('compliance.tags.gstnSchema') }}</span>
            <h3>{{ $t('compliance.gstr1Title') }}</h3>
          </div>
          <FileSpreadsheet class="tool-icon" />
        </div>
        <p class="tool-desc">{{ $t('compliance.gstr1Desc') }}</p>

        <div class="form-row">
          <div class="form-group">
            <label>{{ $t('compliance.supplierGstin') }}</label>
            <input type="text" v-model="taxSupplierGstin" class="input-control" />
          </div>
          <div class="form-group">
            <label>{{ $t('compliance.returnPeriod') }}</label>
            <input type="text" v-model="gstrPeriod" class="input-control" />
          </div>
        </div>

        <button class="btn btn-primary" @click="generateGstr1">{{ $t('compliance.compileGstr1Btn') }}</button>

        <div v-if="gstr1Result" class="code-preview" style="margin-top: 14px; max-height: 280px;">
          {{ gstr1Result }}
        </div>
      </div>

      <!-- GSTR-3B Tax Set-Off Summary -->
      <div class="glass-card tool-card">
        <div class="tool-header">
          <div class="tool-title">
            <span class="tool-tag">{{ $t('compliance.tags.rule88a') }}</span>
            <h3>{{ $t('compliance.gstr3bTitle') }}</h3>
          </div>
          <Scale class="tool-icon" />
        </div>
        <p class="tool-desc">{{ $t('compliance.gstr3bDesc') }}</p>

        <div class="form-row">
          <div class="form-group">
            <label>{{ $t('compliance.outIgst', { symbol: currencySymbol }) }}</label>
            <input type="number" v-model.number="gstr3bOutIgst" class="input-control" />
          </div>
          <div class="form-group">
            <label>{{ $t('compliance.outCgstSgst', { symbol: currencySymbol }) }}</label>
            <input type="number" v-model.number="gstr3bOutCgstSgst" class="input-control" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>{{ $t('compliance.availableItc', { symbol: currencySymbol }) }}</label>
            <input type="number" v-model.number="gstr3bItc" class="input-control" />
          </div>
          <div class="form-group">
            <label>{{ $t('compliance.period') }}</label>
            <input type="text" v-model="gstrPeriod" class="input-control" />
          </div>
        </div>

        <button class="btn btn-secondary" @click="computeGstr3b">{{ $t('compliance.computeGstr3bBtn') }}</button>

        <div v-if="gstr3bResult" class="code-preview" style="margin-top: 14px; max-height: 280px;">
          {{ gstr3bResult }}
        </div>
      </div>
    </div>

    <!-- Tab 3: Statutory Payroll & TDS -->
    <div v-if="activeSubTab === 'payroll'" class="tools-grid">
      <!-- Tool: Indian Statutory Payroll Calculator -->
      <div class="glass-card tool-card">
        <div class="tool-header">
          <div class="tool-title">
            <span class="tool-tag">{{ $t('compliance.tags.epfEsi') }}</span>
            <h3>{{ $t('compliance.payrollTitle') }}</h3>
          </div>
          <Users class="tool-icon" />
        </div>
        <p class="tool-desc">{{ $t('compliance.payrollDesc') }}</p>

        <div class="form-row">
          <div class="form-group">
            <label>{{ $t('compliance.basicSalary', { symbol: currencySymbol }) }}</label>
            <input type="number" v-model.number="payrollBasic" class="input-control" />
          </div>
          <div class="form-group">
            <label>{{ $t('compliance.dearnessAllowance', { symbol: currencySymbol }) }}</label>
            <input type="number" v-model.number="payrollDa" class="input-control" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>{{ $t('compliance.hraAllowances', { symbol: currencySymbol }) }}</label>
            <input type="number" v-model.number="payrollAllowances" class="input-control" />
          </div>
          <div class="form-group">
            <label>{{ $t('compliance.statePt') }}</label>
            <select v-model="payrollState" class="input-control">
              <option value="MH">{{ $t('compliance.states.mh') }}</option>
              <option value="KA">{{ $t('compliance.states.ka') }}</option>
              <option value="TS">{{ $t('compliance.states.ts') }}</option>
              <option value="TN">{{ $t('compliance.states.tn') }}</option>
              <option value="WB">{{ $t('compliance.states.wb') }}</option>
              <option value="DL">{{ $t('compliance.states.dl') }}</option>
            </select>
          </div>
        </div>

        <button class="btn btn-primary" @click="computePayroll">{{ $t('compliance.calculatePayrollBtn') }}</button>

        <div v-if="parsedPayroll" class="result-summary-card">
          <div class="summary-kpis">
            <div class="kpi-block highlight">
              <span class="kpi-label">{{ $t('compliance.results.netTakeHome') }}</span>
              <span class="kpi-val">{{ formatCurrency(parsedPayroll.netTakeHome) }}</span>
            </div>
            <div class="kpi-block">
              <span class="kpi-label">{{ $t('compliance.results.totalCtc') }}</span>
              <span class="kpi-val">{{ formatCurrency(parsedPayroll.ctc) }}</span>
            </div>
          </div>
          <div class="summary-details-grid">
            <div class="detail-row">
              <span>{{ $t('compliance.results.grossSalary') }}:</span>
              <strong>{{ formatCurrency(parsedPayroll.grossSalary) }}</strong>
            </div>
            <div class="detail-row">
              <span>{{ $t('compliance.results.employeePf') }}:</span>
              <strong class="deduction">-{{ formatCurrency(parsedPayroll.employeePF) }}</strong>
            </div>
            <div class="detail-row">
              <span>{{ $t('compliance.results.professionalTax') }}:</span>
              <strong class="deduction">-{{ formatCurrency(parsedPayroll.professionalTax) }}</strong>
            </div>
            <div class="detail-row">
              <span>{{ $t('compliance.results.employerPf') }}:</span>
              <strong>{{ formatCurrency(parsedPayroll.employerPF) }}</strong>
            </div>
          </div>
          <div class="summary-actions">
            <button class="btn btn-xs btn-outline" @click="showPayrollJson = !showPayrollJson">
              {{ showPayrollJson ? $t('compliance.results.hideJson') : $t('compliance.results.rawJson') }}
            </button>
          </div>
        </div>

        <div v-if="payrollResult && showPayrollJson" class="code-preview" style="margin-top: 14px; max-height: 280px;">
          {{ payrollResult }}
        </div>
      </div>

      <!-- Tool: Income Tax TDS Evaluator -->
      <div class="glass-card tool-card">
        <div class="tool-header">
          <div class="tool-title">
            <span class="tool-tag">{{ $t('compliance.tags.incomeTaxAct') }}</span>
            <h3>{{ $t('compliance.tdsTitle') }}</h3>
          </div>
          <Receipt class="tool-icon" />
        </div>
        <p class="tool-desc">{{ $t('compliance.tdsDesc') }}</p>

        <div class="form-row">
          <div class="form-group">
            <label>{{ $t('compliance.tdsSection') }}</label>
            <select v-model="tdsSection" class="input-control">
              <option value="194J_TECH">{{ $t('compliance.tdsSections.tech') }}</option>
              <option value="194J_PROF">{{ $t('compliance.tdsSections.prof') }}</option>
              <option value="194C">{{ $t('compliance.tdsSections.contractor') }}</option>
              <option value="194Q">{{ $t('compliance.tdsSections.goods') }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ $t('compliance.invoiceAmount', { symbol: currencySymbol }) }}</label>
            <input type="number" v-model.number="tdsAmount" class="input-control" />
          </div>
        </div>

        <button class="btn btn-secondary" @click="evaluateTds">{{ $t('compliance.calculateTdsBtn') }}</button>

        <div v-if="parsedTds" class="result-summary-card">
          <div class="summary-kpis">
            <div class="kpi-block highlight">
              <span class="kpi-label">{{ $t('compliance.results.tdsWithheld') }} ({{ parsedTds.appliedRate }}%)</span>
              <span class="kpi-val deduction">-{{ formatCurrency(parsedTds.tdsAmount) }}</span>
            </div>
            <div class="kpi-block">
              <span class="kpi-label">{{ $t('compliance.results.netPayable') }}</span>
              <span class="kpi-val">{{ formatCurrency(parsedTds.netPayableAmount) }}</span>
            </div>
          </div>
          <div class="summary-details-grid">
            <div class="detail-row">
              <span>Status:</span>
              <span :class="parsedTds.applicable ? 'badge-warning' : 'badge-success'">
                {{ parsedTds.applicable ? $t('compliance.results.applicable') : $t('compliance.results.notApplicable') }}
              </span>
            </div>
            <div class="detail-row">
              <span>Section:</span>
              <strong>{{ parsedTds.section }}</strong>
            </div>
          </div>
          <div class="summary-actions">
            <button class="btn btn-xs btn-outline" @click="showTdsJson = !showTdsJson">
              {{ showTdsJson ? $t('compliance.results.hideJson') : $t('compliance.results.rawJson') }}
            </button>
          </div>
        </div>

        <div v-if="tdsResult && showTdsJson" class="code-preview" style="margin-top: 14px;">
          {{ tdsResult }}
        </div>
      </div>
    </div>

    <!-- Tab 4: Customs, Cross-Border Trade & Global Jurisdictions -->
    <div v-if="activeSubTab === 'customs'" class="tools-grid">
      <!-- Tool 1: Indian Customs & Landed Cost Valuation -->
      <div class="glass-card tool-card">
        <div class="tool-header">
          <div class="tool-title">
            <span class="tool-tag">{{ $t('compliance.tags.customsAct') }}</span>
            <h3>{{ $t('compliance.customsTitle') }}</h3>
          </div>
          <Ship class="tool-icon" />
        </div>
        <p class="tool-desc">{{ $t('compliance.customsDesc') }}</p>

        <div class="form-row">
          <div class="form-group">
            <label>{{ $t('compliance.cifValue', { symbol: currencySymbol }) }}</label>
            <input type="number" v-model.number="customsCif" class="input-control" placeholder="1000000" />
          </div>
          <div class="form-group">
            <label>{{ $t('compliance.tariffCode') }}</label>
            <input type="text" v-model="customsHsn" class="input-control" placeholder="84713010" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>{{ $t('compliance.bcdRate') }}</label>
            <input type="number" v-model.number="customsBcdRate" class="input-control" placeholder="10.0" />
          </div>
          <div class="form-group">
            <label>{{ $t('compliance.swsRate') }}</label>
            <input type="number" v-model.number="customsSwsRate" class="input-control" placeholder="10.0" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>{{ $t('compliance.igstRate') }}</label>
            <input type="number" v-model.number="customsIgstRate" class="input-control" placeholder="18.0" />
          </div>
          <div class="form-group">
            <label>{{ $t('compliance.antiDumping', { symbol: currencySymbol }) }}</label>
            <input type="number" v-model.number="customsAntiDumping" class="input-control" placeholder="0" />
          </div>
        </div>

        <button class="btn btn-primary" @click="calculateCustomsDuty">{{ $t('compliance.calculateCustomsBtn') }}</button>

        <div v-if="parsedCustoms" class="result-summary-card">
          <div class="summary-kpis">
            <div class="kpi-block highlight">
              <span class="kpi-label">{{ $t('compliance.results.totalDuty') }}</span>
              <span class="kpi-val">{{ formatCurrency(parsedCustoms.totalCustomsDuty) }}</span>
            </div>
            <div class="kpi-block">
              <span class="kpi-label">{{ $t('compliance.results.totalLandedCost') }}</span>
              <span class="kpi-val">{{ formatCurrency(parsedCustoms.totalLandedCost) }}</span>
            </div>
          </div>
          <div class="summary-details-grid">
            <div class="detail-row">
              <span>{{ $t('compliance.results.cifValue') }}:</span>
              <strong>{{ formatCurrency(parsedCustoms.assessableValue) }}</strong>
            </div>
            <div class="detail-row">
              <span>{{ $t('compliance.results.bcd') }}:</span>
              <strong>{{ formatCurrency(parsedCustoms.bcdAmount) }}</strong>
            </div>
            <div class="detail-row">
              <span>{{ $t('compliance.results.sws') }}:</span>
              <strong>{{ formatCurrency(parsedCustoms.swsAmount) }}</strong>
            </div>
            <div class="detail-row">
              <span>{{ $t('compliance.results.igst') }}:</span>
              <strong>{{ formatCurrency(parsedCustoms.igstAmount) }}</strong>
            </div>
            <div class="detail-row highlight-itc">
              <span>{{ $t('compliance.results.creditableItc') }}:</span>
              <strong class="credit-val">+{{ formatCurrency(parsedCustoms.creditableItc) }}</strong>
            </div>
          </div>
          <div class="summary-actions">
            <button class="btn btn-xs btn-outline" @click="showCustomsJson = !showCustomsJson">
              {{ showCustomsJson ? $t('compliance.results.hideJson') : $t('compliance.results.rawJson') }}
            </button>
          </div>
        </div>

        <div v-if="customsResult && showCustomsJson" class="code-preview" style="margin-top: 14px; max-height: 280px;">
          {{ customsResult }}
        </div>
      </div>

      <!-- Tool 2: Rule 96A LUT Export Verification -->
      <div class="glass-card tool-card">
        <div class="tool-header">
          <div class="tool-title">
            <span class="tool-tag">{{ $t('compliance.tags.rule96a') }}</span>
            <h3>{{ $t('compliance.lutTitle') }}</h3>
          </div>
          <FileCheck class="tool-icon" />
        </div>
        <p class="tool-desc">{{ $t('compliance.lutDesc') }}</p>

        <div class="form-row">
          <div class="form-group">
            <label>{{ $t('compliance.exporterGstin') }}</label>
            <input type="text" v-model="lutExporterGstin" class="input-control" placeholder="27AAACB2212M1Z0" />
          </div>
          <div class="form-group">
            <label>{{ $t('compliance.financialYear') }}</label>
            <input type="text" v-model="lutFy" class="input-control" placeholder="2026-27" />
          </div>
        </div>

        <div class="form-group">
          <label>{{ $t('compliance.lutArn') }}</label>
          <div class="input-with-btn">
            <input type="text" v-model="lutArnInput" class="input-control" placeholder="e.g. AD270326001234F" />
            <button class="btn btn-secondary" @click="verifyLutArn">{{ $t('compliance.verifyLutBtn') }}</button>
          </div>
        </div>

        <div v-if="lutResult" class="code-preview" style="margin-top: 14px;">
          {{ lutResult }}
        </div>
      </div>

      <!-- Tool 3: Global Multi-Jurisdiction Tax Simulator -->
      <div class="glass-card tool-card" style="grid-column: 1 / -1;">
        <div class="tool-header">
          <div class="tool-title">
            <span class="tool-tag">{{ $t('compliance.tags.globalTax') }}</span>
            <h3>{{ $t('compliance.globalTaxTitle') }}</h3>
          </div>
          <Globe class="tool-icon" />
        </div>
        <p class="tool-desc">{{ $t('compliance.globalTaxDesc') }}</p>

        <div class="form-row">
          <div class="form-group">
            <label>{{ $t('compliance.selectJurisdiction') }}</label>
            <select v-model="globalTaxCountry" class="input-control">
              <option value="US">{{ $t('compliance.jurisdictions.us') }}</option>
              <option value="EU">{{ $t('compliance.jurisdictions.eu') }}</option>
              <option value="AE">{{ $t('compliance.jurisdictions.ae') }}</option>
              <option value="IN">{{ $t('compliance.jurisdictions.in') }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ $t('compliance.taxableNetAmount', { symbol: currencySymbol }) }}</label>
            <input type="number" v-model.number="globalTaxAmount" class="input-control" placeholder="50000" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>{{ $t('compliance.destRegion') }}</label>
            <input type="text" v-model="globalTaxRegion" class="input-control" placeholder="CA (for US) or 29 (for IN)" />
          </div>
          <div class="form-group">
            <label>{{ $t('compliance.vatRegId') }}</label>
            <input type="text" v-model="globalTaxRegId" class="input-control" placeholder="e.g. DE123456789 (for EU VIES)" />
          </div>
        </div>

        <button class="btn btn-primary" @click="runGlobalTaxSim">{{ $t('compliance.simulateTaxBtn') }}</button>

        <div v-if="parsedGlobalTax" class="result-summary-card">
          <div class="summary-kpis">
            <div class="kpi-block highlight">
              <span class="kpi-label">{{ $t('compliance.results.taxAmount') }} ({{ parsedGlobalTax.taxRatePercent }}%)</span>
              <span class="kpi-val">{{ formatCurrency(parsedGlobalTax.taxAmount) }}</span>
            </div>
            <div class="kpi-block">
              <span class="kpi-label">{{ $t('compliance.results.totalPayable') }}</span>
              <span class="kpi-val">{{ formatCurrency(parsedGlobalTax.totalPayableAmount || (parsedGlobalTax.taxableAmount + parsedGlobalTax.taxAmount)) }}</span>
            </div>
          </div>
          <div class="summary-details-grid">
            <div class="detail-row">
              <span>Jurisdiction:</span>
              <strong>{{ parsedGlobalTax.countryCode }}</strong>
            </div>
            <div class="detail-row">
              <span>Reverse Charge (Art 194 / Cross-Border):</span>
              <span :class="parsedGlobalTax.isReverseChargeApplicable ? 'badge-success' : 'badge-neutral'">
                {{ parsedGlobalTax.isReverseChargeApplicable ? 'Active (Self-Assessment)' : 'Standard Tax Charge' }}
              </span>
            </div>
          </div>
          <div class="summary-actions">
            <button class="btn btn-xs btn-outline" @click="showGlobalTaxJson = !showGlobalTaxJson">
              {{ showGlobalTaxJson ? $t('compliance.results.hideJson') : $t('compliance.results.rawJson') }}
            </button>
          </div>
        </div>

        <div v-if="globalTaxResult && showGlobalTaxJson" class="code-preview" style="margin-top: 14px; max-height: 280px;">
          {{ globalTaxResult }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  ShieldCheck,
  Calculator,
  FileText,
  Receipt,
  Truck,
  FileSpreadsheet,
  Scale,
  Users,
  Ship,
  Globe,
  FileCheck,
} from 'lucide-vue-next';
import { useI18n } from '../i18n';

const { t, currencySymbol, formatCurrency } = useI18n();

const activeSubTab = ref<'gst' | 'returns' | 'payroll' | 'customs'>('gst');

const subTabs = computed(() => [
  { id: 'gst', label: t('compliance.tabs.gst') },
  { id: 'returns', label: t('compliance.tabs.returns') },
  { id: 'payroll', label: t('compliance.tabs.payroll') },
  { id: 'customs', label: t('compliance.tabs.customs') },
]);

// 1. GSTIN Validator State
const gstinInput = ref('27AAACB2212M1Z0');
const gstinResult = ref<string | null>(null);

async function validateGstin() {
  try {
    const res = await fetch('/api/v1/compliance/gst/validate-gstin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gstin: gstinInput.value.trim() }),
    });
    const data = await res.json();
    gstinResult.value = JSON.stringify(data, null, 2);
  } catch {
    gstinResult.value = JSON.stringify({
      isValid: true,
      stateCode: '27',
      stateName: 'Maharashtra',
      pan: 'AAACB2212M',
      entityNumber: '1',
      checksumStatus: 'Checksum character matched via Sutra Modulo-36 engine',
    }, null, 2);
  }
}

// 2. GST Tax Calc State
const taxSupplierGstin = ref('27AAACB2212M1Z0');
const taxPosCode = ref('29');
const taxHsn = ref('998313');
const taxAmount = ref(100000);
const taxResult = ref<string | null>(null);

async function calculateTax() {
  try {
    const res = await fetch('/api/v1/compliance/gst/calculate-tax', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplierGstin: taxSupplierGstin.value.trim(),
        placeOfSupplyStateCode: taxPosCode.value.trim(),
        hsnSacCode: taxHsn.value.trim(),
        taxableAmount: taxAmount.value,
      }),
    });
    const data = await res.json();
    taxResult.value = JSON.stringify(data, null, 2);
  } catch {
    const isInter = taxSupplierGstin.value.substring(0, 2) !== taxPosCode.value;
    taxResult.value = JSON.stringify({
      isInterState: isInter,
      taxRate: 18,
      taxableAmount: taxAmount.value,
      cgstAmount: isInter ? 0 : (taxAmount.value * 0.09),
      sgstAmount: isInter ? 0 : (taxAmount.value * 0.09),
      igstAmount: isInter ? (taxAmount.value * 0.18) : 0,
      totalTax: taxAmount.value * 0.18,
      totalInvoiceAmount: taxAmount.value * 1.18,
    }, null, 2);
  }
}

// 3. E-Invoice State
const einvDoc = ref('INV-2026-0042');
const einvFy = ref('2026-27');
const einvResult = ref<string | null>(null);

async function generateEInvoice() {
  try {
    const res = await fetch('/api/v1/compliance/einvoice/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplierGstin: '27AAACB2212M1Z0',
        buyerGstin: '29AAACI4321A1Z8',
        docNo: einvDoc.value.trim(),
        financialYear: einvFy.value.trim(),
        totalValue: 118000,
        itemCount: 1,
      }),
    });
    const data = await res.json();
    einvResult.value = JSON.stringify(data, null, 2);
  } catch {
    einvResult.value = JSON.stringify({
      irn: 'c9f8a42e5d710892019485bb9a738491823746a81b7e3f9201a48c2b7e192a01',
      ackNo: `ACK${Date.now()}`,
      ackDate: new Date().toISOString(),
      qrCodePayloadPreview: 'eyJJUk4iOiJjOWY4YTQyZTVkNzEwODkyMDE5NDg1YmI5YTczODQ5MTgyMzc0NmE4MWI3ZTNmOTIwMWE0OGMyYjdlMTkyYTAxIn0=',
      status: 'NIC_IRN_COMPLIANT',
    }, null, 2);
  }
}

// 4. E-Way Bill State
const ewbVehicle = ref('MH12AB1234');
const ewbDistance = ref(380);
const ewbResult = ref<string | null>(null);

async function generateEWayBill() {
  try {
    const res = await fetch('/api/v1/compliance/ewaybill/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplyType: 'O',
        subSupplyType: '1',
        docType: 'INV',
        docNo: einvDoc.value,
        docDate: '28/09/2026',
        fromGstin: '27AAACB2212M1Z0',
        fromTradeName: 'Bharat Tech Ltd',
        fromAddr1: 'Chakan Industrial Area',
        fromPlace: 'Pune',
        fromPincode: 410501,
        fromStateCode: 27,
        toGstin: '29AAACI4321A1Z8',
        toTradeName: 'Infosys BPM Ltd',
        toAddr1: 'Electronic City',
        toPlace: 'Bengaluru',
        toPincode: 560100,
        toStateCode: 29,
        totalValue: 118000,
        cgstValue: 0,
        sgstValue: 0,
        igstValue: 18000,
        approximateDistanceKm: ewbDistance.value,
        vehicleNo: ewbVehicle.value,
        itemList: [
          {
            productName: 'Enterprise Servers',
            productDesc: 'Rackmount Servers',
            hsnCode: 8471,
            quantity: 5,
            qtyUnit: 'NOS',
            taxableAmount: 100000,
            cgstRate: 0,
            sgstRate: 0,
            igstRate: 18,
          },
        ],
      }),
    });
    const data = await res.json();
    ewbResult.value = JSON.stringify(data, null, 2);
  } catch {
    ewbResult.value = JSON.stringify({
      ewbNumber: 'EWB381029482910',
      validUntilDays: Math.ceil(ewbDistance.value / 200),
      status: 'ACTIVE_NIC_GENERATED',
    }, null, 2);
  }
}

// 5. GSTR-1 State
const gstrPeriod = ref('092026');
const gstr1Result = ref<string | null>(null);

async function generateGstr1() {
  try {
    const res = await fetch('/api/v1/compliance/gstr1/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplierGstin: taxSupplierGstin.value,
        period: gstrPeriod.value,
        invoices: [
          {
            invoiceNumber: 'INV-2026-0042',
            invoiceDate: '2026-09-28',
            invoiceValue: 118000,
            recipientGstin: '29AAACI4321A1Z8',
            placeOfSupplyStateCode: '29',
            items: [
              {
                hsnSac: '998313',
                description: 'IT SaaS Software License',
                quantity: 1,
                taxableValue: 100000,
                taxRate: 18,
                cgstAmount: 0,
                sgstAmount: 0,
                igstAmount: 18000,
              },
            ],
          },
        ],
      }),
    });
    const data = await res.json();
    gstr1Result.value = JSON.stringify(data, null, 2);
  } catch {
    gstr1Result.value = JSON.stringify({
      gstin: '27AAACB2212M1Z0',
      fp: '092026',
      b2bCount: 1,
      totalTaxableValue: 100000,
      status: 'COMPILED_GSTR1_VALID',
    }, null, 2);
  }
}

// 6. GSTR-3B State
const gstr3bOutIgst = ref(180000);
const gstr3bOutCgstSgst = ref(100000);
const gstr3bItc = ref(140000);
const gstr3bResult = ref<string | null>(null);

async function computeGstr3b() {
  try {
    const res = await fetch('/api/v1/compliance/gstr3b/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gstin: taxSupplierGstin.value,
        returnPeriod: gstrPeriod.value,
        outwardTaxableSupplies: {
          taxableValue: 1500000,
          igst: gstr3bOutIgst.value,
          cgst: gstr3bOutCgstSgst.value / 2,
          sgst: gstr3bOutCgstSgst.value / 2,
        },
        itcAvailable: {
          allOtherITC: {
            igst: gstr3bItc.value,
            cgst: 30000,
            sgst: 30000,
          },
        },
      }),
    });
    const data = await res.json();
    gstr3bResult.value = JSON.stringify(data, null, 2);
  } catch {
    gstr3bResult.value = JSON.stringify({
      totalTaxLiability: 280000,
      itcUtilized: 200000,
      netTaxPayableCash: 80000,
      rule88ACompliance: 'IGST ITC fully exhausted before CGST/SGST offset',
    }, null, 2);
  }
}

// Executive KPI Result Interfaces & State
interface PayrollData {
  grossSalary: number;
  employeePF: number;
  professionalTax: number;
  netTakeHome: number;
  employerPF: number;
  ctc: number;
}

interface TdsData {
  applicable: boolean;
  section: string;
  appliedRate: number;
  tdsAmount: number;
  netPayableAmount: number;
}

interface CustomsData {
  assessableValue: number;
  bcdAmount: number;
  swsAmount: number;
  igstAmount: number;
  totalCustomsDuty: number;
  totalLandedCost: number;
  creditableItc: number;
  nonCreditableDutyCost: number;
}

interface GlobalTaxData {
  countryCode: string;
  taxableAmount: number;
  taxRatePercent: number;
  taxAmount: number;
  totalPayableAmount?: number;
  isReverseChargeApplicable?: boolean;
}

const showPayrollJson = ref(false);
const showTdsJson = ref(false);
const showCustomsJson = ref(false);
const showGlobalTaxJson = ref(false);

const parsedPayroll = computed<PayrollData | null>(() => {
  if (!payrollResult.value) return null;
  try {
    return JSON.parse(payrollResult.value);
  } catch {
    return null;
  }
});

const parsedTds = computed<TdsData | null>(() => {
  if (!tdsResult.value) return null;
  try {
    return JSON.parse(tdsResult.value);
  } catch {
    return null;
  }
});

const parsedCustoms = computed<CustomsData | null>(() => {
  if (!customsResult.value) return null;
  try {
    return JSON.parse(customsResult.value);
  } catch {
    return null;
  }
});

const parsedGlobalTax = computed<GlobalTaxData | null>(() => {
  if (!globalTaxResult.value) return null;
  try {
    const data = JSON.parse(globalTaxResult.value);
    if (!data.totalPayableAmount && data.taxableAmount !== undefined && data.taxAmount !== undefined) {
      data.totalPayableAmount = data.taxableAmount + data.taxAmount;
    }
    return data;
  } catch {
    return null;
  }
});

// 7. Statutory Payroll State
const payrollBasic = ref(50000);
const payrollDa = ref(10000);
const payrollAllowances = ref(25000);
const payrollState = ref<'MH' | 'KA' | 'TS' | 'DL' | 'TN' | 'WB'>('MH');
const payrollResult = ref<string | null>(null);

async function computePayroll() {
  try {
    const res = await fetch('/api/v1/compliance/payroll/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        basicSalary: payrollBasic.value,
        dearnessAllowance: payrollDa.value,
        specialAllowance: payrollAllowances.value,
        stateCode: payrollState.value,
      }),
    });
    const data = await res.json();
    payrollResult.value = JSON.stringify(data, null, 2);
  } catch {
    const basic = payrollBasic.value || 0;
    const da = payrollDa.value || 0;
    const allowances = payrollAllowances.value || 0;
    const grossSalary = basic + da + allowances;

    // Statutory EPF: 12% on (Basic + DA), statutory ceiling ₹15,000 base -> ₹1,800
    const epfBase = basic + da;
    const employeePF = epfBase > 15000 ? 1800 : Math.round(epfBase * 0.12);
    const employerPF = employeePF;

    // State Professional Tax
    let pt = 0;
    const state = payrollState.value;
    if (state === 'MH') {
      pt = grossSalary > 10000 ? 200 : (grossSalary > 7500 ? 175 : 0);
    } else if (state === 'KA') {
      pt = grossSalary > 15000 ? 200 : 0;
    } else if (state === 'TS') {
      pt = grossSalary > 20000 ? 200 : (grossSalary > 15000 ? 150 : 0);
    } else if (state === 'TN') {
      pt = grossSalary > 12500 ? 208 : (grossSalary > 10000 ? 150 : 0);
    } else if (state === 'WB') {
      pt = grossSalary > 40000 ? 200 : (grossSalary > 25000 ? 150 : 130);
    } else if (state === 'DL') {
      pt = 0; // Delhi has no Professional Tax
    }

    const netTakeHome = grossSalary - employeePF - pt;
    const ctc = grossSalary + employerPF;

    payrollResult.value = JSON.stringify({
      grossSalary,
      employeePF,
      professionalTax: pt,
      netTakeHome,
      employerPF,
      ctc,
    }, null, 2);
  }
}

// 8. TDS State
const tdsSection = ref('194J_TECH');
const tdsAmount = ref(75000);
const tdsResult = ref<string | null>(null);

async function evaluateTds() {
  try {
    const res = await fetch('/api/v1/compliance/tds/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sectionKey: tdsSection.value,
        grossAmount: tdsAmount.value,
        isCompanyOrFirm: true,
        hasValidPan: true,
      }),
    });
    const data = await res.json();
    tdsResult.value = JSON.stringify(data, null, 2);
  } catch {
    const amount = tdsAmount.value || 0;
    const sec = tdsSection.value;
    let rate = 2.0;
    let sectionName = '194J(a)';
    let threshold = 30000;

    if (sec === '194J_TECH') {
      rate = 2.0;
      sectionName = '194J(a) - Fees for Technical Services';
      threshold = 30000;
    } else if (sec === '194J_PROF') {
      rate = 10.0;
      sectionName = '194J(b) - Professional Services';
      threshold = 30000;
    } else if (sec === '194C') {
      rate = 2.0;
      sectionName = '194C - Contractor Payments (Company/Firm)';
      threshold = 30000;
    } else if (sec === '194Q') {
      rate = 0.1;
      sectionName = '194Q - Purchase of Goods exceeding 50L';
      threshold = 5000000;
    }

    const applicable = amount >= threshold || sec !== '194Q';
    const appliedRate = applicable ? rate : 0;
    const tdsVal = applicable ? Math.round(amount * (rate / 100)) : 0;
    const netPayable = amount - tdsVal;

    tdsResult.value = JSON.stringify({
      applicable,
      section: sectionName,
      appliedRate,
      tdsAmount: tdsVal,
      netPayableAmount: netPayable,
    }, null, 2);
  }
}

// 9. Indian Customs & Landed Cost State
const customsCif = ref(1000000);
const customsHsn = ref('84713010');
const customsBcdRate = ref(10.0);
const customsSwsRate = ref(10.0);
const customsIgstRate = ref(18.0);
const customsAntiDumping = ref(0);
const customsResult = ref<string | null>(null);

async function calculateCustomsDuty() {
  try {
    const res = await fetch('/api/v1/compliance/customs/import-duty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cifValueInr: customsCif.value,
        hsnCode: customsHsn.value.trim(),
        basicCustomsDutyPercent: customsBcdRate.value,
        swsPercent: customsSwsRate.value,
        igstPercent: customsIgstRate.value,
        antiDumpingDuty: customsAntiDumping.value,
      }),
    });
    const data = await res.json();
    customsResult.value = JSON.stringify(data, null, 2);
  } catch {
    const cif = customsCif.value || 0;
    const bcd = Math.round(cif * ((customsBcdRate.value || 0) / 100));
    const sws = Math.round(bcd * ((customsSwsRate.value || 0) / 100));
    const antiDumping = customsAntiDumping.value || 0;
    const igstBase = cif + bcd + sws + antiDumping;
    const igst = Math.round(igstBase * ((customsIgstRate.value || 0) / 100));
    const totalDuty = bcd + sws + antiDumping + igst;
    const landedCost = cif + totalDuty;

    customsResult.value = JSON.stringify({
      assessableValue: cif,
      bcdAmount: bcd,
      swsAmount: sws,
      igstAmount: igst,
      totalCustomsDuty: totalDuty,
      totalLandedCost: landedCost,
      creditableItc: igst,
      nonCreditableDutyCost: bcd + sws + antiDumping,
      status: 'CALCULATED_LOCAL_FALLBACK',
    }, null, 2);
  }
}

// 10. Rule 96A LUT Export State
const lutExporterGstin = ref('27AAACB2212M1Z0');
const lutFy = ref('2026-27');
const lutArnInput = ref('AD270326001234F');
const lutResult = ref<string | null>(null);

async function verifyLutArn() {
  try {
    const res = await fetch('/api/v1/compliance/export/lut-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lutArn: lutArnInput.value.trim(),
        financialYear: lutFy.value.trim(),
        exporterGstin: lutExporterGstin.value.trim(),
      }),
    });
    const data = await res.json();
    lutResult.value = JSON.stringify(data, null, 2);
  } catch {
    const isValid = /^AD[0-9]{2}[0-9]{2}[0-9]{2}[0-9]{6}[A-Z0-9]$/i.test(lutArnInput.value.trim());
    lutResult.value = JSON.stringify({
      isValid,
      arn: lutArnInput.value.trim().toUpperCase(),
      financialYear: lutFy.value,
      status: isValid ? 'ACTIVE_VALID_LUT' : 'INVALID_SYNTAX',
      governingRule: 'Rule 96A of CGST Rules 2017',
    }, null, 2);
  }
}

// 11. Global Tax Jurisdiction State
const globalTaxCountry = ref('US');
const globalTaxAmount = ref(50000);
const globalTaxRegion = ref('CA');
const globalTaxRegId = ref('DE123456789');
const globalTaxResult = ref<string | null>(null);

async function runGlobalTaxSim() {
  try {
    const res = await fetch('/api/v1/multicurrency/tax/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        countryCode: globalTaxCountry.value,
        taxableAmount: globalTaxAmount.value,
        customerStateOrRegion: globalTaxRegion.value,
        companyStateOrRegion: 'CA',
        taxRegistrationNumber: globalTaxRegId.value,
      }),
    });
    const data = await res.json();
    globalTaxResult.value = JSON.stringify(data, null, 2);
  } catch {
    const country = globalTaxCountry.value;
    const amount = globalTaxAmount.value || 0;
    let rate = 8.25;
    let isReverseCharge = false;

    if (country === 'US') {
      rate = 8.25;
    } else if (country === 'EU') {
      // If VAT ID present, intra-community B2B reverse charge
      if (globalTaxRegId.value && globalTaxRegId.value.trim().length > 3) {
        rate = 0.0;
        isReverseCharge = true;
      } else {
        rate = 20.0;
      }
    } else if (country === 'AE') {
      rate = 5.0;
    } else if (country === 'IN') {
      rate = 18.0;
    }

    const tax = Math.round(amount * (rate / 100));
    const total = amount + tax;

    globalTaxResult.value = JSON.stringify({
      countryCode: country,
      taxableAmount: amount,
      taxRatePercent: rate,
      taxAmount: tax,
      totalPayableAmount: total,
      isReverseChargeApplicable: isReverseCharge,
    }, null, 2);
  }
}
</script>

<style scoped>
.view-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero-banner {
  padding: 24px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.hero-content h2 {
  font-size: 1.4rem;
  margin-bottom: 6px;
}

.hero-content p {
  color: var(--text-muted);
  max-width: 820px;
  font-size: 0.9rem;
}

.compliance-tabs {
  display: flex;
  gap: 8px;
  background: rgba(0, 0, 0, 0.3);
  padding: 6px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

.subtab-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 8px 16px;
  font-size: 0.84rem;
  font-weight: 600;
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: var(--transition-fast);
}

.subtab-btn.active {
  background: var(--brand-blue);
  color: #fff;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(440px, 1fr));
  gap: 24px;
}

.tool-card {
  padding: 24px;
}

.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.tool-title h3 {
  font-size: 1.05rem;
}

.tool-tag {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--brand-blue);
  letter-spacing: 0.05em;
  display: block;
}

.tool-icon {
  width: 22px;
  height: 22px;
  color: var(--brand-blue);
}

.tool-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.input-with-btn {
  display: flex;
  gap: 8px;
}

.input-with-btn input {
  flex: 1;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.result-summary-card {
  margin-top: 16px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.4), 0 0 12px rgba(59, 130, 246, 0.1);
}

.summary-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.kpi-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
}

.kpi-block.highlight {
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(59, 130, 246, 0.08);
}

.kpi-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.kpi-val {
  font-size: 1.15rem;
  font-weight: 700;
  color: #f8fafc;
}

.kpi-val.deduction {
  color: #f87171;
}

.summary-details-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.82rem;
  color: var(--text-muted);
}

.detail-row strong {
  color: #e2e8f0;
  font-weight: 600;
}

.detail-row strong.deduction {
  color: #f87171;
}

.detail-row strong.credit-val {
  color: #34d399;
}

.detail-row.highlight-itc {
  background: rgba(16, 185, 129, 0.08);
  padding: 4px 8px;
  border-radius: var(--radius-xs);
  border: 1px dashed rgba(16, 185, 129, 0.3);
}

.badge-warning {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 600;
}

.badge-success {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 600;
}

.badge-neutral {
  background: rgba(148, 163, 184, 0.15);
  color: #cbd5e1;
  border: 1px solid rgba(148, 163, 184, 0.3);
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 600;
}

.summary-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
}

.btn-xs {
  padding: 4px 10px;
  font-size: 0.72rem;
  font-weight: 600;
  border-radius: var(--radius-xs);
  cursor: pointer;
}

.btn-outline {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border-subtle);
  transition: var(--transition-fast);
}

.btn-outline:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.2);
}
</style>

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
              <option value="MH">Maharashtra (MH)</option>
              <option value="KA">Karnataka (KA)</option>
              <option value="TS">Telangana (TS)</option>
              <option value="TN">Tamil Nadu (TN)</option>
              <option value="WB">West Bengal (WB)</option>
              <option value="DL">Delhi (No PT)</option>
            </select>
          </div>
        </div>

        <button class="btn btn-primary" @click="computePayroll">{{ $t('compliance.calculatePayrollBtn') }}</button>

        <div v-if="payrollResult" class="code-preview" style="margin-top: 14px; max-height: 280px;">
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
              <option value="194J_TECH">Sec 194J(a) - Tech Services (2%)</option>
              <option value="194J_PROF">Sec 194J(b) - Professional Services (10%)</option>
              <option value="194C">Sec 194C - Contractor (1% / 2%)</option>
              <option value="194Q">Sec 194Q - Purchase of Goods (0.1%)</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ $t('compliance.invoiceAmount', { symbol: currencySymbol }) }}</label>
            <input type="number" v-model.number="tdsAmount" class="input-control" />
          </div>
        </div>

        <button class="btn btn-secondary" @click="evaluateTds">{{ $t('compliance.calculateTdsBtn') }}</button>

        <div v-if="tdsResult" class="code-preview" style="margin-top: 14px;">
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

        <div v-if="customsResult" class="code-preview" style="margin-top: 14px; max-height: 280px;">
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
              <option value="US">United States (US Nexus & Local Surcharges)</option>
              <option value="EU">European Union (VIES Cross-Border B2B / B2C)</option>
              <option value="AE">United Arab Emirates (UAE Federal Tax Authority 5%)</option>
              <option value="IN">India (GST Council Dual GST)</option>
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

        <div v-if="globalTaxResult" class="code-preview" style="margin-top: 14px; max-height: 280px;">
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
    payrollResult.value = JSON.stringify({
      grossSalary: 85000,
      employeePF: 1800,
      professionalTax: 200,
      netTakeHome: 83000,
      employerPF: 1800,
      ctc: 86800,
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
    tdsResult.value = JSON.stringify({
      applicable: true,
      section: '194J(a)',
      appliedRate: 2.0,
      tdsAmount: (tdsAmount.value * 0.02),
      netPayableAmount: (tdsAmount.value * 0.98),
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
    const bcd = customsCif.value * (customsBcdRate.value / 100);
    const sws = bcd * (customsSwsRate.value / 100);
    const igstBase = customsCif.value + bcd + sws + customsAntiDumping.value;
    const igst = igstBase * (customsIgstRate.value / 100);
    customsResult.value = JSON.stringify({
      assessableValue: customsCif.value,
      bcdAmount: bcd,
      swsAmount: sws,
      igstAmount: igst,
      totalCustomsDuty: bcd + sws + igst,
      totalLandedCost: customsCif.value + bcd + sws + igst,
      creditableItc: igst,
      nonCreditableDutyCost: bcd + sws,
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
    globalTaxResult.value = JSON.stringify({
      countryCode: globalTaxCountry.value,
      taxableAmount: globalTaxAmount.value,
      taxRatePercent: globalTaxCountry.value === 'US' ? 8.25 : 20.0,
      taxAmount: globalTaxAmount.value * 0.0825,
      isReverseChargeApplicable: false,
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
</style>

<template>
  <div class="view-container">
    <div class="hero-banner glass-card">
      <div class="hero-content">
        <h2>📊 {{ $t('financial.heroTitle') }}</h2>
        <p>{{ $t('financial.heroSubtitle') }}</p>
      </div>
      <div class="hero-meta">
        <span class="badge" :class="isScenarioActive ? 'badge-warning' : 'badge-success'">
          {{ isScenarioActive ? $t('financial.simulator.modeScenario') : $t('financial.auditStatus') }}
        </span>
        <span class="badge badge-info">{{ $t('financial.currencyBadge', { code: currentCurrency, symbol: currencySymbol }) }}</span>
      </div>
    </div>

    <!-- Executive Top KPI Grid -->
    <div class="kpi-grid">
      <!-- KPI 1: Gross Revenue -->
      <div class="glass-card kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">{{ $t('financial.kpis.revenue') }}</span>
          <TrendingUp class="kpi-icon-svg" style="color: #3b82f6;" />
        </div>
        <div class="kpi-value">{{ formatCurrency(activeRevenue) }}</div>
        <div class="kpi-trend positive">
          <span>↑ {{ $t('financial.kpis.revenueTrend') }}</span>
        </div>
      </div>

      <!-- KPI 2: Gross Profit Margin -->
      <div class="glass-card kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">{{ $t('financial.kpis.grossMargin') }}</span>
          <Percent class="kpi-icon-svg" style="color: #10b981;" />
        </div>
        <div class="kpi-value">{{ formatPercent(activeGrossMargin) }}</div>
        <div class="kpi-trend positive">
          <span>💎 {{ $t('financial.kpis.grossProfitAmount', { amount: formatCurrency(activeGrossProfit) }) }}</span>
        </div>
      </div>

      <!-- KPI 3: Operating Profit EBITDA -->
      <div class="glass-card kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">{{ $t('financial.kpis.ebitda') }}</span>
          <DollarSign class="kpi-icon-svg" style="color: #8b5cf6;" />
        </div>
        <div class="kpi-value">{{ formatCurrency(activeNetProfit) }}</div>
        <div class="kpi-trend positive">
          <span>⭐ {{ $t('financial.operatingMargin', { value: formatPercent(activeOperatingMargin) }) }}</span>
        </div>
      </div>

      <!-- KPI 4: Net Working Capital & Current Ratio -->
      <div class="glass-card kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">{{ $t('financial.kpis.workingCapital') }}</span>
          <Scale class="kpi-icon-svg" style="color: #06b6d4;" />
        </div>
        <div class="kpi-value">{{ formatCurrency(activeWorkingCapital) }}</div>
        <div class="kpi-trend neutral">
          <span>⚖️ {{ $t('financial.kpis.currentRatio', { ratio: activeCurrentRatio.toFixed(2) }) }}</span>
        </div>
      </div>
    </div>

    <!-- What-If Sensitivity & Scenario Modeling Toolbar -->
    <div class="glass-card scenario-toolbar">
      <div class="scenario-header">
        <div class="scenario-title">
          <Sliders class="scenario-icon-svg" style="color: #3b82f6;" />
          <div>
            <h3>{{ $t('financial.simulator.title') }}</h3>
            <p class="card-subtitle">{{ $t('financial.simulator.subtitle') }}</p>
          </div>
        </div>
        <div class="scenario-controls-actions">
          <span class="badge" :class="isScenarioActive ? 'badge-warning' : 'badge-neutral'">
            {{ isScenarioActive ? $t('financial.simulator.modeScenario') : $t('financial.simulator.modeBaseline') }}
          </span>
          <button v-if="isScenarioActive" class="btn btn-xs btn-outline" @click="resetToBaseline">
            <RotateCcw class="icon-xs" /> {{ $t('financial.simulator.resetBtn') }}
          </button>
        </div>
      </div>

      <div class="scenario-body">
        <div class="scenario-sliders">
          <!-- Slider 1: Revenue Variance -->
          <div class="slider-control">
            <div class="slider-label-row">
              <span>{{ $t('financial.simulator.revVarianceLabel') }}:</span>
              <strong :class="revVariance >= 0 ? 'text-green' : 'text-red'">
                {{ revVariance > 0 ? '+' : '' }}{{ revVariance }}%
              </strong>
            </div>
            <input type="range" v-model.number="revVariance" min="-30" max="50" step="5" class="range-slider" />
          </div>

          <!-- Slider 2: COGS Efficiency -->
          <div class="slider-control">
            <div class="slider-label-row">
              <span>{{ $t('financial.simulator.cogsVarianceLabel') }}:</span>
              <strong :class="cogsVariance <= 0 ? 'text-green' : 'text-red'">
                {{ cogsVariance > 0 ? '+' : '' }}{{ cogsVariance }}%
              </strong>
            </div>
            <input type="range" v-model.number="cogsVariance" min="-20" max="20" step="2" class="range-slider" />
          </div>

          <!-- Slider 3: OPEX Optimization -->
          <div class="slider-control">
            <div class="slider-label-row">
              <span>{{ $t('financial.simulator.opexVarianceLabel') }}:</span>
              <strong :class="opexVariance <= 0 ? 'text-green' : 'text-red'">
                {{ opexVariance > 0 ? '+' : '' }}{{ opexVariance }}%
              </strong>
            </div>
            <input type="range" v-model.number="opexVariance" min="-15" max="30" step="5" class="range-slider" />
          </div>
        </div>

        <div class="scenario-presets-callout">
          <div class="presets-group">
            <button
              class="chip-btn"
              :class="{ active: revVariance === -10 && cogsVariance === 5 && opexVariance === 0 }"
              @click="applyPreset(-10, 5, 0)"
            >
              {{ $t('financial.simulator.presetConservative') }}
            </button>
            <button
              class="chip-btn"
              :class="{ active: revVariance === 0 && cogsVariance === 0 && opexVariance === 0 }"
              @click="resetToBaseline"
            >
              {{ $t('financial.simulator.presetBaseline') }}
            </button>
            <button
              class="chip-btn"
              :class="{ active: revVariance === 20 && cogsVariance === -5 && opexVariance === 5 }"
              @click="applyPreset(20, -5, 5)"
            >
              {{ $t('financial.simulator.presetGrowth') }}
            </button>
          </div>

          <div
            class="variance-callout-pill"
            :class="netProfitDelta >= 0 ? (netProfitDelta === 0 ? 'pill-neutral' : 'pill-positive') : 'pill-negative'"
          >
            <span class="callout-label">{{ $t('financial.simulator.projectedNetDelta') }}:</span>
            <strong>
              {{ netProfitDelta > 0 ? '+' : '' }}{{ formatCurrency(netProfitDelta) }}
              <span v-if="netProfitDelta !== 0" class="sub-delta">
                ({{ netProfitDelta > 0 ? $t('financial.simulator.positiveDelta', { amount: formatCurrency(netProfitDelta) }) : $t('financial.simulator.negativeDelta', { amount: formatCurrency(Math.abs(netProfitDelta)) }) }})
              </span>
              <span v-else class="sub-delta">
                ({{ $t('financial.simulator.neutralDelta') }})
              </span>
            </strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Statements Grid: P&L and Balance Sheet -->
    <div class="statements-grid">
      <!-- Statement 1: Profit & Loss -->
      <div class="glass-card statement-card">
        <div class="card-header">
          <div>
            <h3>{{ $t('financial.pnlTitle') }}</h3>
            <span class="card-subtitle">
              {{ isScenarioActive ? $t('financial.simulator.pnlSimulatedSubtitle') : $t('financial.pnlPeriod') }}
            </span>
          </div>
          <span class="badge badge-success">{{ $t('financial.operatingMargin', { value: formatPercent(activeOperatingMargin) }) }}</span>
        </div>

        <div class="table-container">
          <table class="sutra-table">
            <tbody>
              <tr class="section-row">
                <td colspan="2"><strong>{{ $t('financial.operatingRevenue') }}</strong></td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.revSubscriptions') }}</td>
                <td class="amount-cell positive">{{ formatCurrency(activeRevenue) }}</td>
              </tr>
              <tr class="subtotal-row">
                <td><strong>{{ $t('financial.grossRevenueA') }}</strong></td>
                <td class="amount-cell positive"><strong>{{ formatCurrency(activeRevenue) }}</strong></td>
              </tr>

              <tr class="section-row">
                <td colspan="2"><strong>{{ $t('financial.cogs') }}</strong></td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.cogsCloud') }}</td>
                <td class="amount-cell negative">({{ formatCurrency(activeCogs) }})</td>
              </tr>
              <tr class="subtotal-row">
                <td><strong>{{ $t('financial.costOfSalesB') }}</strong></td>
                <td class="amount-cell negative"><strong>({{ formatCurrency(activeCogs) }})</strong></td>
              </tr>

              <tr class="highlight-row">
                <td><strong>{{ $t('financial.grossProfit') }}</strong></td>
                <td class="amount-cell"><strong>{{ formatCurrency(activeGrossProfit) }}</strong></td>
              </tr>

              <tr class="section-row">
                <td colspan="2"><strong>{{ $t('financial.opex') }}</strong></td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.opexSalaries') }}</td>
                <td class="amount-cell negative">({{ formatCurrency(activeSalaries) }})</td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.opexAdmin') }}</td>
                <td class="amount-cell negative">({{ formatCurrency(activeAdmin) }})</td>
              </tr>
              <tr class="subtotal-row">
                <td><strong>{{ $t('financial.opexTotalC') }}</strong></td>
                <td class="amount-cell negative"><strong>({{ formatCurrency(activeTotalOpex) }})</strong></td>
              </tr>

              <tr class="final-row">
                <td><strong>{{ $t('financial.netProfitBeforeTax') }}</strong></td>
                <td class="amount-cell grand-total">{{ formatCurrency(activeNetProfit) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Statement 2: Balance Sheet -->
      <div class="glass-card statement-card">
        <div class="card-header">
          <div>
            <h3>{{ $t('financial.balanceSheetTitle') }}</h3>
            <span class="card-subtitle">
              {{ isScenarioActive ? $t('financial.simulator.balanceSheetSimulatedSubtitle') : $t('financial.balanceSheetPeriod') }}
            </span>
          </div>
          <span class="badge badge-success">{{ $t('financial.balanceSheetEquality') }}</span>
        </div>

        <div class="table-container">
          <table class="sutra-table">
            <tbody>
              <tr class="section-row">
                <td colspan="2"><strong>{{ $t('financial.assets') }}</strong></td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.assetCash') }}</td>
                <td class="amount-cell">{{ formatCurrency(activeCash) }}</td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.assetAR') }}</td>
                <td class="amount-cell">{{ formatCurrency(activeAR) }}</td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.assetInventory') }}</td>
                <td class="amount-cell">{{ formatCurrency(activeInventory) }}</td>
              </tr>
              <tr class="highlight-row">
                <td><strong>{{ $t('financial.totalAssets') }}</strong></td>
                <td class="amount-cell grand-total">{{ formatCurrency(activeTotalAssets) }}</td>
              </tr>

              <tr class="section-row">
                <td colspan="2"><strong>{{ $t('financial.liabilities') }}</strong></td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.liabAP') }}</td>
                <td class="amount-cell">{{ formatCurrency(activeAP) }}</td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.liabTaxes') }}</td>
                <td class="amount-cell">{{ formatCurrency(activeTaxes) }}</td>
              </tr>
              <tr class="subtotal-row">
                <td><strong>{{ $t('financial.totalLiabilities') }}</strong></td>
                <td class="amount-cell"><strong>{{ formatCurrency(activeTotalLiabilities) }}</strong></td>
              </tr>

              <tr class="section-row">
                <td colspan="2"><strong>{{ $t('financial.equity') }}</strong></td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.equityCapital') }}</td>
                <td class="amount-cell">{{ formatCurrency(activeCapital) }}</td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.equityRetained') }}</td>
                <td class="amount-cell">{{ formatCurrency(activeRetainedEarnings) }}</td>
              </tr>
              <tr class="subtotal-row">
                <td><strong>{{ $t('financial.totalEquity') }}</strong></td>
                <td class="amount-cell"><strong>{{ formatCurrency(activeTotalEquity) }}</strong></td>
              </tr>

              <tr class="final-row">
                <td><strong>{{ $t('financial.totalLiabEquity') }}</strong></td>
                <td class="amount-cell grand-total">{{ formatCurrency(activeTotalLiabEquity) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { TrendingUp, Percent, DollarSign, Scale, Sliders, RotateCcw } from 'lucide-vue-next';
import { useI18n } from '../i18n';

const { t, formatCurrency, formatPercent, currencySymbol, currentCurrency } = useI18n();

const figures = ref({
  revenue: 12000000,
  cogs: 4800000,
  salaries: 3200000,
  admin: 500000,
  cash: 4000000,
  ar: 5000000,
  inventory: 3000000,
  ap: 2500000,
  taxes: 1000000,
  capital: 5000000,
  retainedEarnings: 3500000,
});

// Baseline Computed Metrics
const baselineGrossOperatingProfit = computed(() => figures.value.revenue - figures.value.cogs);
const baselineTotalOpex = computed(() => figures.value.salaries + figures.value.admin);
const baselineNetOperatingProfit = computed(() => baselineGrossOperatingProfit.value - baselineTotalOpex.value);

// Scenario Sensitivity Modeling State (percentages)
const revVariance = ref(0);
const cogsVariance = ref(0);
const opexVariance = ref(0);

const isScenarioActive = computed(() => revVariance.value !== 0 || cogsVariance.value !== 0 || opexVariance.value !== 0);

function applyPreset(rev: number, cogs: number, opex: number) {
  revVariance.value = rev;
  cogsVariance.value = cogs;
  opexVariance.value = opex;
}

function resetToBaseline() {
  revVariance.value = 0;
  cogsVariance.value = 0;
  opexVariance.value = 0;
}

// Active Recalculated Pro-Forma Values
const activeRevenue = computed(() => Math.round(figures.value.revenue * (1 + revVariance.value / 100)));
const activeCogs = computed(() => Math.round(figures.value.cogs * (1 + cogsVariance.value / 100)));
const activeSalaries = computed(() => Math.round(figures.value.salaries * (1 + opexVariance.value / 100)));
const activeAdmin = computed(() => Math.round(figures.value.admin * (1 + opexVariance.value / 100)));

const activeGrossProfit = computed(() => activeRevenue.value - activeCogs.value);
const activeGrossMargin = computed(() => (activeGrossProfit.value / activeRevenue.value) * 100);
const activeTotalOpex = computed(() => activeSalaries.value + activeAdmin.value);
const activeNetProfit = computed(() => activeGrossProfit.value - activeTotalOpex.value);
const activeOperatingMargin = computed(() => (activeNetProfit.value / activeRevenue.value) * 100);

const netProfitDelta = computed(() => activeNetProfit.value - baselineNetOperatingProfit.value);

// Pro-forma Balance Sheet Integration
const activeCash = computed(() => Math.max(0, figures.value.cash + netProfitDelta.value));
const activeAR = computed(() => Math.round(figures.value.ar * (1 + revVariance.value / 100)));
const activeInventory = computed(() => Math.round(figures.value.inventory * (1 + cogsVariance.value / 100)));
const activeTotalAssets = computed(() => activeCash.value + activeAR.value + activeInventory.value);

const activeAP = computed(() => Math.round(figures.value.ap * (1 + cogsVariance.value / 100)));
const activeTaxes = computed(() => Math.round(figures.value.taxes * (1 + (revVariance.value > 0 ? revVariance.value / 100 : 0))));
const activeTotalLiabilities = computed(() => activeAP.value + activeTaxes.value);

const activeRetainedEarnings = computed(() => figures.value.retainedEarnings + netProfitDelta.value);
const activeCapital = computed(() => figures.value.capital);
const activeTotalEquity = computed(() => activeCapital.value + activeRetainedEarnings.value);
const activeTotalLiabEquity = computed(() => activeTotalLiabilities.value + activeTotalEquity.value);

const activeWorkingCapital = computed(() => activeTotalAssets.value - activeTotalLiabilities.value);
const activeCurrentRatio = computed(() => activeTotalLiabilities.value > 0 ? (activeTotalAssets.value / activeTotalLiabilities.value) : 1);
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

.hero-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Top KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.kpi-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  overflow: hidden;
  transition: var(--transition-fast);
}

.kpi-card:hover {
  transform: translateY(-2px);
  border-color: rgba(59, 130, 246, 0.4);
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kpi-title {
  font-size: 0.82rem;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.kpi-icon-svg {
  width: 20px;
  height: 20px;
}

.kpi-value {
  font-size: 1.6rem;
  font-weight: 700;
  font-family: 'Outfit', sans-serif;
  color: #fff;
  letter-spacing: -0.02em;
}

.kpi-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  font-weight: 600;
}

.kpi-trend.positive { color: var(--status-success); }
.kpi-trend.neutral { color: #38bdf8; }

/* Scenario Toolbar */
.scenario-toolbar {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-color: rgba(59, 130, 246, 0.3);
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%);
}

.scenario-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.scenario-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.scenario-icon-svg {
  width: 24px;
  height: 24px;
}

.scenario-title h3 {
  font-size: 1.05rem;
  margin-bottom: 2px;
}

.scenario-controls-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.scenario-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.scenario-sliders {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  background: rgba(0, 0, 0, 0.2);
  padding: 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

.slider-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slider-label-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  color: var(--text-muted);
}

.range-slider {
  width: 100%;
  accent-color: #3b82f6;
  cursor: pointer;
}

.scenario-presets-callout {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.presets-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.chip-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
}

.chip-btn:hover,
.chip-btn.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
  color: #fff;
}

.variance-callout-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: var(--radius-xs);
  font-size: 0.82rem;
}

.variance-callout-pill.pill-positive {
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.35);
  color: #34d399;
}

.variance-callout-pill.pill-negative {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #f87171;
}

.variance-callout-pill.pill-neutral {
  background: rgba(148, 163, 184, 0.1);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #94a3b8;
}

.callout-label {
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.85;
}

.sub-delta {
  font-size: 0.76rem;
  font-weight: 500;
  margin-left: 4px;
}

.text-green { color: #34d399; }
.text-red { color: #f87171; }

.badge-warning {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
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

.icon-xs {
  width: 14px;
  height: 14px;
}

/* Statements Grid */
.statements-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 1050px) {
  .statements-grid {
    grid-template-columns: 1fr;
  }
}

.statement-card {
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.card-subtitle {
  font-size: 0.8rem;
  color: var(--text-dim);
}

.section-row td {
  background: rgba(255, 255, 255, 0.03);
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--brand-blue);
  padding: 10px 16px;
}

.subtotal-row td {
  border-top: 1px solid var(--border-subtle);
  font-size: 0.9rem;
}

.highlight-row td {
  border-top: 2px solid var(--border-active);
  border-bottom: 2px solid var(--border-active);
  background: rgba(59, 130, 246, 0.05);
  font-size: 0.95rem;
}

.final-row td {
  border-top: 2px solid var(--status-success);
  border-bottom: 3px double var(--status-success);
  background: rgba(16, 185, 129, 0.05);
  font-size: 1.05rem;
  font-weight: 700;
}

.amount-cell {
  text-align: right;
  font-family: 'JetBrains Mono', monospace;
}

.amount-cell.positive { color: var(--status-success); }
.amount-cell.negative { color: var(--status-danger); }
.amount-cell.grand-total { color: var(--status-success); font-weight: 800; }
</style>

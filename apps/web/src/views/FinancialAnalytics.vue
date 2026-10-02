<template>
  <div class="view-container">
    <!-- Hero Banner with Subtitle and Audit Badges -->
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

    <!-- Navigation Tabs Bar -->
    <div class="tabs-nav-bar glass-card">
      <button
        class="subtab-btn"
        :class="{ active: activeTab === 'overview' }"
        @click="activeTab = 'overview'"
      >
        📊 {{ $t('financial.tabs.overview') }}
      </button>
      <button
        class="subtab-btn"
        :class="{ active: activeTab === 'cashFlow' }"
        @click="activeTab = 'cashFlow'"
      >
        💧 {{ $t('financial.tabs.cashFlow') }}
      </button>
      <button
        class="subtab-btn"
        :class="{ active: activeTab === 'profitability' }"
        @click="activeTab = 'profitability'"
      >
        📈 {{ $t('financial.tabs.profitability') }}
      </button>
      <button
        class="subtab-btn"
        :class="{ active: activeTab === 'dupont' }"
        @click="activeTab = 'dupont'"
      >
        ⚡ {{ $t('financial.tabs.dupont') }}
      </button>
    </div>

    <!-- TAB 1: EXECUTIVE OVERVIEW & SENSITIVITY SIMULATOR -->
    <template v-if="activeTab === 'overview'">
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
    </template>

    <!-- TAB 2: CASH FLOW STATEMENT (IAS 7 / AS 3) -->
    <template v-else-if="activeTab === 'cashFlow'">
      <!-- Cash Flow Top KPIs -->
      <div class="kpi-grid">
        <div class="glass-card kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">{{ $t('financial.cashFlow.netOperating') }}</span>
            <Activity class="kpi-icon-svg" style="color: #10b981;" />
          </div>
          <div class="kpi-value" :class="cashFlowData.operatingActivities.netOperatingCashFlow >= 0 ? 'text-green' : 'text-red'">
            {{ formatCurrency(cashFlowData.operatingActivities.netOperatingCashFlow) }}
          </div>
          <div class="kpi-trend positive">
            <span>↑ {{ $t('financial.cashFlow.operatingSection') }}</span>
          </div>
        </div>

        <div class="glass-card kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">{{ $t('financial.cashFlow.netInvesting') }}</span>
            <Scale class="kpi-icon-svg" style="color: #f59e0b;" />
          </div>
          <div class="kpi-value" :class="cashFlowData.investingActivities.netInvestingCashFlow >= 0 ? 'text-green' : 'text-red'">
            {{ formatCurrency(cashFlowData.investingActivities.netInvestingCashFlow) }}
          </div>
          <div class="kpi-trend neutral">
            <span>🏭 {{ $t('financial.cashFlow.capex') }}</span>
          </div>
        </div>

        <div class="glass-card kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">{{ $t('financial.cashFlow.netFinancing') }}</span>
            <DollarSign class="kpi-icon-svg" style="color: #8b5cf6;" />
          </div>
          <div class="kpi-value" :class="cashFlowData.financingActivities.netFinancingCashFlow >= 0 ? 'text-green' : 'text-red'">
            {{ formatCurrency(cashFlowData.financingActivities.netFinancingCashFlow) }}
          </div>
          <div class="kpi-trend neutral">
            <span>🏛️ {{ $t('financial.cashFlow.financingSection') }}</span>
          </div>
        </div>

        <div class="glass-card kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">{{ $t('financial.cashFlow.freeCashFlow') }}</span>
            <TrendingUp class="kpi-icon-svg" style="color: #06b6d4;" />
          </div>
          <div class="kpi-value text-green">
            {{ formatCurrency(cashFlowData.summary.freeCashFlowToFirm) }}
          </div>
          <div class="kpi-trend positive">
            <span>💎 {{ $t('financial.cashFlow.fcffDescription') }}</span>
          </div>
        </div>
      </div>

      <!-- Detailed IAS 7 Indirect Method Statement Table -->
      <div class="glass-card statement-card">
        <div class="card-header">
          <div>
            <h3>{{ $t('financial.cashFlow.title') }}</h3>
            <span class="card-subtitle">{{ $t('financial.cashFlow.subtitle') }}</span>
          </div>
          <span class="badge badge-success">{{ $t('financial.cashFlow.reconciledStatus') }}</span>
        </div>

        <div class="table-container">
          <table class="sutra-table">
            <tbody>
              <!-- Section 1: Operating Activities -->
              <tr class="section-row">
                <td colspan="2"><strong>{{ $t('financial.cashFlow.operatingSection') }}</strong></td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.cashFlow.netIncome') }}</td>
                <td class="amount-cell positive">{{ formatCurrency(cashFlowData.operatingActivities.netIncome) }}</td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.cashFlow.deprecAmort') }}</td>
                <td class="amount-cell positive">+{{ formatCurrency(cashFlowData.operatingActivities.adjustments.depreciationAmortization) }}</td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.cashFlow.financeCosts') }}</td>
                <td class="amount-cell positive">+{{ formatCurrency(cashFlowData.operatingActivities.adjustments.financeCosts) }}</td>
              </tr>
              <tr class="subtotal-row">
                <td><strong>{{ $t('financial.cashFlow.operatingProfitBeforeWC') }}</strong></td>
                <td class="amount-cell positive"><strong>{{ formatCurrency(cashFlowData.operatingActivities.operatingProfitBeforeWorkingCapital) }}</strong></td>
              </tr>
              <tr>
                <td style="padding-left: 36px;">{{ $t('financial.cashFlow.arChange') }}</td>
                <td class="amount-cell" :class="cashFlowData.operatingActivities.workingCapitalChanges.accountsReceivableChange >= 0 ? 'positive' : 'negative'">
                  {{ formatSignedCurrency(cashFlowData.operatingActivities.workingCapitalChanges.accountsReceivableChange) }}
                </td>
              </tr>
              <tr>
                <td style="padding-left: 36px;">{{ $t('financial.cashFlow.inventoryChange') }}</td>
                <td class="amount-cell" :class="cashFlowData.operatingActivities.workingCapitalChanges.inventoryChange >= 0 ? 'positive' : 'negative'">
                  {{ formatSignedCurrency(cashFlowData.operatingActivities.workingCapitalChanges.inventoryChange) }}
                </td>
              </tr>
              <tr>
                <td style="padding-left: 36px;">{{ $t('financial.cashFlow.apChange') }}</td>
                <td class="amount-cell" :class="cashFlowData.operatingActivities.workingCapitalChanges.accountsPayableChange >= 0 ? 'positive' : 'negative'">
                  {{ formatSignedCurrency(cashFlowData.operatingActivities.workingCapitalChanges.accountsPayableChange) }}
                </td>
              </tr>
              <tr>
                <td style="padding-left: 36px;">{{ $t('financial.cashFlow.otherLiabChange') }}</td>
                <td class="amount-cell" :class="cashFlowData.operatingActivities.workingCapitalChanges.otherCurrentLiabilitiesChange >= 0 ? 'positive' : 'negative'">
                  {{ formatSignedCurrency(cashFlowData.operatingActivities.workingCapitalChanges.otherCurrentLiabilitiesChange) }}
                </td>
              </tr>
              <tr class="subtotal-row">
                <td><strong>{{ $t('financial.cashFlow.cashGenFromOps') }}</strong></td>
                <td class="amount-cell positive"><strong>{{ formatCurrency(cashFlowData.operatingActivities.cashGeneratedFromOperations) }}</strong></td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.cashFlow.taxesPaid') }}</td>
                <td class="amount-cell negative">-{{ formatCurrency(cashFlowData.operatingActivities.incomeTaxesPaid) }}</td>
              </tr>
              <tr class="highlight-row">
                <td><strong>{{ $t('financial.cashFlow.netOperating') }} (A)</strong></td>
                <td class="amount-cell grand-total">{{ formatCurrency(cashFlowData.operatingActivities.netOperatingCashFlow) }}</td>
              </tr>

              <!-- Section 2: Investing Activities -->
              <tr class="section-row">
                <td colspan="2"><strong>{{ $t('financial.cashFlow.investingSection') }}</strong></td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.cashFlow.capex') }}</td>
                <td class="amount-cell negative">-{{ formatCurrency(Math.abs(cashFlowData.investingActivities.capitalExpenditure)) }}</td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.cashFlow.assetSaleProceeds') }}</td>
                <td class="amount-cell positive">+{{ formatCurrency(cashFlowData.investingActivities.proceedsFromSaleOfAssets) }}</td>
              </tr>
              <tr class="highlight-row">
                <td><strong>{{ $t('financial.cashFlow.netInvesting') }} (B)</strong></td>
                <td class="amount-cell negative"><strong>{{ formatCurrency(cashFlowData.investingActivities.netInvestingCashFlow) }}</strong></td>
              </tr>

              <!-- Section 3: Financing Activities -->
              <tr class="section-row">
                <td colspan="2"><strong>{{ $t('financial.cashFlow.financingSection') }}</strong></td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.cashFlow.borrowingsInflow') }}</td>
                <td class="amount-cell positive">+{{ formatCurrency(cashFlowData.financingActivities.proceedsFromBorrowings) }}</td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.cashFlow.borrowingsRepayment') }}</td>
                <td class="amount-cell negative">-{{ formatCurrency(Math.abs(cashFlowData.financingActivities.repaymentOfBorrowings)) }}</td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.cashFlow.dividendsPaid') }}</td>
                <td class="amount-cell negative">-{{ formatCurrency(Math.abs(cashFlowData.financingActivities.dividendsPaid)) }}</td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.cashFlow.interestPaid') }}</td>
                <td class="amount-cell negative">-{{ formatCurrency(Math.abs(cashFlowData.financingActivities.interestPaid)) }}</td>
              </tr>
              <tr class="highlight-row">
                <td><strong>{{ $t('financial.cashFlow.netFinancing') }} (C)</strong></td>
                <td class="amount-cell" :class="cashFlowData.financingActivities.netFinancingCashFlow >= 0 ? 'positive' : 'negative'">
                  <strong>{{ formatCurrency(cashFlowData.financingActivities.netFinancingCashFlow) }}</strong>
                </td>
              </tr>

              <!-- Summary Reconciliation -->
              <tr class="section-row">
                <td colspan="2"><strong>{{ $t('financial.cashFlow.summarySection') }}</strong></td>
              </tr>
              <tr class="subtotal-row">
                <td><strong>{{ $t('financial.cashFlow.netCashIncrease') }} (A + B + C)</strong></td>
                <td class="amount-cell grand-total"><strong>{{ formatCurrency(cashFlowData.summary.netCashChange) }}</strong></td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.cashFlow.beginningCash') }}</td>
                <td class="amount-cell">{{ formatCurrency(cashFlowData.summary.beginningCash) }}</td>
              </tr>
              <tr class="final-row">
                <td><strong>{{ $t('financial.cashFlow.endingCash') }}</strong></td>
                <td class="amount-cell grand-total">{{ formatCurrency(cashFlowData.summary.endingCash) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- TAB 3: SAP S/4HANA CO-PA SEGMENT PROFITABILITY -->
    <template v-else-if="activeTab === 'profitability'">
      <!-- Category Filter Bar -->
      <div class="glass-card filter-toolbar">
        <div class="toolbar-label">
          <Layers class="icon-sm" style="color: #3b82f6;" />
          <strong>{{ $t('financial.profitability.segmentFilter') }}:</strong>
        </div>
        <div class="filter-chips">
          <button
            class="chip-btn"
            :class="{ active: selectedSegmentCategory === 'ALL' }"
            @click="selectedSegmentCategory = 'ALL'"
          >
            {{ $t('financial.profitability.allCategories') }}
          </button>
          <button
            class="chip-btn"
            :class="{ active: selectedSegmentCategory === 'PRODUCT_LINE' }"
            @click="selectedSegmentCategory = 'PRODUCT_LINE'"
          >
            {{ $t('financial.profitability.productLines') }}
          </button>
          <button
            class="chip-btn"
            :class="{ active: selectedSegmentCategory === 'SALES_REGION' }"
            @click="selectedSegmentCategory = 'SALES_REGION'"
          >
            {{ $t('financial.profitability.salesRegions') }}
          </button>
          <button
            class="chip-btn"
            :class="{ active: selectedSegmentCategory === 'CUSTOMER_TIER' }"
            @click="selectedSegmentCategory = 'CUSTOMER_TIER'"
          >
            {{ $t('financial.profitability.customerTiers') }}
          </button>
        </div>
      </div>

      <!-- CO-PA Executive KPI Cards -->
      <div class="kpi-grid">
        <div class="glass-card kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">{{ $t('financial.profitability.netRevenue') }}</span>
            <TrendingUp class="kpi-icon-svg" style="color: #3b82f6;" />
          </div>
          <div class="kpi-value">{{ formatCurrency(filteredCopaSummary.totalNetRevenue) }}</div>
          <div class="kpi-trend positive">
            <span>Gross: {{ formatCurrency(filteredCopaSummary.totalGrossRevenue) }}</span>
          </div>
        </div>

        <div class="glass-card kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">{{ $t('financial.profitability.cmI') }}</span>
            <Percent class="kpi-icon-svg" style="color: #10b981;" />
          </div>
          <div class="kpi-value text-green">{{ filteredCopaSummary.overallCMIPercent }}%</div>
          <div class="kpi-trend positive">
            <span>{{ formatCurrency(filteredCopaSummary.totalContributionMarginI) }}</span>
          </div>
        </div>

        <div class="glass-card kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">{{ $t('financial.profitability.cmII') }}</span>
            <Percent class="kpi-icon-svg" style="color: #06b6d4;" />
          </div>
          <div class="kpi-value text-green">{{ filteredCopaSummary.overallCMIIPercent }}%</div>
          <div class="kpi-trend neutral">
            <span>{{ formatCurrency(filteredCopaSummary.totalContributionMarginII) }}</span>
          </div>
        </div>

        <div class="glass-card kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">{{ $t('financial.profitability.operatingProfit') }}</span>
            <DollarSign class="kpi-icon-svg" style="color: #8b5cf6;" />
          </div>
          <div class="kpi-value text-green">{{ formatCurrency(filteredCopaSummary.totalOperatingProfit) }}</div>
          <div class="kpi-trend positive">
            <span>⭐ {{ $t('financial.profitability.overallMargin') }}: {{ filteredCopaSummary.overallOperatingMarginPercent }}%</span>
          </div>
        </div>
      </div>

      <!-- CO-PA Multi-Tier Contribution Margin Waterfall Table -->
      <div class="glass-card statement-card">
        <div class="card-header">
          <div>
            <h3>{{ $t('financial.profitability.title') }}</h3>
            <span class="card-subtitle">{{ $t('financial.profitability.subtitle') }}</span>
          </div>
          <div class="segment-badges">
            <span class="badge badge-success">🏆 {{ $t('financial.profitability.topSegmentBadge') }}: {{ copaReport.summary.topPerformingSegment }}</span>
          </div>
        </div>

        <div class="table-container scrollable-table">
          <table class="sutra-table">
            <thead>
              <tr>
                <th>Segment Name</th>
                <th>{{ $t('financial.profitability.netRevenue') }}</th>
                <th>{{ $t('financial.profitability.directMaterials') }}</th>
                <th>{{ $t('financial.profitability.cmI') }}</th>
                <th>{{ $t('financial.profitability.varProdFreight') }}</th>
                <th>{{ $t('financial.profitability.cmII') }}</th>
                <th>{{ $t('financial.profitability.directSalesMktg') }}</th>
                <th>{{ $t('financial.profitability.cmIII') }}</th>
                <th>{{ $t('financial.profitability.allocatedFixed') }}</th>
                <th>{{ $t('financial.profitability.operatingProfit') }}</th>
                <th>EBIT Margin</th>
                <th>{{ $t('financial.profitability.breakevenRevenue') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="seg in filteredSegments" :key="seg.segmentId">
                <td>
                  <strong>{{ seg.segmentName }}</strong>
                  <div class="text-dim text-xs">{{ seg.category }}</div>
                </td>
                <td class="amount-cell">{{ formatCurrency(seg.netRevenue) }}</td>
                <td class="amount-cell negative">({{ formatCurrency(seg.directMaterialCost) }})</td>
                <td class="amount-cell positive">
                  <strong>{{ formatCurrency(seg.contributionMarginI) }}</strong>
                  <div class="text-xs text-green">{{ seg.contributionMarginIRatio }}%</div>
                </td>
                <td class="amount-cell negative">({{ formatCurrency(seg.variableProductionAndFreight) }})</td>
                <td class="amount-cell positive">
                  <strong>{{ formatCurrency(seg.contributionMarginII) }}</strong>
                  <div class="text-xs text-green">{{ seg.contributionMarginIIRatio }}%</div>
                </td>
                <td class="amount-cell negative">({{ formatCurrency(seg.directSalesAndMarketingCost) }})</td>
                <td class="amount-cell positive">{{ formatCurrency(seg.contributionMarginIII) }}</td>
                <td class="amount-cell negative">({{ formatCurrency(seg.allocatedFixedOverheads) }})</td>
                <td class="amount-cell grand-total">
                  <strong>{{ formatCurrency(seg.operatingProfit) }}</strong>
                </td>
                <td class="amount-cell text-green">
                  <strong>{{ seg.operatingMarginRatio }}%</strong>
                </td>
                <td class="amount-cell">{{ formatCurrency(seg.breakevenRevenue) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- TAB 4: DUPONT FINANCIAL DECOMPOSITION -->
    <template v-else-if="activeTab === 'dupont'">
      <!-- DuPont Top KPI Strip -->
      <div class="kpi-grid">
        <div class="glass-card kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">{{ $t('financial.dupont.roe') }}</span>
            <TrendingUp class="kpi-icon-svg" style="color: #10b981;" />
          </div>
          <div class="kpi-value text-green">{{ dupontData.threeStep.returnOnEquityPercent }}%</div>
          <div class="kpi-trend positive">
            <span>{{ $t('financial.dupont.healthRating') }}: {{ dupontData.healthAssessment.capitalEfficiencyRating }}</span>
          </div>
        </div>

        <div class="glass-card kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">{{ $t('financial.dupont.roa') }}</span>
            <Percent class="kpi-icon-svg" style="color: #3b82f6;" />
          </div>
          <div class="kpi-value text-blue">{{ dupontData.threeStep.returnOnAssetsPercent }}%</div>
          <div class="kpi-trend neutral">
            <span>Total Assets: {{ formatCurrency(16500000) }}</span>
          </div>
        </div>

        <div class="glass-card kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">{{ $t('financial.dupont.primaryDriver') }}</span>
            <Award class="kpi-icon-svg" style="color: #f59e0b;" />
          </div>
          <div class="kpi-value text-amber">{{ dupontData.healthAssessment.profitabilityDriver }}</div>
          <div class="kpi-trend positive">
            <span>{{ dupontData.healthAssessment.profitabilityDriver === 'MARGIN' ? $t('financial.dupont.driverMargin') : $t('financial.dupont.driverEfficiency') }}</span>
          </div>
        </div>

        <div class="glass-card kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">{{ $t('financial.dupont.leverageRisk') }}</span>
            <ShieldCheck class="kpi-icon-svg" style="color: #06b6d4;" />
          </div>
          <div class="kpi-value" :class="dupontData.healthAssessment.leverageRisk === 'LOW' ? 'text-green' : 'text-amber'">
            {{ dupontData.healthAssessment.leverageRisk }}
          </div>
          <div class="kpi-trend neutral">
            <span>Multiplier: {{ dupontData.threeStep.equityMultiplier }}x</span>
          </div>
        </div>
      </div>

      <!-- 3-Step Classic DuPont Decomposition Card -->
      <div class="glass-card statement-card">
        <div class="card-header">
          <div>
            <h3>{{ $t('financial.dupont.threeStepTitle') }}</h3>
            <span class="card-subtitle">ROE = Net Profit Margin × Asset Turnover × Financial Leverage</span>
          </div>
          <span class="badge badge-info">Classic DuPont</span>
        </div>

        <div class="formula-breakdown-grid">
          <div class="formula-step-card glass-card">
            <span class="step-num">Step 1</span>
            <h4>{{ $t('financial.dupont.netProfitMargin') }}</h4>
            <div class="step-val">{{ dupontData.threeStep.netProfitMarginPercent }}%</div>
            <div class="step-sub">Net Income / Revenue</div>
            <div class="step-desc">Reflects pricing power, unit cost containment, and operating efficiency.</div>
          </div>

          <div class="formula-operator">×</div>

          <div class="formula-step-card glass-card">
            <span class="step-num">Step 2</span>
            <h4>{{ $t('financial.dupont.assetTurnover') }}</h4>
            <div class="step-val">{{ dupontData.threeStep.assetTurnover }}x</div>
            <div class="step-sub">Revenue / Total Assets</div>
            <div class="step-desc">Reflects how rapidly assets generate top-line business velocity.</div>
          </div>

          <div class="formula-operator">×</div>

          <div class="formula-step-card glass-card">
            <span class="step-num">Step 3</span>
            <h4>{{ $t('financial.dupont.financialLeverage') }}</h4>
            <div class="step-val">{{ dupontData.threeStep.equityMultiplier }}x</div>
            <div class="step-sub">Total Assets / Total Equity</div>
            <div class="step-desc">Measures the extent to which debt amplifies shareholder capital return.</div>
          </div>

          <div class="formula-operator">=</div>

          <div class="formula-step-card glass-card highlight-step">
            <span class="step-num">Return</span>
            <h4>{{ $t('financial.dupont.roe') }}</h4>
            <div class="step-val text-green">{{ dupontData.threeStep.returnOnEquityPercent }}%</div>
            <div class="step-sub">Compound Shareholder Return</div>
            <div class="step-desc">Integrated corporate return on invested shareholder net worth.</div>
          </div>
        </div>
      </div>

      <!-- 5-Step Extended DuPont Decomposition Card -->
      <div class="glass-card statement-card">
        <div class="card-header">
          <div>
            <h3>{{ $t('financial.dupont.fiveStepTitle') }}</h3>
            <span class="card-subtitle">ROE = Operating Margin × Asset Turnover × Interest Burden × Tax Burden × Equity Multiplier</span>
          </div>
          <span class="badge badge-success">Advanced S/4HANA DuPont</span>
        </div>

        <div class="five-step-grid">
          <div class="mini-factor-card">
            <div class="factor-header">Operating Margin</div>
            <div class="factor-val">{{ dupontData.fiveStep.operatingMarginPercent }}%</div>
            <div class="factor-formula">EBIT / Revenue</div>
          </div>
          <div class="mini-factor-card">
            <div class="factor-header">Asset Turnover</div>
            <div class="factor-val">{{ dupontData.fiveStep.assetTurnover }}x</div>
            <div class="factor-formula">Revenue / Assets</div>
          </div>
          <div class="mini-factor-card">
            <div class="factor-header">{{ $t('financial.dupont.interestBurden') }}</div>
            <div class="factor-val">{{ dupontData.fiveStep.interestBurdenRatio }}</div>
            <div class="factor-formula">EBT / EBIT</div>
          </div>
          <div class="mini-factor-card">
            <div class="factor-header">{{ $t('financial.dupont.taxBurden') }}</div>
            <div class="factor-val">{{ dupontData.fiveStep.taxBurdenRatio }}</div>
            <div class="factor-formula">Net Income / EBT</div>
          </div>
          <div class="mini-factor-card">
            <div class="factor-header">Equity Multiplier</div>
            <div class="factor-val">{{ dupontData.fiveStep.equityMultiplier }}x</div>
            <div class="factor-formula">Assets / Equity</div>
          </div>
        </div>
      </div>

      <!-- Executive Strategic Insights Card -->
      <div class="glass-card statement-card">
        <div class="card-header">
          <div class="insights-title-row">
            <CheckCircle2 class="icon-sm" style="color: #10b981;" />
            <h3>{{ $t('financial.dupont.insightsTitle') }}</h3>
          </div>
        </div>
        <div class="insights-list">
          <div v-for="(insight, idx) in dupontData.healthAssessment.insights" :key="idx" class="insight-item">
            <span class="insight-bullet">✦</span>
            <p>{{ insight }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  TrendingUp,
  Percent,
  DollarSign,
  Scale,
  Sliders,
  RotateCcw,
  Activity,
  Layers,
  Award,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-vue-next';
import { useI18n } from '../i18n';

const { t, formatCurrency, formatPercent, currencySymbol, currentCurrency } = useI18n();

// Tab state: 'overview' | 'cashFlow' | 'profitability' | 'dupont'
const activeTab = ref<'overview' | 'cashFlow' | 'profitability' | 'dupont'>('overview');

// ---------------------------------------------------------
// TAB 1: EXECUTIVE OVERVIEW & SENSITIVITY SIMULATOR STATE
// ---------------------------------------------------------
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

const baselineGrossOperatingProfit = computed(() => figures.value.revenue - figures.value.cogs);
const baselineTotalOpex = computed(() => figures.value.salaries + figures.value.admin);
const baselineNetOperatingProfit = computed(() => baselineGrossOperatingProfit.value - baselineTotalOpex.value);

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

// ---------------------------------------------------------
// TAB 2: CASH FLOW STATEMENT (IAS 7 / AS 3) STATE
// ---------------------------------------------------------
const cashFlowData = ref({
  periodStart: '2026-04-01',
  periodEnd: '2027-03-31',
  operatingActivities: {
    netIncome: 3500000,
    adjustments: {
      depreciationAmortization: 800000,
      gainLossOnDisposal: 0,
      financeCosts: 150000,
      totalAdjustments: 950000,
    },
    operatingProfitBeforeWorkingCapital: 4450000,
    workingCapitalChanges: {
      accountsReceivableChange: -800000,
      inventoryChange: -400000,
      accountsPayableChange: 400000,
      otherCurrentLiabilitiesChange: 200000,
      totalWorkingCapitalChange: -600000,
    },
    cashGeneratedFromOperations: 3850000,
    incomeTaxesPaid: 950000,
    netOperatingCashFlow: 2900000,
  },
  investingActivities: {
    capitalExpenditure: -1200000,
    proceedsFromSaleOfAssets: 100000,
    netInvestingCashFlow: -1100000,
  },
  financingActivities: {
    proceedsFromShareCapital: 0,
    proceedsFromBorrowings: 500000,
    repaymentOfBorrowings: -200000,
    dividendsPaid: -600000,
    interestPaid: -150000,
    netFinancingCashFlow: -450000,
  },
  summary: {
    netCashChange: 1350000,
    beginningCash: 3500000,
    endingCash: 4850000,
    freeCashFlowToFirm: 1700000,
    isReconciled: true,
  },
});

function formatSignedCurrency(amount: number) {
  if (amount < 0) {
    return `(${formatCurrency(Math.abs(amount))})`;
  }
  return `+${formatCurrency(amount)}`;
}

// ---------------------------------------------------------
// TAB 3: CO-PA SEGMENT PROFITABILITY STATE
// ---------------------------------------------------------
const selectedSegmentCategory = ref<'ALL' | 'PRODUCT_LINE' | 'SALES_REGION' | 'CUSTOMER_TIER'>('ALL');

const copaReport = ref({
  summary: {
    topPerformingSegment: 'Enterprise ERP & Cloud Core',
    lowestPerformingSegment: 'Emerging SMB Accounts',
  },
  segments: [
    {
      segmentId: 'SEG-PROD-01',
      segmentName: 'Enterprise ERP & Cloud Core',
      category: 'PRODUCT_LINE',
      grossRevenue: 7500000,
      discountsAndRebates: 300000,
      netRevenue: 7200000,
      directMaterialCost: 1400000,
      contributionMarginI: 5800000,
      contributionMarginIRatio: 80.56,
      variableProductionAndFreight: 800000,
      contributionMarginII: 5000000,
      contributionMarginIIRatio: 69.44,
      directSalesAndMarketingCost: 850000,
      contributionMarginIII: 4150000,
      contributionMarginIIIRatio: 57.64,
      allocatedFixedOverheads: 1100000,
      operatingProfit: 3050000,
      operatingMarginRatio: 42.36,
      breakevenRevenue: 2808000,
    },
    {
      segmentId: 'SEG-PROD-02',
      segmentName: 'Supply Chain & Logistics Cockpit',
      category: 'PRODUCT_LINE',
      grossRevenue: 3200000,
      discountsAndRebates: 100000,
      netRevenue: 3100000,
      directMaterialCost: 950000,
      contributionMarginI: 2150000,
      contributionMarginIRatio: 69.35,
      variableProductionAndFreight: 580000,
      contributionMarginII: 1570000,
      contributionMarginIIRatio: 50.65,
      directSalesAndMarketingCost: 420000,
      contributionMarginIII: 1150000,
      contributionMarginIIIRatio: 37.1,
      allocatedFixedOverheads: 550000,
      operatingProfit: 600000,
      operatingMarginRatio: 19.35,
      breakevenRevenue: 1915000,
    },
    {
      segmentId: 'SEG-PROD-03',
      segmentName: 'Regulatory Tax & Treasury Add-on',
      category: 'PRODUCT_LINE',
      grossRevenue: 1800000,
      discountsAndRebates: 50000,
      netRevenue: 1750000,
      directMaterialCost: 250000,
      contributionMarginI: 1500000,
      contributionMarginIRatio: 85.71,
      variableProductionAndFreight: 200000,
      contributionMarginII: 1300000,
      contributionMarginIIRatio: 74.29,
      directSalesAndMarketingCost: 220000,
      contributionMarginIII: 1080000,
      contributionMarginIIIRatio: 61.71,
      allocatedFixedOverheads: 300000,
      operatingProfit: 780000,
      operatingMarginRatio: 44.57,
      breakevenRevenue: 700000,
    },
    {
      segmentId: 'SEG-REG-NORTH',
      segmentName: 'India - North Zone (Delhi NCR, Punjab, UP)',
      category: 'SALES_REGION',
      grossRevenue: 4200000,
      discountsAndRebates: 150000,
      netRevenue: 4050000,
      directMaterialCost: 900000,
      contributionMarginI: 3150000,
      contributionMarginIRatio: 77.78,
      variableProductionAndFreight: 530000,
      contributionMarginII: 2620000,
      contributionMarginIIRatio: 64.69,
      directSalesAndMarketingCost: 450000,
      contributionMarginIII: 2170000,
      contributionMarginIIIRatio: 53.58,
      allocatedFixedOverheads: 650000,
      operatingProfit: 1520000,
      operatingMarginRatio: 37.53,
      breakevenRevenue: 1700000,
    },
    {
      segmentId: 'SEG-REG-SOUTH',
      segmentName: 'India - South Zone (Bengaluru, Chennai, Hyderabad)',
      category: 'SALES_REGION',
      grossRevenue: 5100000,
      discountsAndRebates: 180000,
      netRevenue: 4920000,
      directMaterialCost: 1050000,
      contributionMarginI: 3870000,
      contributionMarginIRatio: 78.66,
      variableProductionAndFreight: 610000,
      contributionMarginII: 3260000,
      contributionMarginIIRatio: 66.26,
      directSalesAndMarketingCost: 580000,
      contributionMarginIII: 2680000,
      contributionMarginIIIRatio: 54.47,
      allocatedFixedOverheads: 750000,
      operatingProfit: 1930000,
      operatingMarginRatio: 39.23,
      breakevenRevenue: 2007000,
    },
    {
      segmentId: 'SEG-REG-EXPORT',
      segmentName: 'Export Markets (EMEA & North America)',
      category: 'SALES_REGION',
      grossRevenue: 3200000,
      discountsAndRebates: 120000,
      netRevenue: 3080000,
      directMaterialCost: 650000,
      contributionMarginI: 2430000,
      contributionMarginIRatio: 78.9,
      variableProductionAndFreight: 440000,
      contributionMarginII: 1990000,
      contributionMarginIIRatio: 64.61,
      directSalesAndMarketingCost: 460000,
      contributionMarginIII: 1530000,
      contributionMarginIIIRatio: 49.68,
      allocatedFixedOverheads: 550000,
      operatingProfit: 980000,
      operatingMarginRatio: 31.82,
      breakevenRevenue: 1563000,
    },
    {
      segmentId: 'SEG-TIER-ENT',
      segmentName: 'Tier 1 Enterprise Conglomerates',
      category: 'CUSTOMER_TIER',
      grossRevenue: 6800000,
      discountsAndRebates: 220000,
      netRevenue: 6580000,
      directMaterialCost: 1350000,
      contributionMarginI: 5230000,
      contributionMarginIRatio: 79.48,
      variableProductionAndFreight: 790000,
      contributionMarginII: 4440000,
      contributionMarginIIRatio: 67.48,
      directSalesAndMarketingCost: 720000,
      contributionMarginIII: 3720000,
      contributionMarginIIIRatio: 56.53,
      allocatedFixedOverheads: 980000,
      operatingProfit: 2740000,
      operatingMarginRatio: 41.64,
      breakevenRevenue: 2519000,
    },
    {
      segmentId: 'SEG-TIER-MID',
      segmentName: 'Mid-Market Growth Enterprises',
      category: 'CUSTOMER_TIER',
      grossRevenue: 4100000,
      discountsAndRebates: 160000,
      netRevenue: 3940000,
      directMaterialCost: 920000,
      contributionMarginI: 3020000,
      contributionMarginIRatio: 76.65,
      variableProductionAndFreight: 550000,
      contributionMarginII: 2470000,
      contributionMarginIIRatio: 62.69,
      directSalesAndMarketingCost: 510000,
      contributionMarginIII: 1960000,
      contributionMarginIIIRatio: 49.75,
      allocatedFixedOverheads: 670000,
      operatingProfit: 1290000,
      operatingMarginRatio: 32.74,
      breakevenRevenue: 1882000,
    },
    {
      segmentId: 'SEG-TIER-SMB',
      segmentName: 'Emerging SMB Accounts',
      category: 'CUSTOMER_TIER',
      grossRevenue: 1600000,
      discountsAndRebates: 70000,
      netRevenue: 1530000,
      directMaterialCost: 330000,
      contributionMarginI: 1200000,
      contributionMarginIRatio: 78.43,
      variableProductionAndFreight: 240000,
      contributionMarginII: 960000,
      contributionMarginIIRatio: 62.75,
      directSalesAndMarketingCost: 260000,
      contributionMarginIII: 700000,
      contributionMarginIIIRatio: 45.75,
      allocatedFixedOverheads: 300000,
      operatingProfit: 400000,
      operatingMarginRatio: 26.14,
      breakevenRevenue: 892000,
    },
  ],
});

const filteredSegments = computed(() => {
  if (selectedSegmentCategory.value === 'ALL') {
    return copaReport.value.segments;
  }
  return copaReport.value.segments.filter((s) => s.category === selectedSegmentCategory.value);
});

const filteredCopaSummary = computed(() => {
  const segs = filteredSegments.value;
  const totalGrossRevenue = segs.reduce((sum, s) => sum + s.grossRevenue, 0);
  const totalNetRevenue = segs.reduce((sum, s) => sum + s.netRevenue, 0);
  const totalContributionMarginI = segs.reduce((sum, s) => sum + s.contributionMarginI, 0);
  const overallCMIPercent = totalNetRevenue > 0 ? Math.round((totalContributionMarginI / totalNetRevenue) * 10000) / 100 : 0;
  const totalContributionMarginII = segs.reduce((sum, s) => sum + s.contributionMarginII, 0);
  const overallCMIIPercent = totalNetRevenue > 0 ? Math.round((totalContributionMarginII / totalNetRevenue) * 10000) / 100 : 0;
  const totalOperatingProfit = segs.reduce((sum, s) => sum + s.operatingProfit, 0);
  const overallOperatingMarginPercent = totalNetRevenue > 0 ? Math.round((totalOperatingProfit / totalNetRevenue) * 10000) / 100 : 0;

  return {
    totalGrossRevenue,
    totalNetRevenue,
    totalContributionMarginI,
    overallCMIPercent,
    totalContributionMarginII,
    overallCMIIPercent,
    totalOperatingProfit,
    overallOperatingMarginPercent,
  };
});

// ---------------------------------------------------------
// TAB 4: DUPONT PERFORMANCE DECOMPOSITION STATE
// ---------------------------------------------------------
const dupontData = ref({
  threeStep: {
    netProfitMargin: 0.2917,
    netProfitMarginPercent: 29.17,
    assetTurnover: 0.7273,
    equityMultiplier: 1.9412,
    returnOnEquityPercent: 41.18,
    returnOnAssetsPercent: 21.21,
  },
  fiveStep: {
    operatingMarginPercent: 29.17,
    assetTurnover: 0.7273,
    interestBurdenRatio: 0.9571,
    taxBurdenRatio: 1.0448,
    equityMultiplier: 1.9412,
    returnOnEquityPercent: 41.18,
  },
  healthAssessment: {
    profitabilityDriver: 'MARGIN' as 'MARGIN' | 'EFFICIENCY' | 'LEVERAGE',
    leverageRisk: 'LOW' as 'LOW' | 'MODERATE' | 'HIGH',
    capitalEfficiencyRating: 'EXCELLENT' as 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION',
    insights: [
      'Strong operating margin of 29.17% is the primary engine of ROE generation.',
      'Conservative leverage structure maintains resilient balance sheet cushion.',
      'Asset turnover velocity of 0.73x offers substantial upside for further asset sweat and inventory velocity optimization.',
      'Double-digit ROE of 41.18% substantially outperforms the cost of enterprise capital.',
    ],
  },
});
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

/* Tabs Navigation Bar */
.tabs-nav-bar {
  display: flex;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  background: rgba(15, 23, 42, 0.6);
  flex-wrap: wrap;
}

.subtab-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 10px 20px;
  font-size: 0.88rem;
  font-weight: 600;
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 8px;
}

.subtab-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.subtab-btn.active {
  background: var(--brand-blue);
  color: #fff;
  box-shadow: 0 2px 10px rgba(59, 130, 246, 0.4);
}

/* Filter Toolbar */
.filter-toolbar {
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
}

.filter-chips {
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
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 0.8rem;
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

.text-green { color: #34d399 !important; }
.text-red { color: #f87171 !important; }
.text-blue { color: #38bdf8 !important; }
.text-amber { color: #fbbf24 !important; }
.text-xs { font-size: 0.74rem; }
.text-dim { color: var(--text-dim); }

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

.icon-xs { width: 14px; height: 14px; }
.icon-sm { width: 18px; height: 18px; }

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

.table-container {
  overflow-x: auto;
}

.scrollable-table {
  max-height: 520px;
  overflow-y: auto;
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

/* DuPont Formula Breakdown Styles */
.formula-breakdown-grid {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 0;
}

.formula-step-card {
  flex: 1;
  min-width: 180px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--border-subtle);
}

.highlight-step {
  border-color: rgba(16, 185, 129, 0.5);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%);
}

.step-num {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--brand-blue);
  letter-spacing: 0.05em;
}

.formula-step-card h4 {
  font-size: 0.92rem;
}

.step-val {
  font-size: 1.5rem;
  font-weight: 700;
  font-family: 'Outfit', sans-serif;
  color: #fff;
}

.step-sub {
  font-size: 0.76rem;
  color: #38bdf8;
  font-family: 'JetBrains Mono', monospace;
}

.step-desc {
  font-size: 0.76rem;
  color: var(--text-dim);
  line-height: 1.3;
}

.formula-operator {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-muted);
}

/* 5-Step Factor Grid */
.five-step-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.mini-factor-card {
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.factor-header {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
}

.factor-val {
  font-size: 1.3rem;
  font-weight: 700;
  font-family: 'Outfit', sans-serif;
  color: #fff;
}

.factor-formula {
  font-size: 0.74rem;
  color: #38bdf8;
  font-family: 'JetBrains Mono', monospace;
}

/* Strategic Insights */
.insights-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.insights-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.insight-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: rgba(255, 255, 255, 0.02);
  padding: 12px 16px;
  border-radius: var(--radius-xs);
  border-left: 3px solid var(--brand-blue);
}

.insight-bullet {
  color: var(--brand-blue);
  font-size: 0.9rem;
}

.insight-item p {
  font-size: 0.88rem;
  color: var(--text-normal);
  line-height: 1.4;
  margin: 0;
}
</style>

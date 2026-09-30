<template>
  <div class="view-container">
    <div class="hero-banner glass-card">
      <div class="hero-content">
        <h2>📊 {{ $t('financial.heroTitle') }}</h2>
        <p>{{ $t('financial.heroSubtitle') }}</p>
      </div>
      <div class="hero-meta">
        <span class="badge badge-success">{{ $t('financial.auditStatus') }}</span>
        <span class="badge badge-info">{{ $t('financial.currencyBadge', { code: currentCurrency, symbol: currencySymbol }) }}</span>
      </div>
    </div>

    <div class="statements-grid">
      <!-- Statement 1: Profit & Loss -->
      <div class="glass-card statement-card">
        <div class="card-header">
          <div>
            <h3>{{ $t('financial.pnlTitle') }}</h3>
            <span class="card-subtitle">{{ $t('financial.pnlPeriod') }}</span>
          </div>
          <span class="badge badge-success">{{ $t('financial.operatingMargin', { value: formatPercent(operatingMargin) }) }}</span>
        </div>

        <div class="table-container">
          <table class="sutra-table">
            <tbody>
              <tr class="section-row">
                <td colspan="2"><strong>{{ $t('financial.operatingRevenue') }}</strong></td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.revSubscriptions') }}</td>
                <td class="amount-cell positive">{{ formatCurrency(figures.revenue) }}</td>
              </tr>
              <tr class="subtotal-row">
                <td><strong>{{ $t('financial.grossRevenueA') }}</strong></td>
                <td class="amount-cell positive"><strong>{{ formatCurrency(figures.revenue) }}</strong></td>
              </tr>

              <tr class="section-row">
                <td colspan="2"><strong>{{ $t('financial.cogs') }}</strong></td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.cogsCloud') }}</td>
                <td class="amount-cell negative">({{ formatCurrency(figures.cogs) }})</td>
              </tr>
              <tr class="subtotal-row">
                <td><strong>{{ $t('financial.costOfSalesB') }}</strong></td>
                <td class="amount-cell negative"><strong>({{ formatCurrency(figures.cogs) }})</strong></td>
              </tr>

              <tr class="highlight-row">
                <td><strong>{{ $t('financial.grossProfit') }}</strong></td>
                <td class="amount-cell"><strong>{{ formatCurrency(grossOperatingProfit) }}</strong></td>
              </tr>

              <tr class="section-row">
                <td colspan="2"><strong>{{ $t('financial.opex') }}</strong></td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.opexSalaries') }}</td>
                <td class="amount-cell negative">({{ formatCurrency(figures.salaries) }})</td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.opexAdmin') }}</td>
                <td class="amount-cell negative">({{ formatCurrency(figures.admin) }})</td>
              </tr>
              <tr class="subtotal-row">
                <td><strong>{{ $t('financial.opexTotalC') }}</strong></td>
                <td class="amount-cell negative"><strong>({{ formatCurrency(totalOpex) }})</strong></td>
              </tr>

              <tr class="final-row">
                <td><strong>{{ $t('financial.netProfitBeforeTax') }}</strong></td>
                <td class="amount-cell grand-total">{{ formatCurrency(netOperatingProfit) }}</td>
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
            <span class="card-subtitle">{{ $t('financial.balanceSheetPeriod') }}</span>
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
                <td class="amount-cell">{{ formatCurrency(figures.cash) }}</td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.assetAR') }}</td>
                <td class="amount-cell">{{ formatCurrency(figures.ar) }}</td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.assetInventory') }}</td>
                <td class="amount-cell">{{ formatCurrency(figures.inventory) }}</td>
              </tr>
              <tr class="highlight-row">
                <td><strong>{{ $t('financial.totalAssets') }}</strong></td>
                <td class="amount-cell grand-total">{{ formatCurrency(totalAssets) }}</td>
              </tr>

              <tr class="section-row">
                <td colspan="2"><strong>{{ $t('financial.liabilities') }}</strong></td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.liabAP') }}</td>
                <td class="amount-cell">{{ formatCurrency(figures.ap) }}</td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.liabTaxes') }}</td>
                <td class="amount-cell">{{ formatCurrency(figures.taxes) }}</td>
              </tr>
              <tr class="subtotal-row">
                <td><strong>{{ $t('financial.totalLiabilities') }}</strong></td>
                <td class="amount-cell"><strong>{{ formatCurrency(totalLiabilities) }}</strong></td>
              </tr>

              <tr class="section-row">
                <td colspan="2"><strong>{{ $t('financial.equity') }}</strong></td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.equityCapital') }}</td>
                <td class="amount-cell">{{ formatCurrency(figures.capital) }}</td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">{{ $t('financial.equityRetained') }}</td>
                <td class="amount-cell">{{ formatCurrency(figures.retainedEarnings) }}</td>
              </tr>
              <tr class="subtotal-row">
                <td><strong>{{ $t('financial.totalEquity') }}</strong></td>
                <td class="amount-cell"><strong>{{ formatCurrency(totalEquity) }}</strong></td>
              </tr>

              <tr class="final-row">
                <td><strong>{{ $t('financial.totalLiabEquity') }}</strong></td>
                <td class="amount-cell grand-total">{{ formatCurrency(totalLiabilitiesAndEquity) }}</td>
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

const grossOperatingProfit = computed(() => figures.value.revenue - figures.value.cogs);
const totalOpex = computed(() => figures.value.salaries + figures.value.admin);
const netOperatingProfit = computed(() => grossOperatingProfit.value - totalOpex.value);
const operatingMargin = computed(() => (netOperatingProfit.value / figures.value.revenue) * 100);

const totalAssets = computed(() => figures.value.cash + figures.value.ar + figures.value.inventory);
const totalLiabilities = computed(() => figures.value.ap + figures.value.taxes);
const totalEquity = computed(() => figures.value.capital + figures.value.retainedEarnings);
const totalLiabilitiesAndEquity = computed(() => totalLiabilities.value + totalEquity.value);
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

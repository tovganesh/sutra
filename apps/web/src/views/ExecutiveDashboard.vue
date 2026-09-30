<template>
  <div class="view-container">
    <!-- Top KPI Grid -->
    <div class="kpi-grid">
      <div class="glass-card kpi-card" v-for="kpi in kpis" :key="kpi.id">
        <div class="kpi-header">
          <span class="kpi-title">{{ kpi.title }}</span>
          <component :is="kpi.icon" class="kpi-icon-svg" :style="{ color: kpi.accentColor }" />
        </div>
        <div class="kpi-value">{{ kpi.value }}</div>
        <div class="kpi-trend" :class="kpi.trendType">
          <span>{{ kpi.trendIcon }} {{ kpi.trendText }}</span>
        </div>
      </div>
    </div>

    <!-- Main Analytics & Parity Grid -->
    <div class="analytics-grid">
      <!-- Interactive Revenue & Cash Flow Chart -->
      <div class="glass-card chart-card">
        <div class="card-header">
          <div>
            <h3>{{ $t('dashboard.chart.title') }}</h3>
            <span class="card-subtitle">{{ $t('dashboard.chart.subtitle') }}</span>
          </div>
          <div class="chart-legend">
            <span class="legend-item"><span class="dot blue"></span> {{ $t('dashboard.chart.revenue') }}</span>
            <span class="legend-item"><span class="dot purple"></span> {{ $t('dashboard.chart.cashInflow') }}</span>
            <span class="legend-item"><span class="dot cyan"></span> {{ $t('dashboard.chart.netMargin') }}</span>
          </div>
        </div>

        <div class="svg-chart-wrapper">
          <svg viewBox="0 0 800 240" class="interactive-chart">
            <defs>
              <linearGradient id="chartGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.35" />
                <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0" />
              </linearGradient>
            </defs>
            <!-- Grid Lines -->
            <line x1="50" y1="40" x2="780" y2="40" stroke="rgba(255,255,255,0.06)" />
            <line x1="50" y1="90" x2="780" y2="90" stroke="rgba(255,255,255,0.06)" />
            <line x1="50" y1="140" x2="780" y2="140" stroke="rgba(255,255,255,0.06)" />
            <line x1="50" y1="190" x2="780" y2="190" stroke="rgba(255,255,255,0.06)" />

            <!-- Area Fill -->
            <polygon points="50,190 120,160 210,135 300,145 390,110 480,95 570,80 660,60 750,45 750,190 50,190" fill="url(#chartGlow)" />
            
            <!-- Spline Line -->
            <polyline
              points="50,190 120,160 210,135 300,145 390,110 480,95 570,80 660,60 750,45"
              fill="none"
              stroke="#3b82f6"
              stroke-width="3.5"
              stroke-linecap="round"
            />

            <!-- Cash Inflow Line -->
            <polyline
              points="50,200 120,180 210,150 300,160 390,130 480,120 570,105 660,85 750,70"
              fill="none"
              stroke="#8b5cf6"
              stroke-width="2.5"
              stroke-dasharray="6,4"
              stroke-linecap="round"
            />

            <!-- Data Points -->
            <circle cx="210" cy="135" r="4.5" fill="#3b82f6" />
            <circle cx="390" cy="110" r="4.5" fill="#3b82f6" />
            <circle cx="570" cy="80" r="4.5" fill="#3b82f6" />
            <circle cx="750" cy="45" r="6" fill="#06b6d4" />

            <!-- Month Axis Labels (Locale-Aware Dynamic Formatting) -->
            <text
              v-for="m in chartMonths"
              :key="m.name + m.x"
              :x="m.x"
              y="215"
              fill="#64748b"
              font-size="11"
              text-anchor="middle"
            >
              {{ m.name }}
            </text>
          </svg>
        </div>
      </div>

      <!-- SAP Parity Matrix -->
      <div class="glass-card parity-card">
        <div class="card-header">
          <div>
            <h3>{{ $t('dashboard.parity.title') }}</h3>
            <span class="card-subtitle">{{ $t('dashboard.parity.subtitle') }}</span>
          </div>
          <span class="badge badge-success">{{ $t('dashboard.parity.badge') }}</span>
        </div>

        <div class="table-container">
          <table class="sutra-table">
            <thead>
              <tr>
                <th>{{ $t('dashboard.parity.colCapability') }}</th>
                <th>{{ $t('dashboard.parity.colSap') }}</th>
                <th>{{ $t('dashboard.parity.colSutra') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in parityRows" :key="row.tcode">
                <td>
                  <strong>{{ row.tcode }}</strong>
                  <div style="font-size: 0.74rem; color: var(--text-dim);">{{ row.capability }}</div>
                </td>
                <td style="font-size: 0.82rem;">{{ row.sap }}</td>
                <td style="font-size: 0.82rem; color: var(--brand-blue);">{{ row.sutra }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { TrendingUp, Clock, Scale, Sparkles } from 'lucide-vue-next';
import { useI18n } from '../i18n';

const { t, formatCurrency, localeConfig } = useI18n();

const kpis = computed(() => [
  {
    id: 1,
    title: t('dashboard.kpis.revenue'),
    value: formatCurrency(12000000),
    icon: TrendingUp,
    accentColor: '#3b82f6',
    trendType: 'positive',
    trendIcon: '↑',
    trendText: t('dashboard.kpis.revenueTrend'),
  },
  {
    id: 2,
    title: t('dashboard.kpis.dso'),
    value: `42 ${t('dashboard.kpis.daysUnit')}`,
    icon: Clock,
    accentColor: '#10b981',
    trendType: 'positive',
    trendIcon: '↓',
    trendText: t('dashboard.kpis.dsoTrend'),
  },
  {
    id: 3,
    title: t('dashboard.kpis.liquidity'),
    value: '3.43x',
    icon: Scale,
    accentColor: '#8b5cf6',
    trendType: 'neutral',
    trendIcon: '⚖️',
    trendText: t('dashboard.kpis.liquidityTrend'),
  },
  {
    id: 4,
    title: t('dashboard.kpis.margin'),
    value: '29.17%',
    icon: Sparkles,
    accentColor: '#06b6d4',
    trendType: 'positive',
    trendIcon: '💎',
    trendText: t('dashboard.kpis.netProfitTrend', { amount: formatCurrency(3500000) }),
  },
]);
const chartMonths = computed(() => {
  const months = [3, 4, 5, 6, 7, 8, 9, 10, 11]; // Apr - Dec
  const locale = localeConfig.value?.code || 'en-IN';
  const formatter = new Intl.DateTimeFormat(locale, { month: 'short' });
  return months.map((m, idx) => {
    const d = new Date(2026, m, 1);
    return {
      name: formatter.format(d),
      x: 50 + idx * ((750 - 50) / (months.length - 1)),
    };
  });
});

const parityRows = computed(() => [
  {
    tcode: 'FI / CO',
    capability: t('supplyChain.tabs.subledger'),
    sap: 'S/4HANA FI-GL / CO-OM',
    sutra: 'Double-entry, India GST/TDS native, PostgreSQL',
  },
  {
    tcode: 'MM / SD',
    capability: t('supplyChain.tabs.inventory'),
    sap: 'S/4HANA MM-IM / SD-SLS',
    sutra: 'MinIO S3 document vault, Valkey queues, Moving Avg Price',
  },
  {
    tcode: 'PP',
    capability: t('supplyChain.tabs.mfg'),
    sap: 'S/4HANA PP (BOM & Routing)',
    sutra: 'Multi-level BOM explosion, Work Center capacity, WIP tracking',
  },
  {
    tcode: 'FI-AA',
    capability: t('supplyChain.tabs.assets'),
    sap: 'S/4HANA Asset Accounting',
    sutra: 'Companies Act 2013 SLM/WDV depreciation, Asset register',
  },
  {
    tcode: 'QM',
    capability: t('supplyChain.tabs.quality'),
    sap: 'S/4HANA Quality Management',
    sutra: 'Inspection lots, Certificate of Analysis (CoA), Bidirectional batch genealogy',
  },
  {
    tcode: 'CO-CCA',
    capability: t('supplyChain.tabs.controlling'),
    sap: 'S/4HANA Overhead Cost Allocation',
    sutra: 'Secondary cost assessment cycles, Headcount/Sqft driver allocation',
  },
  {
    tcode: 'PM / EAM',
    capability: t('supplyChain.tabs.maintenance'),
    sap: 'S/4HANA Plant Maintenance',
    sutra: 'Preventive schedules, MTBF & MTTR tracking, Breakdown settlement',
  },
  {
    tcode: 'TRM / FI-BL',
    capability: t('supplyChain.tabs.treasury'),
    sap: 'S/4HANA Bank Ledger & Cash Mgmt',
    sutra: 'MT940 parser, 2-way automated reconciliation, 90-day cash liquidity forecast',
  },
  {
    tcode: 'HCM',
    capability: t('supplyChain.tabs.hcm'),
    sap: 'S/4HANA SuccessFactors / Core HR',
    sutra: 'Statutory Payroll (PF/ESI/PT), Loss-of-Pay deductions, GL voucher',
  },
  {
    tcode: 'PS',
    capability: t('supplyChain.tabs.projects'),
    sap: 'S/4HANA Project Systems',
    sutra: 'WBS hierarchy, CWIP tracking, Capitalization into Fixed Assets',
  },
  {
    tcode: 'EWM',
    capability: t('supplyChain.tabs.warehouse'),
    sap: 'S/4HANA Extended Warehouse',
    sutra: 'Multi-bin storage topology, FIFO wave picking, Physical inventory cycle count',
  },
  {
    tcode: '0L / 2L',
    capability: t('supplyChain.tabs.multicurrency'),
    sap: 'S/4HANA Parallel Accounting Ledgers',
    sutra: 'Leading & Non-Leading ledgers, IAS 21 Forex revaluation, Multi-jurisdiction tax',
  },
  {
    tcode: 'TM',
    capability: t('supplyChain.tabs.transportation'),
    sap: 'S/4HANA Transportation Management',
    sutra: 'Freight calculation, Dynamic fuel surcharge, e-POD confirmation with OTP',
  },
  {
    tcode: 'Z-Tables & ABAP',
    capability: t('nocode.heroTitle'),
    sap: 'SAP ABAP Dictionary / NetWeaver',
    sutra: 'Dynamic JSONB entities, Visual state machines, Zero-migration schemas',
  },
  {
    tcode: 'Joule AI',
    capability: t('copilot.heroTitle'),
    sap: 'SAP Joule Generative AI',
    sutra: 'Air-gapped private LLMs (Ollama) + Cloud fallback, Zero-Data Leakage',
  },
]);

</script>

<style scoped>
.view-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.kpi-card {
  padding: 22px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kpi-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
}

.kpi-icon-svg {
  width: 22px;
  height: 22px;
}

.kpi-value {
  font-size: 1.85rem;
  font-weight: 800;
  margin: 12px 0 6px;
  letter-spacing: -0.02em;
}

.kpi-trend {
  font-size: 0.78rem;
  font-weight: 600;
}

.kpi-trend.positive { color: var(--status-success); }
.kpi-trend.neutral { color: var(--brand-blue); }

.analytics-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
}

@media (max-width: 1100px) {
  .analytics-grid {
    grid-template-columns: 1fr;
  }
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

.chart-card {
  padding: 24px;
}

.chart-legend {
  display: flex;
  gap: 16px;
  font-size: 0.8rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.dot.blue { background-color: #3b82f6; }
.dot.purple { background-color: #8b5cf6; }
.dot.cyan { background-color: #06b6d4; }

.svg-chart-wrapper {
  width: 100%;
}

.interactive-chart {
  width: 100%;
  height: auto;
  overflow: visible;
}

.parity-card {
  padding: 24px;
}
</style>

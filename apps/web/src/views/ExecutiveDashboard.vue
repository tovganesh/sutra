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

            <!-- Month Axis Labels -->
            <text x="50" y="215" fill="#64748b" font-size="12">Apr</text>
            <text x="120" y="215" fill="#64748b" font-size="12">May</text>
            <text x="210" y="215" fill="#64748b" font-size="12">Jun</text>
            <text x="300" y="215" fill="#64748b" font-size="12">Jul</text>
            <text x="390" y="215" fill="#64748b" font-size="12">Aug</text>
            <text x="480" y="215" fill="#64748b" font-size="12">Sep</text>
            <text x="570" y="215" fill="#64748b" font-size="12">Oct</text>
            <text x="660" y="215" fill="#64748b" font-size="12">Nov</text>
            <text x="750" y="215" fill="#64748b" font-size="12">Dec</text>
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
              <tr>
                <td><strong>FI / CO</strong></td>
                <td>Sutra Ledger &amp; Tax Core</td>
                <td>Double-entry, India GST/TDS native, PostgreSQL</td>
              </tr>
              <tr>
                <td><strong>MM / SD</strong></td>
                <td>Sutra Supply &amp; Commerce</td>
                <td>MinIO S3 document vault, Valkey queues</td>
              </tr>
              <tr>
                <td><strong>Z-Tables &amp; ABAP</strong></td>
                <td>Sutra No-Code Studio</td>
                <td>Dynamic JSONB entities &amp; visual state machines</td>
              </tr>
              <tr>
                <td><strong>SAP SAC / BW</strong></td>
                <td>Sutra Embedded OLAP</td>
                <td>Zero-ETL real-time P&amp;L, Balance Sheet</td>
              </tr>
              <tr>
                <td><strong>SAP Joule AI</strong></td>
                <td>Sutra Gen AI Core</td>
                <td>Local Ollama or Cloud (OpenAI/Gemini), Text-to-ERP</td>
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

const { t, formatCurrency } = useI18n();

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

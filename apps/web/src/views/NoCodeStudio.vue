<template>
  <div class="view-container">
    <div class="hero-banner glass-card">
      <div class="hero-content">
        <h2>🧩 {{ $t('nocode.heroTitle') }}</h2>
        <p>{{ $t('nocode.heroSubtitle') }}</p>
      </div>
      <button class="btn btn-primary" @click="showNewEntityModal = true">
        <Plus class="icon-sm" /> {{ $t('nocode.designEntityBtn') }}
      </button>
    </div>

    <div class="studio-layout">
      <!-- Entity Schema Inspector -->
      <div class="glass-card schema-inspector-card">
        <div class="card-header">
          <div>
            <h3>{{ $t('nocode.activeSchema', { name: activeEntity.name }) }}</h3>
            <span class="card-subtitle">Slug: <code>{{ activeEntity.slug }}</code> • PostgreSQL JSONB</span>
          </div>
          <span class="badge badge-info">{{ $t('nocode.fieldsCount', { count: activeEntity.fields.length }) }}</span>
        </div>

        <div class="fields-list">
          <div class="field-item" v-for="f in activeEntity.fields" :key="f.name">
            <div class="field-meta">
              <strong>{{ f.label }}</strong>
              <code>{{ f.name }}</code>
            </div>
            <div class="field-tags">
              <span class="field-type-tag">{{ f.type }}</span>
              <span v-if="f.required" class="required-tag">{{ $t('common.required') }}</span>
            </div>
          </div>
        </div>

        <div class="schema-footer">
          <button class="btn btn-secondary btn-sm" @click="addFieldPrompt">
            <Plus class="icon-xs" /> {{ $t('nocode.addCustomFieldBtn') }}
          </button>
        </div>
      </div>

      <!-- Live Dynamic Records Table -->
      <div class="glass-card records-card">
        <div class="card-header">
          <div>
            <h3>{{ $t('nocode.liveRecords') }}</h3>
            <span class="card-subtitle">{{ $t('nocode.liveRecordsSub') }}</span>
          </div>
          <button class="btn btn-primary btn-sm" @click="showNewRecordModal = true">
            <Plus class="icon-xs" /> {{ $t('nocode.addRecordBtn') }}
          </button>
        </div>

        <div class="table-container">
          <table class="sutra-table">
            <thead>
              <tr>
                <th>{{ $t('nocode.colSerialTag') }}</th>
                <th>{{ $t('nocode.colDescription') }}</th>
                <th>{{ $t('nocode.colPurchaseCost') }}</th>
                <th>{{ $t('nocode.colStatus') }}</th>
                <th>{{ $t('nocode.colLocation') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in records" :key="r.id">
                <td><strong>{{ r.assetTag }}</strong></td>
                <td>{{ r.description }}</td>
                <td>{{ formatCurrency(r.purchaseCost) }}</td>
                <td>
                  <span class="badge" :class="r.operationalStatus === 'ACTIVE' ? 'badge-success' : 'badge-warning'">
                    {{ r.operationalStatus }}
                  </span>
                </td>
                <td>{{ r.locationSite }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Quick Modal: Add Record -->
    <div v-if="showNewRecordModal" class="modal-backdrop" @click.self="showNewRecordModal = false">
      <div class="glass-card modal-content">
        <div class="card-header">
          <h3>{{ $t('nocode.modalTitle', { name: activeEntity.name }) }}</h3>
          <button class="btn-close" @click="showNewRecordModal = false">✕</button>
        </div>
        <div class="form-group">
          <label>{{ $t('nocode.modalTagLabel') }}</label>
          <input type="text" v-model="newRecord.assetTag" class="input-control" placeholder="e.g. ROBOT-PUN-9901" />
        </div>
        <div class="form-group">
          <label>{{ $t('nocode.modalDescLabel') }}</label>
          <input type="text" v-model="newRecord.description" class="input-control" placeholder="e.g. Automated 6-Axis Welding Robot" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>{{ $t('nocode.modalCostLabel', { symbol: currencySymbol }) }}</label>
            <input type="number" v-model.number="newRecord.purchaseCost" class="input-control" />
          </div>
          <div class="form-group">
            <label>{{ $t('nocode.modalStatusLabel') }}</label>
            <select v-model="newRecord.operationalStatus" class="input-control">
              <option value="ACTIVE">ACTIVE</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
              <option value="DECOMMISSIONED">DECOMMISSIONED</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>{{ $t('nocode.modalLocationLabel') }}</label>
          <input type="text" v-model="newRecord.locationSite" class="input-control" placeholder="e.g. Plant 3 - Talegaon, Pune" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showNewRecordModal = false">{{ $t('common.cancel') }}</button>
          <button class="btn btn-primary" @click="saveRecord">{{ $t('nocode.saveRecordBtn') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Plus } from 'lucide-vue-next';
import { useI18n } from '../i18n';

const { t, formatCurrency, currencySymbol } = useI18n();

const showNewEntityModal = ref(false);
const showNewRecordModal = ref(false);

const activeEntity = ref({
  name: 'Plant & Heavy Machinery',
  slug: 'plant_machinery',
  fields: [
    { name: 'assetTag', label: 'Asset Serial Tag', type: 'text', required: true },
    { name: 'description', label: 'Machine Description', type: 'text', required: true },
    { name: 'purchaseCost', label: 'Purchase Cost', type: 'currency', required: true },
    { name: 'operationalStatus', label: 'Operational Status', type: 'select', required: true },
    { name: 'locationSite', label: 'Manufacturing Plant Location', type: 'text', required: true },
  ],
});

const records = ref([
  {
    id: 'asset-001',
    assetTag: 'CNC-MUM-4401',
    description: '5-Axis High Precision CNC Milling Center',
    purchaseCost: 8500000,
    operationalStatus: 'ACTIVE',
    locationSite: 'Plant 2 - Chakan, Pune, Maharashtra',
  },
  {
    id: 'asset-002',
    assetTag: 'HYD-BLR-1209',
    description: '200-Ton Hydraulic Stamping Press',
    purchaseCost: 4200000,
    operationalStatus: 'MAINTENANCE',
    locationSite: 'Plant 1 - Peenya, Bengaluru, Karnataka',
  },
  {
    id: 'asset-003',
    assetTag: 'SMT-NOI-0081',
    description: 'High-Speed Automated SMT Pick & Place Line',
    purchaseCost: 11500000,
    operationalStatus: 'ACTIVE',
    locationSite: 'Plant 3 - Sector 62, Noida, Uttar Pradesh',
  },
]);

const newRecord = ref({
  assetTag: '',
  description: '',
  purchaseCost: 2500000,
  operationalStatus: 'ACTIVE',
  locationSite: '',
});

function saveRecord() {
  if (!newRecord.value.assetTag || !newRecord.value.description) {
    alert(t('common.error') + ': Please complete mandatory fields');
    return;
  }
  records.value.push({
    id: `asset-${Date.now()}`,
    ...newRecord.value,
  });
  showNewRecordModal.value = false;
  newRecord.value = {
    assetTag: '',
    description: '',
    purchaseCost: 2500000,
    operationalStatus: 'ACTIVE',
    locationSite: '',
  };
}

function addFieldPrompt() {
  const label = prompt('Enter field label (e.g. "Calibration Certificate Number"):');
  if (!label) return;
  const name = label.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
  activeEntity.value.fields.push({
    label,
    name,
    type: 'text',
    required: false,
  });
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

.studio-layout {
  display: grid;
  grid-template-columns: 1fr 1.6fr;
  gap: 24px;
}

@media (max-width: 1050px) {
  .studio-layout {
    grid-template-columns: 1fr;
  }
}

.schema-inspector-card, .records-card {
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

.fields-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.field-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}

.field-meta {
  display: flex;
  flex-direction: column;
}

.field-meta code {
  font-size: 0.75rem;
  color: var(--brand-cyan);
}

.field-tags {
  display: flex;
  gap: 6px;
  align-items: center;
}

.field-type-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  padding: 3px 8px;
  background: rgba(59, 130, 246, 0.15);
  color: var(--brand-blue);
  border-radius: 4px;
}

.required-tag {
  font-size: 0.7rem;
  color: var(--status-warning);
  font-weight: 600;
}

.icon-xs {
  width: 14px;
  height: 14px;
}

.icon-sm {
  width: 16px;
  height: 16px;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 100%;
  max-width: 520px;
  padding: 28px;
}

.btn-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.2rem;
  cursor: pointer;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
</style>

<template>
  <div class="view-container">
    <!-- Hero Banner with Entity Quick Stats -->
    <div class="hero-banner glass-card">
      <div class="hero-content">
        <h2>🧩 {{ $t('nocode.heroTitle') }}</h2>
        <p>{{ $t('nocode.heroSubtitle') }}</p>
        <div class="hero-stats">
          <span class="stat-pill">
            <Layers class="icon-xs" />
            {{ $t('nocode.totalEntities', { count: schemas.length }) }}
          </span>
          <span class="stat-pill">
            <Database class="icon-xs" />
            {{ $t('nocode.totalRecords', { count: totalIndexedRecords }) }}
          </span>
        </div>
      </div>
      <div class="hero-actions">
        <button class="btn btn-primary" @click="openCreateEntityModal">
          <Plus class="icon-sm" /> {{ $t('nocode.designEntityBtn') }}
        </button>
      </div>
    </div>

    <!-- Active Entity Switcher Bar -->
    <div class="entity-selector-bar glass-card">
      <span class="selector-label">
        <Sliders class="icon-xs" /> {{ $t('nocode.selectEntity') }}:
      </span>
      <div class="entity-pills-scroll">
        <button
          v-for="s in schemas"
          :key="s.slug"
          class="entity-pill"
          :class="{ active: s.slug === activeSlug }"
          @click="switchSchema(s.slug)"
        >
          <span class="entity-pill-icon">
            <component :is="getEntityIcon(s.icon)" class="icon-xs" />
          </span>
          <span class="entity-pill-title">{{ s.name }}</span>
          <span class="pill-badge">{{ getRecordCountForSlug(s.slug) }}</span>
        </button>
      </div>
    </div>

    <!-- Alert Notifications -->
    <div v-if="successMessage" class="alert-banner alert-success">
      <CheckCircle2 class="icon-sm" />
      <span>{{ successMessage }}</span>
      <button class="btn-close-banner" @click="successMessage = null">✕</button>
    </div>
    <div v-if="errorMessage" class="alert-banner alert-danger">
      <AlertCircle class="icon-sm" />
      <span>{{ errorMessage }}</span>
      <button class="btn-close-banner" @click="errorMessage = null">✕</button>
    </div>

    <!-- Main Studio Split Layout -->
    <div v-if="activeSchema" class="studio-layout">
      <!-- Left Column: Schema Definition & Fields Inspector -->
      <div class="glass-card schema-inspector-card">
        <div class="card-header">
          <div>
            <div class="schema-title-row">
              <h3>{{ activeSchema.name }}</h3>
              <button
                v-if="!isSystemSchema(activeSchema.slug)"
                class="btn btn-ghost btn-xs text-danger"
                :title="$t('nocode.deleteSchemaBtn')"
                @click="deleteActiveSchema"
              >
                <Trash2 class="icon-xs" />
              </button>
            </div>
            <span class="card-subtitle">{{ $t('nocode.entitySlugSub', { slug: activeSchema.slug }) }}</span>
            <p v-if="activeSchema.description" class="schema-desc">{{ activeSchema.description }}</p>
          </div>
          <span class="badge badge-info">{{ $t('nocode.fieldsCount', { count: activeSchema.fields.length }) }}</span>
        </div>

        <div class="fields-list">
          <div class="field-item" v-for="f in activeSchema.fields" :key="f.name">
            <div class="field-meta">
              <div class="field-title-line">
                <strong>{{ f.label }}</strong>
                <span v-if="f.required" class="required-star" title="Mandatory field">*</span>
              </div>
              <code>{{ f.name }}</code>
              <div v-if="f.options && f.options.length" class="field-options-preview">
                <span v-for="opt in f.options.slice(0, 3)" :key="opt" class="opt-tag">{{ opt }}</span>
                <span v-if="f.options.length > 3" class="opt-tag text-muted">+{{ f.options.length - 3 }}</span>
              </div>
            </div>
            <div class="field-tags">
              <span class="field-type-tag" :class="`type-${f.type}`">{{ f.type }}</span>
            </div>
          </div>
        </div>

        <div class="schema-footer">
          <button class="btn btn-secondary btn-sm" @click="openAddFieldModal">
            <Plus class="icon-xs" /> {{ $t('nocode.addCustomFieldBtn') }}
          </button>
        </div>
      </div>

      <!-- Right Column: Live Dynamic Records Table -->
      <div class="glass-card records-card">
        <div class="card-header">
          <div>
            <h3>{{ $t('nocode.liveRecords') }}</h3>
            <span class="card-subtitle">{{ $t('nocode.liveRecordsSub') }}</span>
          </div>
          <div class="records-header-actions">
            <button class="btn btn-ghost btn-sm" :disabled="isLoading" @click="fetchRecords">
              <RefreshCw class="icon-xs" :class="{ 'spin-anim': isLoading }" />
            </button>
            <button class="btn btn-primary btn-sm" @click="openNewRecordModal">
              <Plus class="icon-xs" /> {{ $t('nocode.addRecordBtn') }}
            </button>
          </div>
        </div>

        <div class="table-container">
          <table class="sutra-table" v-if="records.length > 0">
            <thead>
              <tr>
                <th v-for="f in activeSchema.fields" :key="f.name">
                  {{ f.label }}
                </th>
                <th class="text-right">{{ $t('nocode.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in records" :key="String(r.id)">
                <td v-for="f in activeSchema.fields" :key="f.name">
                  <!-- Currency Formatted -->
                  <span v-if="f.type === 'currency'" class="font-mono text-cyan">
                    {{ formatCurrency(Number(r[f.name]) || 0) }}
                  </span>
                  <!-- Select Badge -->
                  <span
                    v-else-if="f.type === 'select'"
                    class="badge"
                    :class="getSelectBadgeClass(String(r[f.name]))"
                  >
                    {{ r[f.name] ?? '—' }}
                  </span>
                  <!-- Boolean Status -->
                  <span
                    v-else-if="f.type === 'boolean'"
                    class="badge"
                    :class="r[f.name] ? 'badge-success' : 'badge-neutral'"
                  >
                    {{ r[f.name] ? 'Yes' : 'No' }}
                  </span>
                  <!-- Number -->
                  <span v-else-if="f.type === 'number'" class="font-mono">
                    {{ Number(r[f.name] ?? 0).toLocaleString() }}
                  </span>
                  <!-- Standard Text or Date -->
                  <span v-else>
                    {{ r[f.name] ?? '—' }}
                  </span>
                </td>
                <td class="text-right">
                  <button
                    class="btn btn-ghost btn-xs text-danger"
                    :title="$t('nocode.actions')"
                    @click="deleteRecord(String(r.id))"
                  >
                    <Trash2 class="icon-xs" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Empty State -->
          <div v-else class="empty-state">
            <Database class="empty-icon" />
            <p>{{ $t('nocode.noRecordsFound') }}</p>
            <button class="btn btn-secondary btn-sm" @click="openNewRecordModal">
              <Plus class="icon-xs" /> {{ $t('nocode.addRecordBtn') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal 1: Design Custom Entity Modal -->
    <div v-if="showNewEntityModal" class="modal-backdrop" @click.self="showNewEntityModal = false">
      <div class="glass-card modal-content modal-lg">
        <div class="card-header">
          <h3>🧩 {{ $t('nocode.newEntityModalTitle') }}</h3>
          <button class="btn-close" @click="showNewEntityModal = false">✕</button>
        </div>

        <div class="modal-body-scroll">
          <div class="form-row">
            <div class="form-group">
              <label>{{ $t('nocode.entityNameLabel') }}</label>
              <input
                type="text"
                v-model="newEntityForm.name"
                class="input-control"
                placeholder="e.g. Warehouse Pallet Racks"
                @input="autoGenerateSlug"
              />
            </div>
            <div class="form-group">
              <label>{{ $t('nocode.entitySlugLabel') }}</label>
              <input
                type="text"
                v-model="newEntityForm.slug"
                class="input-control font-mono"
                placeholder="e.g. warehouse_racks"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>{{ $t('nocode.entityDescLabel') }}</label>
              <input
                type="text"
                v-model="newEntityForm.description"
                class="input-control"
                placeholder="e.g. Logistics storage capacity and bin location tracking"
              />
            </div>
            <div class="form-group">
              <label>{{ $t('nocode.entityIconLabel') }}</label>
              <select v-model="newEntityForm.icon" class="input-control">
                <option value="database">Database / Generic Master</option>
                <option value="truck">Truck / Fleet</option>
                <option value="hard-drive">Hard Drive / Datacenter</option>
                <option value="package">Package / Inventory</option>
                <option value="cpu">CPU / Hardware</option>
                <option value="settings">Settings / Machinery</option>
                <option value="layers">Layers / Composite</option>
              </select>
            </div>
          </div>

          <!-- Initial Fields Schema Builder -->
          <div class="fields-builder-section">
            <div class="fields-builder-header">
              <h4>{{ $t('nocode.initialFieldsTitle') }}</h4>
              <button class="btn btn-ghost btn-xs text-primary" @click="addEntityFieldRow">
                {{ $t('nocode.addFieldRow') }}
              </button>
            </div>

            <div class="builder-rows">
              <div
                v-for="(row, idx) in newEntityForm.fields"
                :key="idx"
                class="builder-row glass-subcard"
              >
                <div class="builder-col-name">
                  <input
                    type="text"
                    v-model="row.label"
                    class="input-control input-sm"
                    placeholder="Field Label (e.g. Serial Code)"
                    @input="autoFieldKey(row)"
                  />
                </div>
                <div class="builder-col-key">
                  <input
                    type="text"
                    v-model="row.name"
                    class="input-control input-sm font-mono"
                    placeholder="keyName"
                  />
                </div>
                <div class="builder-col-type">
                  <select v-model="row.type" class="input-control input-sm">
                    <option value="text">{{ $t('nocode.fieldTypes.text') }}</option>
                    <option value="number">{{ $t('nocode.fieldTypes.number') }}</option>
                    <option value="currency">{{ $t('nocode.fieldTypes.currency') }}</option>
                    <option value="date">{{ $t('nocode.fieldTypes.date') }}</option>
                    <option value="boolean">{{ $t('nocode.fieldTypes.boolean') }}</option>
                    <option value="select">{{ $t('nocode.fieldTypes.select') }}</option>
                  </select>
                </div>
                <div class="builder-col-req">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="row.required" />
                    <span>Req</span>
                  </label>
                </div>
                <div v-if="row.type === 'select'" class="builder-col-opt full-row">
                  <input
                    type="text"
                    v-model="row.optionsStr"
                    class="input-control input-sm"
                    placeholder="Options comma-separated: OPTION_1, OPTION_2, OPTION_3"
                  />
                </div>
                <div class="builder-col-del">
                  <button
                    class="btn btn-ghost btn-xs text-danger"
                    :disabled="newEntityForm.fields.length <= 1"
                    @click="removeEntityFieldRow(idx)"
                  >
                    <Trash2 class="icon-xs" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showNewEntityModal = false">{{ $t('common.cancel') }}</button>
          <button class="btn btn-primary" :disabled="isSaving" @click="submitCreateEntity">
            {{ $t('nocode.createEntityBtn') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal 2: Add Custom Field Modal -->
    <div v-if="showAddFieldModal" class="modal-backdrop" @click.self="showAddFieldModal = false">
      <div class="glass-card modal-content">
        <div class="card-header">
          <h3>{{ $t('nocode.newFieldModalTitle', { name: activeSchema?.name }) }}</h3>
          <button class="btn-close" @click="showAddFieldModal = false">✕</button>
        </div>

        <div class="form-group">
          <label>{{ $t('nocode.fieldLabelLabel') }}</label>
          <input
            type="text"
            v-model="newFieldForm.label"
            class="input-control"
            placeholder="e.g. Calibration Certificate Number"
            @input="autoNewFieldKey"
          />
        </div>

        <div class="form-group">
          <label>{{ $t('nocode.fieldKeyLabel') }}</label>
          <input
            type="text"
            v-model="newFieldForm.name"
            class="input-control font-mono"
            placeholder="e.g. calibrationCertNo"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>{{ $t('nocode.fieldTypeLabel') }}</label>
            <select v-model="newFieldForm.type" class="input-control">
              <option value="text">{{ $t('nocode.fieldTypes.text') }}</option>
              <option value="number">{{ $t('nocode.fieldTypes.number') }}</option>
              <option value="currency">{{ $t('nocode.fieldTypes.currency') }}</option>
              <option value="date">{{ $t('nocode.fieldTypes.date') }}</option>
              <option value="boolean">{{ $t('nocode.fieldTypes.boolean') }}</option>
              <option value="select">{{ $t('nocode.fieldTypes.select') }}</option>
            </select>
          </div>
          <div class="form-group form-group-checkbox">
            <label class="checkbox-label-block">
              <input type="checkbox" v-model="newFieldForm.required" />
              <span>{{ $t('nocode.fieldRequiredLabel') }}</span>
            </label>
          </div>
        </div>

        <div v-if="newFieldForm.type === 'select'" class="form-group">
          <label>{{ $t('nocode.fieldOptionsLabel') }}</label>
          <input
            type="text"
            v-model="newFieldForm.optionsStr"
            class="input-control"
            placeholder="e.g. CLASS_A, CLASS_B, CLASS_C"
          />
        </div>

        <div v-if="newFieldForm.type === 'number' || newFieldForm.type === 'currency'" class="form-row">
          <div class="form-group">
            <label>{{ $t('nocode.fieldMinLabel') }}</label>
            <input type="number" v-model.number="newFieldForm.min" class="input-control" placeholder="0" />
          </div>
          <div class="form-group">
            <label>{{ $t('nocode.fieldMaxLabel') }}</label>
            <input type="number" v-model.number="newFieldForm.max" class="input-control" placeholder="999999" />
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showAddFieldModal = false">{{ $t('common.cancel') }}</button>
          <button class="btn btn-primary" :disabled="isSaving" @click="submitAddField">
            {{ $t('nocode.saveFieldBtn') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal 3: Dynamic Add Record Modal -->
    <div v-if="showNewRecordModal" class="modal-backdrop" @click.self="showNewRecordModal = false">
      <div class="glass-card modal-content modal-md">
        <div class="card-header">
          <h3>{{ $t('nocode.modalTitle', { name: activeSchema?.name }) }}</h3>
          <button class="btn-close" @click="showNewRecordModal = false">✕</button>
        </div>

        <div class="modal-body-scroll">
          <div v-for="f in activeSchema?.fields" :key="f.name" class="form-group">
            <label>
              {{ f.label }}
              <span v-if="f.required" class="required-star">*</span>
            </label>

            <!-- Text Input -->
            <input
              v-if="f.type === 'text'"
              type="text"
              v-model="newRecordData[f.name]"
              class="input-control"
              :placeholder="`Enter ${f.label.toLowerCase()}`"
            />

            <!-- Currency Input -->
            <div v-else-if="f.type === 'currency'" class="input-with-symbol">
              <span class="currency-prefix">{{ currencySymbol }}</span>
              <input
                type="number"
                v-model.number="newRecordData[f.name]"
                class="input-control"
                placeholder="0.00"
              />
            </div>

            <!-- Number Input -->
            <input
              v-else-if="f.type === 'number'"
              type="number"
              v-model.number="newRecordData[f.name]"
              class="input-control"
              placeholder="0"
            />

            <!-- Date Input -->
            <input
              v-else-if="f.type === 'date'"
              type="date"
              v-model="newRecordData[f.name]"
              class="input-control font-mono"
            />

            <!-- Select Dropdown -->
            <select
              v-else-if="f.type === 'select'"
              v-model="newRecordData[f.name]"
              class="input-control"
            >
              <option v-for="opt in f.options" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>

            <!-- Boolean Toggle -->
            <label v-else-if="f.type === 'boolean'" class="checkbox-label-block">
              <input type="checkbox" v-model="newRecordData[f.name]" />
              <span>{{ newRecordData[f.name] ? 'Enabled / True' : 'Disabled / False' }}</span>
            </label>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showNewRecordModal = false">{{ $t('common.cancel') }}</button>
          <button class="btn btn-primary" :disabled="isSaving" @click="submitRecord">
            {{ $t('nocode.saveRecordBtn') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Plus,
  Trash2,
  Layers,
  Database,
  Sliders,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Truck,
  HardDrive,
  Package,
  Cpu,
  Settings,
  FileText,
} from 'lucide-vue-next';
import { useI18n } from '../i18n';

const { t, formatCurrency, currencySymbol } = useI18n();

interface EntityFieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'date' | 'boolean' | 'select';
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
}

interface EntitySchemaDefinition {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  fields: EntityFieldDefinition[];
}

const schemas = ref<EntitySchemaDefinition[]>([]);
const activeSlug = ref<string>('plant_machinery');
const records = ref<Array<Record<string, unknown>>>([]);
const allRecordsMap = ref<Record<string, number>>({});

const isLoading = ref<boolean>(false);
const isSaving = ref<boolean>(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

const showNewEntityModal = ref<boolean>(false);
const showAddFieldModal = ref<boolean>(false);
const showNewRecordModal = ref<boolean>(false);

const activeSchema = computed(() => {
  return schemas.value.find((s) => s.slug === activeSlug.value) || schemas.value[0] || null;
});

const totalIndexedRecords = computed(() => {
  return Object.values(allRecordsMap.value).reduce((sum, count) => sum + count, 0);
});

// Modal 1 Form: Design Custom Entity
const newEntityForm = ref({
  name: '',
  slug: '',
  description: '',
  icon: 'database',
  fields: [
    { name: 'itemCode', label: 'Item Identifier Code', type: 'text' as const, required: true, optionsStr: '' },
    { name: 'operationalStatus', label: 'Lifecycle Status', type: 'select' as const, required: true, optionsStr: 'ACTIVE, PENDING, ARCHIVED' },
  ],
});

// Modal 2 Form: Add Custom Field
const newFieldForm = ref({
  name: '',
  label: '',
  type: 'text' as const,
  required: false,
  optionsStr: '',
  min: undefined as number | undefined,
  max: undefined as number | undefined,
});

// Modal 3 Form: Add Record Data Map
const newRecordData = ref<Record<string, unknown>>({});

// Icon resolver helper
function getEntityIcon(iconName?: string) {
  switch (iconName) {
    case 'truck': return Truck;
    case 'hard-drive': return HardDrive;
    case 'package': return Package;
    case 'cpu': return Cpu;
    case 'settings': return Settings;
    case 'layers': return Layers;
    case 'file-text': return FileText;
    default: return Database;
  }
}

function getSelectBadgeClass(val: string) {
  const upper = String(val).toUpperCase();
  if (upper.includes('ACTIVE') || upper.includes('RHEL') || upper.includes('HEAVY')) return 'badge-success';
  if (upper.includes('MAINTENANCE') || upper.includes('CNG') || upper.includes('UBUNTU')) return 'badge-warning';
  if (upper.includes('DECOMMISSIONED') || upper.includes('ARCHIVED')) return 'badge-neutral';
  return 'badge-info';
}

function isSystemSchema(slug: string): boolean {
  return ['plant_machinery', 'fleet_vehicles', 'it_hardware_assets'].includes(slug);
}

function getRecordCountForSlug(slug: string): number {
  return allRecordsMap.value[slug] ?? (slug === activeSlug.value ? records.value.length : 0);
}

async function fetchSchemas() {
  isLoading.value = true;
  try {
    const res = await fetch('/api/v1/nocode/schemas');
    if (res.ok) {
      const data = await res.json();
      schemas.value = data;
      if (!schemas.value.some((s) => s.slug === activeSlug.value) && schemas.value.length > 0) {
        activeSlug.value = schemas.value[0].slug;
      }
      await fetchRecords();
    }
  } catch (err) {
    console.error('Failed to fetch schemas:', err);
  } finally {
    isLoading.value = false;
  }
}

async function fetchRecords() {
  if (!activeSlug.value) return;
  isLoading.value = true;
  try {
    const res = await fetch(`/api/v1/nocode/records/${activeSlug.value}`);
    if (res.ok) {
      const data = await res.json();
      records.value = data.records || [];
      allRecordsMap.value[activeSlug.value] = records.value.length;
    }
  } catch (err) {
    console.error('Failed to fetch records:', err);
  } finally {
    isLoading.value = false;
  }
}

function switchSchema(slug: string) {
  activeSlug.value = slug;
  fetchRecords();
}

// Modal 1 Actions: Create Entity
function openCreateEntityModal() {
  newEntityForm.value = {
    name: '',
    slug: '',
    description: '',
    icon: 'database',
    fields: [
      { name: 'itemCode', label: 'Item Identifier Code', type: 'text', required: true, optionsStr: '' },
      { name: 'operationalStatus', label: 'Lifecycle Status', type: 'select', required: true, optionsStr: 'ACTIVE, PENDING, ARCHIVED' },
    ],
  };
  showNewEntityModal.value = true;
}

function autoGenerateSlug() {
  newEntityForm.value.slug = newEntityForm.value.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function autoFieldKey(row: { label: string; name: string }) {
  if (!row.name || row.name === row.label.slice(0, -1)) {
    row.name = row.label
      .toLowerCase()
      .trim()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_m, chr) => chr.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, '');
  }
}

function addEntityFieldRow() {
  newEntityForm.value.fields.push({
    name: `customField${newEntityForm.value.fields.length + 1}`,
    label: `Custom Field ${newEntityForm.value.fields.length + 1}`,
    type: 'text',
    required: false,
    optionsStr: '',
  });
}

function removeEntityFieldRow(idx: number) {
  newEntityForm.value.fields.splice(idx, 1);
}

async function submitCreateEntity() {
  if (!newEntityForm.value.name || !newEntityForm.value.slug) {
    errorMessage.value = 'Please provide an entity name and unique slug.';
    return;
  }

  isSaving.value = true;
  errorMessage.value = null;

  try {
    const payload = {
      name: newEntityForm.value.name,
      slug: newEntityForm.value.slug,
      description: newEntityForm.value.description,
      icon: newEntityForm.value.icon,
      fields: newEntityForm.value.fields.map((f) => ({
        name: f.name,
        label: f.label,
        type: f.type,
        required: f.required,
        options: f.type === 'select' ? f.optionsStr.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      })),
    };

    const res = await fetch('/api/v1/nocode/schemas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok) {
      successMessage.value = `Entity '${newEntityForm.value.name}' created successfully.`;
      showNewEntityModal.value = false;
      await fetchSchemas();
      activeSlug.value = newEntityForm.value.slug;
      await fetchRecords();
    } else {
      errorMessage.value = data.error || 'Failed to create entity schema.';
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'An error occurred while creating entity.';
  } finally {
    isSaving.value = false;
  }
}

// Modal 2 Actions: Add Custom Field
function openAddFieldModal() {
  newFieldForm.value = {
    name: '',
    label: '',
    type: 'text',
    required: false,
    optionsStr: '',
    min: undefined,
    max: undefined,
  };
  showAddFieldModal.value = true;
}

function autoNewFieldKey() {
  newFieldForm.value.name = newFieldForm.value.label
    .toLowerCase()
    .trim()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_m, chr) => chr.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '');
}

async function submitAddField() {
  if (!newFieldForm.value.name || !newFieldForm.value.label) {
    errorMessage.value = 'Field label and programmatic key are required.';
    return;
  }

  isSaving.value = true;
  errorMessage.value = null;

  try {
    const payload = {
      name: newFieldForm.value.name,
      label: newFieldForm.value.label,
      type: newFieldForm.value.type,
      required: newFieldForm.value.required,
      options: newFieldForm.value.type === 'select'
        ? newFieldForm.value.optionsStr.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined,
      min: newFieldForm.value.min,
      max: newFieldForm.value.max,
    };

    const res = await fetch(`/api/v1/nocode/schemas/${activeSlug.value}/fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok) {
      successMessage.value = `Field '${newFieldForm.value.label}' added to schema.`;
      showAddFieldModal.value = false;
      await fetchSchemas();
    } else {
      errorMessage.value = data.error || 'Failed to add field to schema.';
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'An error occurred while adding field.';
  } finally {
    isSaving.value = false;
  }
}

// Modal 3 Actions: Dynamic Record Creation
function openNewRecordModal() {
  if (!activeSchema.value) return;
  const initialMap: Record<string, unknown> = {};

  for (const f of activeSchema.value.fields) {
    if (f.type === 'currency' || f.type === 'number') {
      initialMap[f.name] = f.min ?? 0;
    } else if (f.type === 'boolean') {
      initialMap[f.name] = false;
    } else if (f.type === 'date') {
      initialMap[f.name] = new Date().toISOString().split('T')[0];
    } else if (f.type === 'select' && f.options && f.options.length) {
      initialMap[f.name] = f.options[0];
    } else {
      initialMap[f.name] = '';
    }
  }

  newRecordData.value = initialMap;
  showNewRecordModal.value = true;
}

async function submitRecord() {
  if (!activeSchema.value) return;
  isSaving.value = true;
  errorMessage.value = null;

  try {
    const res = await fetch(`/api/v1/nocode/records/${activeSlug.value}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecordData.value),
    });

    const data = await res.json();
    if (res.ok) {
      successMessage.value = 'Record successfully indexed in dynamic schema store.';
      showNewRecordModal.value = false;
      await fetchRecords();
    } else {
      if (data.issues && Array.isArray(data.issues)) {
        errorMessage.value = data.issues.map((i: any) => `${i.field}: ${i.message}`).join(' | ');
      } else {
        errorMessage.value = data.error || 'Validation failed for record.';
      }
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'Failed to save record.';
  } finally {
    isSaving.value = false;
  }
}

async function deleteRecord(recordId: string) {
  if (!confirm(t('nocode.deleteRecordConfirm'))) return;

  try {
    const res = await fetch(`/api/v1/nocode/records/${activeSlug.value}/${recordId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      successMessage.value = 'Record deleted successfully.';
      await fetchRecords();
    } else {
      const data = await res.json();
      errorMessage.value = data.error || 'Failed to delete record.';
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'Error deleting record.';
  }
}

async function deleteActiveSchema() {
  if (!confirm(t('nocode.deleteSchemaConfirm'))) return;

  try {
    const res = await fetch(`/api/v1/nocode/schemas/${activeSlug.value}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      successMessage.value = `Schema '${activeSlug.value}' deleted successfully.`;
      activeSlug.value = 'plant_machinery';
      await fetchSchemas();
    } else {
      const data = await res.json();
      errorMessage.value = data.error || 'Failed to delete schema.';
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'Error deleting schema.';
  }
}

onMounted(() => {
  fetchSchemas();
});
</script>

<style scoped>
.view-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  margin-bottom: 12px;
}

.hero-stats {
  display: flex;
  gap: 12px;
  align-items: center;
}

.stat-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.78rem;
  color: var(--brand-cyan);
}

/* Entity Selector Bar */
.entity-selector-bar {
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  overflow-x: auto;
}

.selector-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
  white-space: nowrap;
}

.entity-pills-scroll {
  display: flex;
  gap: 10px;
  align-items: center;
}

.entity-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-size: 0.82rem;
}

.entity-pill:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-light);
  border-color: rgba(255, 255, 255, 0.15);
}

.entity-pill.active {
  background: rgba(59, 130, 246, 0.15);
  border-color: var(--brand-blue);
  color: var(--text-light);
  font-weight: 600;
}

.entity-pill-icon {
  display: flex;
  align-items: center;
  color: var(--brand-blue);
}

.pill-badge {
  padding: 2px 6px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 0.72rem;
  font-family: 'JetBrains Mono', monospace;
}

.entity-pill.active .pill-badge {
  background: var(--brand-blue);
  color: #fff;
}

/* Alert Banners */
.alert-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-radius: var(--radius-sm);
  font-size: 0.88rem;
}

.alert-success {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #10b981;
}

.alert-danger {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.btn-close-banner {
  margin-left: auto;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
}

/* Studio Layout */
.studio-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 24px;
}

@media (max-width: 1100px) {
  .studio-layout {
    grid-template-columns: 1fr;
  }
}

.schema-inspector-card,
.records-card {
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.schema-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-subtitle {
  font-size: 0.78rem;
  color: var(--text-dim);
  font-family: 'JetBrains Mono', monospace;
}

.schema-desc {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin-top: 6px;
}

.records-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spin-anim {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Fields List */
.fields-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
  max-height: 480px;
  overflow-y: auto;
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
  gap: 2px;
}

.field-title-line {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.88rem;
}

.required-star {
  color: #ef4444;
  font-weight: 700;
}

.field-meta code {
  font-size: 0.72rem;
  color: var(--brand-cyan);
}

.field-options-preview {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.opt-tag {
  font-size: 0.68rem;
  background: rgba(255, 255, 255, 0.06);
  padding: 1px 6px;
  border-radius: 4px;
  color: var(--text-muted);
}

.field-tags {
  display: flex;
  gap: 6px;
  align-items: center;
}

.field-type-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
}

.type-text { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.type-number { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
.type-currency { background: rgba(16, 185, 129, 0.15); color: #34d399; }
.type-date { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
.type-boolean { background: rgba(236, 72, 153, 0.15); color: #f472b6; }
.type-select { background: rgba(14, 165, 233, 0.15); color: #38bdf8; }

.schema-footer {
  margin-top: 14px;
}

/* Table */
.table-container {
  overflow-x: auto;
  min-height: 280px;
}

.badge-neutral {
  background: rgba(148, 163, 184, 0.15);
  color: #94a3b8;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  gap: 16px;
  color: var(--text-muted);
}

.empty-icon {
  width: 48px;
  height: 48px;
  opacity: 0.3;
}

/* Modals */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  width: 100%;
  max-width: 520px;
  padding: 28px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-md {
  max-width: 600px;
}

.modal-lg {
  max-width: 780px;
}

.modal-body-scroll {
  overflow-y: auto;
  padding-right: 6px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.btn-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.2rem;
  cursor: pointer;
}

.btn-close:hover {
  color: #fff;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
}

.form-group-checkbox {
  justify-content: center;
  margin-top: 18px;
}

.checkbox-label-block {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  cursor: pointer;
  color: var(--text-light);
}

.input-with-symbol {
  display: flex;
  align-items: center;
  position: relative;
}

.currency-prefix {
  position: absolute;
  left: 12px;
  color: var(--brand-cyan);
  font-weight: 600;
}

.input-with-symbol .input-control {
  padding-left: 28px;
}

/* Fields Builder Section in Modal 1 */
.fields-builder-section {
  margin-top: 8px;
  border-top: 1px solid var(--border-subtle);
  padding-top: 14px;
}

.fields-builder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.fields-builder-header h4 {
  font-size: 0.9rem;
  font-weight: 600;
}

.builder-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.builder-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 60px 36px;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
}

.builder-row .full-row {
  grid-column: 1 / -1;
  margin-top: 4px;
}

.glass-subcard {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border-subtle);
}

.input-sm {
  padding: 6px 10px;
  font-size: 0.82rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.icon-xs {
  width: 14px;
  height: 14px;
}

.icon-sm {
  width: 16px;
  height: 16px;
}

.text-danger {
  color: #ef4444 !important;
}

.text-primary {
  color: var(--brand-blue) !important;
}

.text-cyan {
  color: var(--brand-cyan) !important;
}

.font-mono {
  font-family: 'JetBrains Mono', monospace;
}

.text-right {
  text-align: right;
}
</style>

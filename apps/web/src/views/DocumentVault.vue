<template>
  <div class="view-container">
    <div class="hero-banner glass-card">
      <div class="hero-content">
        <h2>🗄️ {{ $t('vault.heroTitle') }}</h2>
        <p>{{ $t('vault.heroSubtitle') }}</p>
      </div>
      <div class="vault-status">
        <span class="badge badge-success">{{ $t('vault.storeOnline') }}</span>
      </div>
    </div>

    <!-- Storage & Security Cockpit KPIs -->
    <div class="kpi-grid">
      <div class="glass-card kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">{{ $t('vault.kpis.totalDocs') }}</span>
          <FileText class="kpi-icon-svg text-blue" />
        </div>
        <div class="kpi-value">{{ totalDocumentsCount }}</div>
        <div class="kpi-trend positive">
          <span>🔒 100% Encrypted</span>
        </div>
      </div>
      <div class="glass-card kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">{{ $t('vault.kpis.totalStorage') }}</span>
          <HardDrive class="kpi-icon-svg text-cyan" />
        </div>
        <div class="kpi-value">{{ $t('vault.kpis.totalStorageValue') }}</div>
        <div class="kpi-trend positive">
          <span>⚡ High-Throughput NVMe</span>
        </div>
      </div>
      <div class="glass-card kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">{{ $t('vault.kpis.encryptionType') }}</span>
          <ShieldCheck class="kpi-icon-svg text-green" />
        </div>
        <div class="kpi-value">{{ $t('vault.kpis.encryptionValue') }}</div>
        <div class="kpi-trend neutral">
          <span>🛡️ Tamper-Evident SHA-256</span>
        </div>
      </div>
      <div class="glass-card kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">{{ $t('vault.kpis.sla') }}</span>
          <CheckCircle2 class="kpi-icon-svg text-purple" />
        </div>
        <div class="kpi-value">{{ $t('vault.kpis.slaValue') }}</div>
        <div class="kpi-trend positive">
          <span>🟢 Air-Gapped Cluster</span>
        </div>
      </div>
    </div>

    <!-- Notification Banner -->
    <div v-if="successMessage" class="glass-card notification-banner">
      <span>✅ {{ successMessage }}</span>
      <button class="close-btn" @click="successMessage = ''">&times;</button>
    </div>

    <div class="buckets-grid">
      <div class="glass-card bucket-card" v-for="bucket in buckets" :key="bucket.name">
        <div class="bucket-header">
          <FolderArchive class="bucket-icon" />
          <div class="bucket-title">
            <h3>{{ bucket.name }}</h3>
            <span>{{ bucket.descKey ? $t(bucket.descKey) : bucket.description }}</span>
          </div>
          <span class="badge badge-info">{{ $t('vault.filesBadge', { count: bucket.fileCount }) }}</span>
        </div>

        <div class="bucket-stats">
          <div class="stat-item">
            <span class="stat-label">{{ $t('vault.totalSize') }}</span>
            <strong>{{ bucket.totalSize }}</strong>
          </div>
          <div class="stat-item">
            <span class="stat-label">{{ $t('vault.encryption') }}</span>
            <strong>AES-256 (SSE-S3)</strong>
          </div>
          <div class="stat-item">
            <span class="stat-label">{{ $t('vault.versioning') }}</span>
            <strong>{{ $t('common.enabled') }}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Vault Documents Table -->
    <div class="glass-card recent-docs-card">
      <div class="card-header">
        <div>
          <h3>{{ $t('vault.recentDocsTitle') }}</h3>
          <span class="card-subtitle">{{ $t('vault.recentDocsSubtitle') }}</span>
        </div>
        <button class="btn btn-secondary btn-sm" @click="showUploadModal = true">
          {{ $t('vault.uploadDocBtn') }}
        </button>
      </div>

      <div class="table-container">
        <table class="sutra-table">
          <thead>
            <tr>
              <th>{{ $t('vault.colDocName') }}</th>
              <th>{{ $t('vault.colBucket') }}</th>
              <th>{{ $t('vault.colLinkedEntity') }}</th>
              <th>{{ $t('vault.colFileSize') }}</th>
              <th>{{ $t('vault.colChecksum') }}</th>
              <th>{{ $t('vault.colUploadedAt') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="doc in recentDocs" :key="doc.name">
              <td><strong>{{ doc.name }}</strong></td>
              <td><code>{{ doc.bucket }}</code></td>
              <td>{{ doc.entityKey ? $t(doc.entityKey) : doc.entity }}</td>
              <td>{{ doc.size }}</td>
              <td><code>{{ doc.checksum }}</code></td>
              <td>{{ doc.uploadedAtKey ? $t(doc.uploadedAtKey) : doc.uploadedAt }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Upload Document Modal -->
    <div v-if="showUploadModal" class="modal-backdrop" @click.self="showUploadModal = false">
      <div class="modal-content glass-card">
        <div class="modal-header">
          <h3>{{ $t('vault.modal.title') }}</h3>
          <button class="modal-close-btn" @click="showUploadModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>{{ $t('vault.modal.fileNameLabel') }}</label>
            <input
              type="text"
              v-model="uploadFileName"
              class="input-control"
              placeholder="e.g. Audit_Report_Q2_2026.pdf"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('vault.modal.bucketLabel') }}</label>
            <select v-model="uploadBucket" class="input-control">
              <option value="sutra-documents">sutra-documents</option>
              <option value="sutra-attachments">sutra-attachments</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ $t('vault.modal.entityLabel') }}</label>
            <select v-model="uploadEntityKey" class="input-control">
              <option value="vault.entities.invoiceSales">{{ $t('vault.entities.invoiceSales') }}</option>
              <option value="vault.entities.billOfEntry">{{ $t('vault.entities.billOfEntry') }}</option>
              <option value="vault.entities.assetMachinery">{{ $t('vault.entities.assetMachinery') }}</option>
              <option value="vault.entities.auditReport">{{ $t('vault.entities.auditReport') }}</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showUploadModal = false">
            {{ $t('vault.modal.cancelBtn') }}
          </button>
          <button class="btn btn-primary" :disabled="!uploadFileName.trim()" @click="submitUpload">
            <FolderArchive class="icon-sm" /> {{ $t('vault.modal.uploadBtn') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { FolderArchive, FileText, HardDrive, ShieldCheck, CheckCircle2 } from 'lucide-vue-next';
import { useI18n } from '../i18n';

const { t } = useI18n();

const buckets = ref([
  {
    name: 'sutra-documents',
    description: 'Tax Invoices, Signed E-Invoices & Statutory Filings',
    descKey: 'vault.buckets.documentsDesc',
    fileCount: 428,
    totalSize: '3.4 GB',
  },
  {
    name: 'sutra-attachments',
    description: 'Vendor bills, delivery challans, technical CAD drawings',
    descKey: 'vault.buckets.attachmentsDesc',
    fileCount: 1240,
    totalSize: '14.8 GB',
  },
]);

const recentDocs = ref([
  {
    name: 'Tax_Invoice_INV-2026-0042_Signed.pdf',
    bucket: 'sutra-documents',
    entity: 'Invoice (Sales)',
    entityKey: 'vault.entities.invoiceSales',
    size: '342 KB',
    checksum: 'e3b0c44298fc1c149afbf4c8996fb924',
    uploadedAt: 'Today, 11:42 AM',
    uploadedAtKey: 'vault.timestamps.today',
  },
  {
    name: 'Vendor_Bill_Infosys_INF-8821.pdf',
    bucket: 'sutra-attachments',
    entity: 'Bill of Entry (Purchase)',
    entityKey: 'vault.entities.billOfEntry',
    size: '512 KB',
    checksum: '88d4266fd4e6338d13b845fcf289579d',
    uploadedAt: 'Yesterday, 04:15 PM',
    uploadedAtKey: 'vault.timestamps.yesterday',
  },
  {
    name: 'Plant2_CNC_Machine_Calibration_Certificate.pdf',
    bucket: 'sutra-attachments',
    entity: 'Asset (Machinery)',
    entityKey: 'vault.entities.assetMachinery',
    size: '1.2 MB',
    checksum: '3a41b2e67c8d9e01f2a3b4c5d6e7f8a9',
    uploadedAt: 'Sep 26, 2026',
  },
]);

const totalDocumentsCount = computed(() => {
  return buckets.value.reduce((acc, b) => acc + b.fileCount, 0);
});

const showUploadModal = ref(false);
const uploadFileName = ref('');
const uploadBucket = ref('sutra-documents');
const uploadEntityKey = ref('vault.entities.invoiceSales');
const successMessage = ref('');

function submitUpload() {
  if (!uploadFileName.value.trim()) return;

  const newDoc = {
    name: uploadFileName.value.trim(),
    bucket: uploadBucket.value,
    entity: t(uploadEntityKey.value),
    entityKey: uploadEntityKey.value,
    size: '428 KB',
    checksum: Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    uploadedAt: t('vault.timestamps.today'),
    uploadedAtKey: 'vault.timestamps.today',
  };

  recentDocs.value.unshift(newDoc);

  const targetBucket = buckets.value.find((b) => b.name === uploadBucket.value);
  if (targetBucket) {
    targetBucket.fileCount++;
  }

  successMessage.value = t('vault.modal.successNotice', {
    name: newDoc.name,
    bucket: newDoc.bucket,
  });

  uploadFileName.value = '';
  showUploadModal.value = false;
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

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

.kpi-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kpi-title {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.kpi-icon-svg {
  width: 20px;
  height: 20px;
}

.text-blue { color: var(--brand-blue); }
.text-cyan { color: var(--brand-cyan); }
.text-green { color: var(--status-success); }
.text-purple { color: #a855f7; }

.kpi-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-bright);
}

.kpi-trend {
  font-size: 0.74rem;
  display: flex;
  align-items: center;
  gap: 4px;
}

.kpi-trend.positive { color: var(--status-success); }
.kpi-trend.neutral { color: var(--text-dim); }

.notification-banner {
  padding: 12px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 4px solid var(--status-success);
  font-size: 0.85rem;
  color: #f8fafc;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  color: var(--text-muted);
  cursor: pointer;
}

.buckets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
}

.bucket-card {
  padding: 24px;
}

.bucket-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}

.bucket-icon {
  width: 38px;
  height: 38px;
  color: var(--brand-blue);
}

.bucket-title {
  flex: 1;
}

.bucket-title h3 {
  font-size: 1.05rem;
}

.bucket-title span {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.bucket-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle);
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.74rem;
  color: var(--text-dim);
}

.stat-item strong {
  font-size: 0.88rem;
}

.recent-docs-card {
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

code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: var(--brand-cyan);
}

/* Modal Styling */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
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
  border: 1px solid var(--border-active);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: 1.15rem;
}

.modal-close-btn {
  background: transparent;
  border: none;
  font-size: 1.4rem;
  color: var(--text-muted);
  cursor: pointer;
}

.modal-close-btn:hover {
  color: var(--text-bright);
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
}

.icon-sm {
  width: 16px;
  height: 16px;
}
</style>

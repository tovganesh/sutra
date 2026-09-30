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

    <div class="buckets-grid">
      <div class="glass-card bucket-card" v-for="bucket in buckets" :key="bucket.name">
        <div class="bucket-header">
          <FolderArchive class="bucket-icon" />
          <div class="bucket-title">
            <h3>{{ bucket.name }}</h3>
            <span>{{ bucket.description }}</span>
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
            <strong>Enabled</strong>
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
        <button class="btn btn-secondary btn-sm">{{ $t('vault.uploadDocBtn') }}</button>
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
              <td>{{ doc.entity }}</td>
              <td>{{ doc.size }}</td>
              <td><code>{{ doc.checksum }}</code></td>
              <td>{{ doc.uploadedAt }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { FolderArchive } from 'lucide-vue-next';

const buckets = ref([
  {
    name: 'sutra-documents',
    description: 'Tax Invoices, Signed E-Invoices & Statutory Filings',
    fileCount: 428,
    totalSize: '3.4 GB',
  },
  {
    name: 'sutra-attachments',
    description: 'Vendor bills, delivery challans, technical CAD drawings',
    fileCount: 1240,
    totalSize: '14.8 GB',
  },
]);

const recentDocs = ref([
  {
    name: 'Tax_Invoice_INV-2026-0042_Signed.pdf',
    bucket: 'sutra-documents',
    entity: 'Invoice (Sales)',
    size: '342 KB',
    checksum: 'e3b0c44298fc1c149afbf4c8996fb924',
    uploadedAt: 'Today, 11:42 AM',
  },
  {
    name: 'Vendor_Bill_Infosys_INF-8821.pdf',
    bucket: 'sutra-attachments',
    entity: 'Bill of Entry (Purchase)',
    size: '512 KB',
    checksum: '88d4266fd4e6338d13b845fcf289579d',
    uploadedAt: 'Yesterday, 04:15 PM',
  },
  {
    name: 'Plant2_CNC_Machine_Calibration_Certificate.pdf',
    bucket: 'sutra-attachments',
    entity: 'Asset (Machinery)',
    size: '1.2 MB',
    checksum: '3a41b2e67c8d9e01f2a3b4c5d6e7f8a9',
    uploadedAt: 'Sep 26, 2026',
  },
]);
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
</style>

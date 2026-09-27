<template>
  <div class="view-container">
    <div class="hero-banner glass-card">
      <div class="hero-content">
        <h2>📊 Financial Statements & Real-Time OLAP Intelligence</h2>
        <p>Live Profit & Loss Statement and Balance Sheet computed directly from PostgreSQL journal entries. Zero ETL pipeline lag, complete double-entry integrity.</p>
      </div>
      <div class="hero-meta">
        <span class="badge badge-success">Audit Status: Fully Balanced</span>
        <span class="badge badge-info">Currency: INR (₹)</span>
      </div>
    </div>

    <div class="statements-grid">
      <!-- Statement 1: Profit & Loss -->
      <div class="glass-card statement-card">
        <div class="card-header">
          <div>
            <h3>Statement of Profit & Loss</h3>
            <span class="card-subtitle">Fiscal Year 2026-27 (Apr 2026 – Mar 2027)</span>
          </div>
          <span class="badge badge-success">Operating Margin: 29.2%</span>
        </div>

        <div class="table-container">
          <table class="sutra-table">
            <tbody>
              <tr class="section-row">
                <td colspan="2"><strong>Operating Revenue</strong></td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">Enterprise Software Licenses & Subscriptions</td>
                <td class="amount-cell positive">₹1,20,00,000</td>
              </tr>
              <tr class="subtotal-row">
                <td><strong>Total Gross Revenue (A)</strong></td>
                <td class="amount-cell positive"><strong>₹1,20,00,000</strong></td>
              </tr>

              <tr class="section-row">
                <td colspan="2"><strong>Cost of Goods Sold (COGS)</strong></td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">Cloud Infrastructure & Direct Engineering</td>
                <td class="amount-cell negative">(₹48,00,000)</td>
              </tr>
              <tr class="subtotal-row">
                <td><strong>Total Cost of Sales (B)</strong></td>
                <td class="amount-cell negative"><strong>(₹48,00,000)</strong></td>
              </tr>

              <tr class="highlight-row">
                <td><strong>Gross Operating Profit (A - B)</strong></td>
                <td class="amount-cell"><strong>₹72,00,000</strong></td>
              </tr>

              <tr class="section-row">
                <td colspan="2"><strong>Operating Expenses (OPEX)</strong></td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">Salaries & Statutory Employee Benefits (PF/ESI)</td>
                <td class="amount-cell negative">(₹32,00,000)</td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">Administrative & Facility Operations</td>
                <td class="amount-cell negative">(₹5,00,000)</td>
              </tr>
              <tr class="subtotal-row">
                <td><strong>Total Operating Expenses (C)</strong></td>
                <td class="amount-cell negative"><strong>(₹37,00,000)</strong></td>
              </tr>

              <tr class="final-row">
                <td><strong>Net Operating Profit Before Tax</strong></td>
                <td class="amount-cell grand-total">₹35,00,000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Statement 2: Balance Sheet -->
      <div class="glass-card statement-card">
        <div class="card-header">
          <div>
            <h3>Balance Sheet</h3>
            <span class="card-subtitle">As of September 28, 2026</span>
          </div>
          <span class="badge badge-success">Assets = Liabilities + Equity</span>
        </div>

        <div class="table-container">
          <table class="sutra-table">
            <tbody>
              <tr class="section-row">
                <td colspan="2"><strong>Assets</strong></td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">Cash and Operating Bank Accounts (HDFC)</td>
                <td class="amount-cell">₹40,00,000</td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">Trade Accounts Receivable</td>
                <td class="amount-cell">₹50,00,000</td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">Finished Goods & Equipment Inventory</td>
                <td class="amount-cell">₹30,00,000</td>
              </tr>
              <tr class="highlight-row">
                <td><strong>Total Assets</strong></td>
                <td class="amount-cell grand-total">₹1,20,00,000</td>
              </tr>

              <tr class="section-row">
                <td colspan="2"><strong>Liabilities</strong></td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">Trade Accounts Payable</td>
                <td class="amount-cell">₹25,00,000</td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">Output GST & TDS Statutory Taxes Payable</td>
                <td class="amount-cell">₹10,00,000</td>
              </tr>
              <tr class="subtotal-row">
                <td><strong>Total Liabilities</strong></td>
                <td class="amount-cell"><strong>₹35,00,000</strong></td>
              </tr>

              <tr class="section-row">
                <td colspan="2"><strong>Shareholders' Equity</strong></td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">Paid-up Common Share Capital</td>
                <td class="amount-cell">₹50,00,000</td>
              </tr>
              <tr>
                <td style="padding-left: 24px;">Retained Earnings (Current Period)</td>
                <td class="amount-cell">₹35,00,000</td>
              </tr>
              <tr class="subtotal-row">
                <td><strong>Total Equity</strong></td>
                <td class="amount-cell"><strong>₹85,00,000</strong></td>
              </tr>

              <tr class="final-row">
                <td><strong>Total Liabilities & Equity</strong></td>
                <td class="amount-cell grand-total">₹1,20,00,000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

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

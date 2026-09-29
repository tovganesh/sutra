/**
 * Sutra Treasury & Bank Statement Reconciliation Engine (SAP TRM / FI-BL Equivalent)
 * Manages House Banks, Company Bank Accounts, MT940 / CSV electronic statements,
 * automated 2-way clearing between GL bank clearing entries and bank statement lines,
 * Bank Reconciliation Statement (BRS) calculation, and cash liquidity forecasting.
 */

import {
  HouseBank,
  CompanyBankAccount,
  BankStatement,
  BankStatementLine,
  GLClearingItem,
  BankReconciliationResult,
  BankReconciliationStatement,
  CashLiquidityForecast,
} from './treasury-types.js';

export class TreasuryEngine {
  private houseBanks: Map<string, HouseBank> = new Map();
  private bankAccounts: Map<string, CompanyBankAccount> = new Map();
  private bankStatements: Map<string, BankStatement> = new Map();
  private glClearingItems: Map<string, GLClearingItem[]> = new Map(); // key = accountId

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults(): void {
    const bank1: HouseBank = {
      bankId: 'HDFC-IN-01',
      bankName: 'HDFC Bank Limited',
      branchName: 'Bandra-Kurla Complex (BKC) Large Corporate Branch, Mumbai',
      ifscCode: 'HDFC0000123',
      swiftCode: 'HDFCINBBMUM',
      country: 'IN',
    };
    const bank2: HouseBank = {
      bankId: 'SBI-IN-01',
      bankName: 'State Bank of India',
      branchName: 'Industrial Finance Branch, Bengaluru',
      ifscCode: 'SBIN0004133',
      swiftCode: 'SBININBBBLR',
      country: 'IN',
    };
    this.houseBanks.set(bank1.bankId, bank1);
    this.houseBanks.set(bank2.bankId, bank2);

    const acc1: CompanyBankAccount = {
      accountId: 'BA-HDFC-INR-01',
      bankId: bank1.bankId,
      accountNumber: '50200055418291',
      accountType: 'CURRENT',
      currency: 'INR',
      glAccount: '100100', // Main Operating Cash Account
      glClearingAccount: '100101', // Bank Outgoing/Incoming Clearing Account
      currentBookBalance: 12500000, // INR 1.25 Cr in books
      reconciledBankBalance: 12450000,
      lastReconciliationDate: '2026-08-31',
    };
    this.bankAccounts.set(acc1.accountId, acc1);

    // Seed GL clearing entries (book side)
    const initialClearingItems: GLClearingItem[] = [
      {
        entryNumber: 'GL-CLR-001',
        date: '2026-09-02',
        reference: 'UTR-HDFC-9921',
        direction: 'DEBIT', // Customer remittance deposited
        amount: 850000,
        accountCode: '100101',
        description: 'Customer payment received for INV-2026-0041',
        isCleared: false,
      },
      {
        entryNumber: 'GL-CLR-002',
        date: '2026-09-04',
        reference: 'CHQ-440192',
        direction: 'CREDIT', // Vendor cheque issued
        amount: 420000,
        accountCode: '100101',
        description: 'Vendor payment for PO-2026-0001 raw material',
        isCleared: false,
      },
      {
        entryNumber: 'GL-CLR-003',
        date: '2026-09-05',
        reference: 'NEFT-AXIS-8812',
        direction: 'DEBIT', // Customer deposit in transit
        amount: 350000,
        accountCode: '100101',
        description: 'Advance received from Tata AutoComp Ltd',
        isCleared: false,
      },
      {
        entryNumber: 'GL-CLR-004',
        date: '2026-09-06',
        reference: 'CHQ-440193',
        direction: 'CREDIT', // Cheque issued but not presented
        amount: 150000,
        accountCode: '100101',
        description: 'Subcontractor fabrication services',
        isCleared: false,
      },
    ];
    this.glClearingItems.set(acc1.accountId, initialClearingItems);

    // Seed Bank Statement (bank side)
    const statement1: BankStatement = {
      statementId: 'BS-2026-09-01',
      accountId: acc1.accountId,
      statementNumber: '2026/09/01',
      openingDate: '2026-09-01',
      closingDate: '2026-09-07',
      openingBalance: 12450000,
      closingBalance: 12880000,
      format: 'MT940',
      status: 'IMPORTED',
      lines: [
        {
          lineId: 'BSL-001',
          transactionDate: '2026-09-02',
          valueDate: '2026-09-02',
          transactionReference: 'UTR-HDFC-9921',
          direction: 'CREDIT', // Bank received money
          amount: 850000,
          counterpartyName: 'Reliance Retail Ltd',
          narrative: 'RTGS INWARD REMITTANCE UTR-HDFC-9921',
          reconciliationStatus: 'UNMATCHED',
        },
        {
          lineId: 'BSL-002',
          transactionDate: '2026-09-04',
          valueDate: '2026-09-04',
          transactionReference: 'CHQ-440192',
          direction: 'DEBIT', // Bank cleared cheque
          amount: 420000,
          counterpartyName: 'Tata Steel Special Alloy Ltd',
          narrative: 'CHEQUE CLEARING CHQ-440192',
          reconciliationStatus: 'UNMATCHED',
        },
      ],
    };
    this.bankStatements.set(statement1.statementId, statement1);
  }

  // -------------------------------------------------------------
  // House Banks & Company Accounts
  // -------------------------------------------------------------

  public registerHouseBank(bank: HouseBank): HouseBank {
    this.houseBanks.set(bank.bankId, bank);
    return bank;
  }

  public listHouseBanks(): HouseBank[] {
    return Array.from(this.houseBanks.values());
  }

  public registerBankAccount(account: CompanyBankAccount): CompanyBankAccount {
    this.bankAccounts.set(account.accountId, account);
    if (!this.glClearingItems.has(account.accountId)) {
      this.glClearingItems.set(account.accountId, []);
    }
    return account;
  }

  public getBankAccount(accountId: string): CompanyBankAccount | undefined {
    return this.bankAccounts.get(accountId);
  }

  public listBankAccounts(): CompanyBankAccount[] {
    return Array.from(this.bankAccounts.values());
  }

  // -------------------------------------------------------------
  // GL Clearing Items
  // -------------------------------------------------------------

  public addGLClearingItem(accountId: string, item: GLClearingItem): GLClearingItem {
    const items = this.glClearingItems.get(accountId) || [];
    items.push(item);
    this.glClearingItems.set(accountId, items);
    return item;
  }

  public listGLClearingItems(accountId: string): GLClearingItem[] {
    return this.glClearingItems.get(accountId) || [];
  }

  // -------------------------------------------------------------
  // Electronic Bank Statements (EBS)
  // -------------------------------------------------------------

  public importStatement(statement: BankStatement): BankStatement {
    const acc = this.bankAccounts.get(statement.accountId);
    if (!acc) {
      throw new Error(`Bank account ${statement.accountId} not found`);
    }
    this.bankStatements.set(statement.statementId, statement);
    return statement;
  }

  public parseMT940Statement(accountId: string, rawText: string): BankStatement {
    const acc = this.bankAccounts.get(accountId);
    if (!acc) {
      throw new Error(`Bank account ${accountId} not found`);
    }

    const lines: BankStatementLine[] = [];
    const count = this.bankStatements.size + 1;
    const statementId = `BS-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

    const textLines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    let lineIdx = 1;
    let openingBal = acc.reconciledBankBalance;
    let closingBal = acc.reconciledBankBalance;

    for (const line of textLines) {
      // MT940 Tag :60F: (Opening Balance)
      if (line.startsWith(':60F:')) {
        const parts = line.replace(':60F:', '');
        const amountStr = parts.slice(10).replace(',', '.');
        openingBal = parseFloat(amountStr) || openingBal;
      }
      // MT940 Tag :61: (Statement Line: Date, Debit/Credit, Amount, Ref)
      else if (line.startsWith(':61:')) {
        const content = line.replace(':61:', '');
        const isCredit = content.includes('C');
        const direction = isCredit ? 'CREDIT' : 'DEBIT';
        const numMatches = content.match(/\d+([.,]\d+)?/g);
        const amount = numMatches && numMatches[1] ? parseFloat(numMatches[1].replace(',', '.')) : 10000;
        const refMatch = content.match(/NONREF|\/\/([A-Za-z0-9-]+)/);
        const ref = refMatch && refMatch[1] ? refMatch[1] : `REF-${Date.now()}-${lineIdx}`;

        lines.push({
          lineId: `BSL-${String(lineIdx++).padStart(3, '0')}`,
          transactionDate: new Date().toISOString().split('T')[0],
          valueDate: new Date().toISOString().split('T')[0],
          transactionReference: ref,
          direction,
          amount,
          narrative: content,
          reconciliationStatus: 'UNMATCHED',
        });
      }
      // MT940 Tag :62F: (Closing Balance)
      else if (line.startsWith(':62F:')) {
        const parts = line.replace(':62F:', '');
        const amountStr = parts.slice(10).replace(',', '.');
        closingBal = parseFloat(amountStr) || closingBal;
      }
    }

    const statement: BankStatement = {
      statementId,
      accountId,
      statementNumber: `${new Date().getFullYear()}/${String(count).padStart(2, '0')}`,
      openingDate: new Date().toISOString().split('T')[0],
      closingDate: new Date().toISOString().split('T')[0],
      openingBalance: openingBal,
      closingBalance: closingBal,
      format: 'MT940',
      status: 'IMPORTED',
      lines,
    };

    this.bankStatements.set(statementId, statement);
    return statement;
  }

  public getStatement(statementId: string): BankStatement | undefined {
    return this.bankStatements.get(statementId);
  }

  public listStatements(accountId?: string): BankStatement[] {
    const list = Array.from(this.bankStatements.values());
    return accountId ? list.filter((s) => s.accountId === accountId) : list;
  }

  // -------------------------------------------------------------
  // Automated 2-Way Reconciliation Engine
  // -------------------------------------------------------------

  public executeAutoReconciliation(statementId: string): BankReconciliationResult {
    const statement = this.bankStatements.get(statementId);
    if (!statement) {
      throw new Error(`Bank Statement ${statementId} not found`);
    }

    const clearingItems = this.glClearingItems.get(statement.accountId) || [];
    let matchedCount = 0;
    let unmatchedCount = 0;
    let matchedAmount = 0;
    let unmatchedAmount = 0;

    for (const line of statement.lines) {
      if (line.reconciliationStatus === 'AUTO_CLEARED' || line.reconciliationStatus === 'MANUAL_CLEARED') {
        matchedCount++;
        matchedAmount += line.amount;
        continue;
      }

      // Find matching uncleared GL item:
      // In Bank: CREDIT = inflow, matching GL DEBIT
      // In Bank: DEBIT = outflow, matching GL CREDIT
      const expectedGLDirection = line.direction === 'CREDIT' ? 'DEBIT' : 'CREDIT';

      let matchedItem: GLClearingItem | undefined;
      let score = 0;

      // 1. Exact Reference Match & Amount Match
      matchedItem = clearingItems.find(
        (ci) =>
          !ci.isCleared &&
          ci.direction === expectedGLDirection &&
          ci.amount === line.amount &&
          ci.reference.toLowerCase() === line.transactionReference.toLowerCase()
      );

      if (matchedItem) {
        score = 100;
      } else {
        // 2. Partial Reference Match & Amount Match
        matchedItem = clearingItems.find(
          (ci) =>
            !ci.isCleared &&
            ci.direction === expectedGLDirection &&
            ci.amount === line.amount &&
            (ci.reference.toLowerCase().includes(line.transactionReference.toLowerCase()) ||
              line.transactionReference.toLowerCase().includes(ci.reference.toLowerCase()))
        );
        if (matchedItem) {
          score = 85;
        } else {
          // 3. Exact Amount Match & Direction (same date or within tolerance)
          matchedItem = clearingItems.find(
            (ci) =>
              !ci.isCleared &&
              ci.direction === expectedGLDirection &&
              ci.amount === line.amount
          );
          if (matchedItem) {
            score = 70;
          }
        }
      }

      if (matchedItem && score >= 70) {
        matchedItem.isCleared = true;
        line.reconciliationStatus = 'AUTO_CLEARED';
        line.matchedGlEntryNumber = matchedItem.entryNumber;
        line.matchScore = score;
        matchedCount++;
        matchedAmount += line.amount;
      } else {
        unmatchedCount++;
        unmatchedAmount += line.amount;
      }
    }

    statement.status =
      unmatchedCount === 0
        ? 'RECONCILED'
        : matchedCount > 0
        ? 'PARTIALLY_RECONCILED'
        : 'IMPORTED';

    const acc = this.bankAccounts.get(statement.accountId);
    if (acc) {
      acc.reconciledBankBalance = statement.closingBalance;
      acc.lastReconciliationDate = new Date().toISOString().split('T')[0];
    }

    return {
      statementId,
      accountId: statement.accountId,
      totalLines: statement.lines.length,
      matchedCount,
      unmatchedCount,
      matchedAmount: Math.round(matchedAmount * 100) / 100,
      unmatchedAmount: Math.round(unmatchedAmount * 100) / 100,
      reconciledLines: statement.lines,
    };
  }

  // -------------------------------------------------------------
  // Bank Reconciliation Statement (BRS)
  // -------------------------------------------------------------

  public generateBRS(accountId: string, asOfDate: string): BankReconciliationStatement {
    const acc = this.bankAccounts.get(accountId);
    if (!acc) {
      throw new Error(`Bank account ${accountId} not found`);
    }

    const clearingItems = this.glClearingItems.get(accountId) || [];

    // Uncleared GL Debits = Deposits in Transit (recorded in books, not yet credited by bank)
    const depositsInTransit = clearingItems
      .filter((ci) => !ci.isCleared && ci.direction === 'DEBIT')
      .map((ci) => ({ reference: ci.reference, amount: ci.amount, date: ci.date }));

    // Uncleared GL Credits = Unpresented Cheques (issued to vendors, not yet debited by bank)
    const unpresentedCheques = clearingItems
      .filter((ci) => !ci.isCleared && ci.direction === 'CREDIT')
      .map((ci) => ({ reference: ci.reference, amount: ci.amount, date: ci.date }));

    const totalDepositsInTransit = depositsInTransit.reduce((acc, d) => acc + d.amount, 0);
    const totalUnpresentedCheques = unpresentedCheques.reduce((acc, c) => acc + c.amount, 0);

    const balanceAsPerBank = acc.reconciledBankBalance;
    const adjustedBankBalance =
      Math.round((balanceAsPerBank + totalDepositsInTransit - totalUnpresentedCheques) * 100) / 100;

    const balanceAsPerCompanyBooks = acc.currentBookBalance;
    const variance = Math.round(Math.abs(adjustedBankBalance - balanceAsPerCompanyBooks) * 100) / 100;
    const isBalanced = variance < 1.0; // within 1 rupee rounding tolerance

    return {
      statementId: `BRS-${accountId}-${asOfDate}`,
      accountId,
      asOfDate,
      balanceAsPerBank,
      addDepositsInTransit: depositsInTransit,
      lessUnpresentedCheques: unpresentedCheques,
      adjustedBankBalance,
      balanceAsPerCompanyBooks,
      variance,
      isBalanced,
    };
  }

  // -------------------------------------------------------------
  // Cash Liquidity Forecasting
  // -------------------------------------------------------------

  public forecastCashLiquidity(
    accountId: string,
    openReceivables30: number = 3500000,
    openPayables30: number = 2200000
  ): CashLiquidityForecast {
    const acc = this.bankAccounts.get(accountId);
    const currentCashBalance = acc ? acc.currentBookBalance : 10000000;

    // 30 Days Forecast
    const net30 = openReceivables30 - openPayables30;
    const closing30 = currentCashBalance + net30;

    // 60 Days Forecast (assumes +15% revenue expansion)
    const rec60 = openReceivables30 * 1.15;
    const pay60 = openPayables30 * 1.1;
    const net60 = rec60 - pay60;
    const closing60 = closing30 + net60;

    // 90 Days Forecast
    const rec90 = openReceivables30 * 1.25;
    const pay90 = openPayables30 * 1.18;
    const net90 = rec90 - pay90;
    const closing90 = closing60 + net90;

    return {
      asOfDate: new Date().toISOString().split('T')[0],
      currency: acc ? acc.currency : 'INR',
      currentCashBalance,
      forecast30Days: {
        expectedReceivables: Math.round(openReceivables30),
        expectedPayables: Math.round(openPayables30),
        netCashFlow: Math.round(net30),
        projectedClosingCash: Math.round(closing30),
      },
      forecast60Days: {
        expectedReceivables: Math.round(rec60),
        expectedPayables: Math.round(pay60),
        netCashFlow: Math.round(net60),
        projectedClosingCash: Math.round(closing60),
      },
      forecast90Days: {
        expectedReceivables: Math.round(rec90),
        expectedPayables: Math.round(pay90),
        netCashFlow: Math.round(net90),
        projectedClosingCash: Math.round(closing90),
      },
    };
  }
}

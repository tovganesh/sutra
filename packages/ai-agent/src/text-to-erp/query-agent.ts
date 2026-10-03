import { ILLMProvider } from '../providers/llm-provider.js';

export type ERPEntity =
  | 'invoices'
  | 'customers'
  | 'journal_entries'
  | 'compliance_gst'
  | 'custom_record'
  | 'inventory'
  | 'sourcing'
  | 'analytics'
  | 'payroll';

export type ERPIntent =
  | 'select'
  | 'aggregate'
  | 'status_check'
  | 'forecast'
  | 'action';

export interface StructuredERPQuery {
  targetEntity: ERPEntity;
  intent: ERPIntent;
  filters: Record<string, unknown>;
  groupBy?: string;
  sortBy?: string;
  limit?: number;
  explanation: string;
  actionSuggestion?: string;
  parameters?: Record<string, unknown>;
}

export class TextToERPAgent {
  constructor(private llm: ILLMProvider) {}

  public setProvider(provider: ILLMProvider): void {
    this.llm = provider;
  }

  /**
   * Interprets natural language questions from CFOs, accountants, or operations managers
   * into structured query parameters.
   */
  public async translateQuery(naturalLanguagePrompt: string): Promise<StructuredERPQuery> {
    const promptLower = naturalLanguagePrompt.toLowerCase();

    // High-performance heuristic short-circuit / fallback
    const heuristicMatch = this.heuristicInterpretation(promptLower);

    const schemaDesc = `
    {
      "targetEntity": "invoices" | "customers" | "journal_entries" | "compliance_gst" | "custom_record" | "inventory" | "sourcing" | "analytics" | "payroll",
      "intent": "select" | "aggregate" | "status_check" | "forecast" | "action",
      "filters": { [key: string]: any },
      "groupBy": string (optional),
      "sortBy": string (optional),
      "limit": number (optional),
      "explanation": string (brief human explanation of the query),
      "actionSuggestion": string (optional, e.g. "EXECUTE_RULE_88A", "VIEW_AGING", "VIEW_INVENTORY")
    }
    `;

    const prompt = `Interpret the following business question into a structured ERP database query:\n"${naturalLanguagePrompt}"`;

    try {
      const parsed = await this.llm.generateJSON<StructuredERPQuery>(prompt, schemaDesc);
      if (parsed && parsed.targetEntity && parsed.intent) {
        return parsed;
      }
      return heuristicMatch;
    } catch {
      return heuristicMatch;
    }
  }

  private heuristicInterpretation(promptLower: string): StructuredERPQuery {
    if (promptLower.includes('gst') || promptLower.includes('gstr') || promptLower.includes('itc') || promptLower.includes('tax')) {
      return {
        targetEntity: 'compliance_gst',
        intent: 'aggregate',
        filters: { period: 'CURRENT_MONTH' },
        explanation: 'Statutory GST liability and Input Tax Credit (ITC) Rule 88A set-off calculation',
        actionSuggestion: 'EXECUTE_RULE_88A',
      };
    }

    if (promptLower.includes('overdue') || promptLower.includes('unpaid') || promptLower.includes('aging') || promptLower.includes('receivable')) {
      return {
        targetEntity: 'invoices',
        intent: 'select',
        filters: { status: 'OVERDUE', daysOverdueMin: 30 },
        sortBy: 'daysOverdue DESC',
        limit: 10,
        explanation: 'Audit query for overdue customer invoices older than 30 days',
        actionSuggestion: 'VIEW_AGING',
      };
    }

    if (promptLower.includes('cash') || promptLower.includes('liquidity') || promptLower.includes('flow') || promptLower.includes('ratio')) {
      return {
        targetEntity: 'analytics',
        intent: 'forecast',
        filters: { metrics: ['operating_cash_flow', 'current_ratio', 'quick_ratio'] },
        explanation: 'Cash flow velocity, working capital, and short-term liquidity forecasting',
        actionSuggestion: 'VIEW_CASH_FLOW',
      };
    }

    if (promptLower.includes('stock') || promptLower.includes('inventory') || promptLower.includes('warehouse') || promptLower.includes('item')) {
      return {
        targetEntity: 'inventory',
        intent: 'status_check',
        filters: { threshold: 'LOW_STOCK' },
        explanation: 'Inspection of stock on hand, storage bin capacity, and reorder levels',
        actionSuggestion: 'VIEW_INVENTORY',
      };
    }

    if (promptLower.includes('rfq') || promptLower.includes('tender') || promptLower.includes('vendor') || promptLower.includes('sourcing')) {
      return {
        targetEntity: 'sourcing',
        intent: 'select',
        filters: { status: 'EVALUATING' },
        explanation: 'Inspection of active RFQ tenders and competitive supplier quotation matrices',
        actionSuggestion: 'VIEW_SOURCING',
      };
    }

    if (
      promptLower.includes('machinery') ||
      promptLower.includes('fleet') ||
      promptLower.includes('asset') ||
      promptLower.includes('nocode') ||
      promptLower.includes('no-code') ||
      promptLower.includes('schema') ||
      promptLower.includes('custom')
    ) {
      return {
        targetEntity: 'custom_record',
        intent: 'select',
        filters: { activeOnly: true },
        explanation: 'Query against No-Code dynamic business schemas and custom entity records',
        actionSuggestion: 'VIEW_NOCODE',
      };
    }

    // Default fallback
    return {
      targetEntity: 'journal_entries',
      intent: 'select',
      filters: { fiscalYear: '2026-2027' },
      limit: 10,
      explanation: 'General ledger journal vouchers query for current fiscal period',
      actionSuggestion: 'VIEW_GENERAL_LEDGER',
    };
  }
}

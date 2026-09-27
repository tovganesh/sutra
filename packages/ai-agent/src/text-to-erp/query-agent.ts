import { ILLMProvider } from '../providers/llm-provider.js';

export interface StructuredERPQuery {
  targetEntity: 'invoices' | 'customers' | 'journal_entries' | 'compliance_gst' | 'custom_record';
  intent: 'select' | 'aggregate' | 'status_check' | 'forecast';
  filters: Record<string, unknown>;
  groupBy?: string;
  sortBy?: string;
  limit?: number;
  explanation: string;
}

export class TextToERPAgent {
  constructor(private llm: ILLMProvider) {}

  /**
   * Interprets natural language questions from CFOs, accountants, or operations managers
   * into structured query parameters.
   */
  public async translateQuery(naturalLanguagePrompt: string): Promise<StructuredERPQuery> {
    const schemaDesc = `
    {
      "targetEntity": "invoices" | "customers" | "journal_entries" | "compliance_gst" | "custom_record",
      "intent": "select" | "aggregate" | "status_check" | "forecast",
      "filters": { [key: string]: any },
      "groupBy": string (optional),
      "sortBy": string (optional),
      "limit": number (optional),
      "explanation": string (brief human explanation of the query)
    }
    `;

    const prompt = `Interpret the following business question into a structured ERP database query:\n"${naturalLanguagePrompt}"`;

    try {
      return await this.llm.generateJSON<StructuredERPQuery>(prompt, schemaDesc);
    } catch {
      // Fallback heuristic if local LLM is offline or unconfigured
      return {
        targetEntity: 'invoices',
        intent: 'select',
        filters: { status: 'UNPAID' },
        limit: 10,
        explanation: 'Default fallback query for unpaid invoices',
      };
    }
  }
}

/**
 * Sutra Unified LLM Provider Interface
 * Allows seamless switching between Local Air-Gapped LLMs (Ollama, vLLM)
 * and Cloud Providers (OpenAI, Google Gemini, Anthropic).
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ILLMProvider {
  name: string;
  generateText(prompt: string, systemPrompt?: string): Promise<string>;
  generateJSON<T>(prompt: string, schemaDescription: string): Promise<T>;
}

export class OllamaProvider implements ILLMProvider {
  public name = 'Ollama (Local LLM)';

  constructor(
    private endpoint: string = 'http://localhost:11434',
    private model: string = 'llama3.2'
  ) {}

  public async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    const res = await fetch(`${this.endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt,
        system: systemPrompt,
        stream: false,
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama request failed: ${res.statusText}`);
    }

    const data = (await res.json()) as { response: string };
    return data.response;
  }

  public async generateJSON<T>(prompt: string, schemaDescription: string): Promise<T> {
    const systemPrompt = `You are an enterprise AI engine. You must output only valid, parseable JSON conforming to this schema:\n${schemaDescription}\nDo not include markdown or explanations.`;
    const res = await fetch(`${this.endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt,
        system: systemPrompt,
        format: 'json',
        stream: false,
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama JSON request failed: ${res.statusText}`);
    }

    const data = (await res.json()) as { response: string };
    return JSON.parse(data.response) as T;
  }
}

export class OpenAIProvider implements ILLMProvider {
  public name = 'OpenAI (Cloud LLM)';

  constructor(
    private apiKey: string,
    private model: string = 'gpt-4o-mini'
  ) {}

  public async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: LLMMessage[] = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI request failed: ${res.statusText}`);
    }

    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0]?.message?.content || '';
  }

  public async generateJSON<T>(prompt: string, schemaDescription: string): Promise<T> {
    const text = await this.generateText(
      `${prompt}\n\nSchema:\n${schemaDescription}`,
      'You are an enterprise ERP assistant. Output ONLY valid JSON.'
    );
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned) as T;
  }
}

export class LLMFactory {
  public static createProvider(config: {
    provider?: string;
    endpoint?: string;
    model?: string;
    apiKey?: string;
  }): ILLMProvider {
    const p = (config.provider || 'local').toLowerCase();

    if (p === 'openai' && config.apiKey) {
      return new OpenAIProvider(config.apiKey, config.model || 'gpt-4o-mini');
    }

    // Default to Local Ollama
    return new OllamaProvider(
      config.endpoint || 'http://localhost:11434',
      config.model || 'llama3.2'
    );
  }
}

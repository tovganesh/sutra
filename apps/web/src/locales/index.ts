import { enIN } from './en-IN.ts';
import { enUS } from './en-US.ts';
import { hiIN } from './hi-IN.ts';
import type { LocaleMessage } from './types.ts';

export * from './types.ts';

export interface LocaleConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  defaultCurrency: string;
}

export const SUPPORTED_LOCALES: Record<string, LocaleConfig> = {
  'en-IN': {
    code: 'en-IN',
    name: 'English (India)',
    nativeName: 'English (India)',
    flag: '🇮🇳',
    defaultCurrency: 'INR',
  },
  'en-US': {
    code: 'en-US',
    name: 'English (US)',
    nativeName: 'English (US)',
    flag: '🇺🇸',
    defaultCurrency: 'USD',
  },
  'hi-IN': {
    code: 'hi-IN',
    name: 'Hindi (India)',
    nativeName: 'हिन्दी (भारत)',
    flag: '🇮🇳',
    defaultCurrency: 'INR',
  },
};

export const DEFAULT_LOCALE = 'en-IN';

export const messages: Record<string, LocaleMessage> = {
  'en-IN': enIN,
  'en-US': enUS,
  'hi-IN': hiIN,
};

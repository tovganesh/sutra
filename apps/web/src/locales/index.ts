import { enIN } from './en-IN';
import { enUS } from './en-US';
import { hiIN } from './hi-IN';
import type { LocaleMessage } from './types';

export * from './types';

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

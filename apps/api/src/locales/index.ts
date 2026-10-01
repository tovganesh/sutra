import { enIN, type LocaleDictionary } from './en-IN';
import { enUS } from './en-US';
import { hiIN } from './hi-IN';

export { enIN, enUS, hiIN };
export type { LocaleDictionary };

export type SupportedLocale = 'en-IN' | 'en-US' | 'hi-IN';

export const SUPPORTED_LOCALES: Record<SupportedLocale, string> = {
  'en-IN': 'English (India)',
  'en-US': 'English (United States)',
  'hi-IN': 'हिन्दी (भारत)',
};

export const DEFAULT_LOCALE: SupportedLocale = 'en-IN';

export const locales: Record<SupportedLocale, LocaleDictionary> = {
  'en-IN': enIN,
  'en-US': enUS,
  'hi-IN': hiIN,
};

import { ref, computed, type App, type InjectionKey, inject } from 'vue';
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY, type CurrencyConfig } from './currencies';
import { messages, DEFAULT_LOCALE, SUPPORTED_LOCALES, type LocaleConfig, type LocaleMessage } from '../locales';

export * from './currencies';
export * from '../locales';

const STORAGE_LOCALE_KEY = 'sutra_app_locale';
const STORAGE_CURRENCY_KEY = 'sutra_app_currency';

const initialLocale = (typeof window !== 'undefined' && localStorage.getItem(STORAGE_LOCALE_KEY)) || DEFAULT_LOCALE;
const initialCurrency = (typeof window !== 'undefined' && localStorage.getItem(STORAGE_CURRENCY_KEY)) || DEFAULT_CURRENCY;

const currentLocale = ref<string>(SUPPORTED_LOCALES[initialLocale] ? initialLocale : DEFAULT_LOCALE);
const currentCurrency = ref<string>(SUPPORTED_CURRENCIES[initialCurrency] ? initialCurrency : DEFAULT_CURRENCY);
const convertFx = ref<boolean>(true);

const currencyConfig = computed<CurrencyConfig>(() => {
  return SUPPORTED_CURRENCIES[currentCurrency.value] || SUPPORTED_CURRENCIES[DEFAULT_CURRENCY];
});

const currencySymbol = computed<string>(() => {
  return currencyConfig.value.symbol;
});

const localeConfig = computed<LocaleConfig>(() => {
  return SUPPORTED_LOCALES[currentLocale.value] || SUPPORTED_LOCALES[DEFAULT_LOCALE];
});

/**
 * Translate a key path (e.g. 'common.save' or 'dashboard.kpis.revenue') with parameter interpolation.
 */
export function t(path: string, params?: Record<string, string | number>): string {
  const keys = path.split('.');
  
  // Try current locale
  let result: any = messages[currentLocale.value];
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      result = undefined;
      break;
    }
  }

  // Fallback to default locale (en-IN)
  if (result === undefined && currentLocale.value !== DEFAULT_LOCALE) {
    result = messages[DEFAULT_LOCALE];
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        result = undefined;
        break;
      }
    }
  }

  if (typeof result !== 'string') {
    return path;
  }

  if (!params) {
    return result;
  }

  return result.replace(/\{(\w+)\}/g, (_match, paramKey) => {
    return paramKey in params ? String(params[paramKey]) : `{${paramKey}}`;
  });
}

export interface FormatCurrencyOptions {
  currency?: string;
  decimals?: number;
  convert?: boolean;
}

/**
 * Format a numeric amount using the active currency and locale.
 * Automatically handles symbols (e.g. ₹, $, €), placement, and number systems (e.g. lakhs vs millions).
 */
export function formatCurrency(amount: number, options: FormatCurrencyOptions = {}): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    amount = 0;
  }

  const targetCurrCode = options.currency || currentCurrency.value;
  const config = SUPPORTED_CURRENCIES[targetCurrCode] || SUPPORTED_CURRENCIES[DEFAULT_CURRENCY];
  
  const shouldConvert = options.convert ?? convertFx.value;
  let numericValue = amount;
  if (shouldConvert && targetCurrCode !== 'INR') {
    numericValue = amount * config.rateAgainstINR;
  }

  const decimals = options.decimals !== undefined ? options.decimals : (config.decimalPlaces || 0);

  const formattedNumber = numericValue.toLocaleString(config.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (config.symbolPlacement === 'suffix') {
    return `${formattedNumber} ${config.symbol.trim()}`;
  }
  return `${config.symbol}${formattedNumber}`;
}

/**
 * Format a number using current locale formatting.
 */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  if (isNaN(value) || value === null || value === undefined) {
    return '0';
  }
  return value.toLocaleString(localeConfig.value.code, options);
}

/**
 * Format a percentage with standard symbol.
 */
export function formatPercent(value: number, decimals = 1): string {
  if (isNaN(value) || value === null || value === undefined) {
    return '0%';
  }
  return `${value.toFixed(decimals)}%`;
}

/**
 * Set the active locale.
 */
export function setLocale(locale: string): void {
  if (SUPPORTED_LOCALES[locale]) {
    currentLocale.value = locale;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_LOCALE_KEY, locale);
    }
  }
}

/**
 * Set the active currency.
 */
export function setCurrency(currency: string): void {
  if (SUPPORTED_CURRENCIES[currency]) {
    currentCurrency.value = currency;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_CURRENCY_KEY, currency);
    }
  }
}

/**
 * Toggle auto FX conversion.
 */
export function setConvertFx(val: boolean): void {
  convertFx.value = val;
}

export interface I18nInstance {
  currentLocale: typeof currentLocale;
  currentCurrency: typeof currentCurrency;
  currencyConfig: typeof currencyConfig;
  currencySymbol: typeof currencySymbol;
  localeConfig: typeof localeConfig;
  convertFx: typeof convertFx;
  supportedLocales: typeof SUPPORTED_LOCALES;
  supportedCurrencies: typeof SUPPORTED_CURRENCIES;
  t: typeof t;
  formatCurrency: typeof formatCurrency;
  formatNumber: typeof formatNumber;
  formatPercent: typeof formatPercent;
  setLocale: typeof setLocale;
  setCurrency: typeof setCurrency;
  setConvertFx: typeof setConvertFx;
}

const i18nInstance: I18nInstance = {
  currentLocale,
  currentCurrency,
  currencyConfig,
  currencySymbol,
  localeConfig,
  convertFx,
  supportedLocales: SUPPORTED_LOCALES,
  supportedCurrencies: SUPPORTED_CURRENCIES,
  t,
  formatCurrency,
  formatNumber,
  formatPercent,
  setLocale,
  setCurrency,
  setConvertFx,
};

export const I18nSymbol: InjectionKey<I18nInstance> = Symbol('sutra_i18n');

export function useI18n(): I18nInstance {
  const injected = inject(I18nSymbol, null);
  return injected || i18nInstance;
}

export const i18nPlugin = {
  install(app: App) {
    app.provide(I18nSymbol, i18nInstance);
    app.config.globalProperties.$t = t;
    app.config.globalProperties.$formatCurrency = formatCurrency;
    app.config.globalProperties.$formatNumber = formatNumber;
    app.config.globalProperties.$formatPercent = formatPercent;
    app.config.globalProperties.$currencySymbol = currencySymbol;
    app.config.globalProperties.$currentCurrency = currentCurrency;
    app.config.globalProperties.$currentLocale = currentLocale;
  },
};

export default i18nPlugin;

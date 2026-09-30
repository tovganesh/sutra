export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  rateAgainstINR: number;
  symbolPlacement: 'prefix' | 'suffix';
  decimalPlaces: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee (₹ INR)',
    locale: 'en-IN',
    rateAgainstINR: 1.0,
    symbolPlacement: 'prefix',
    decimalPlaces: 0,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar ($ USD)',
    locale: 'en-US',
    rateAgainstINR: 0.0116,
    symbolPlacement: 'prefix',
    decimalPlaces: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro (€ EUR)',
    locale: 'de-DE',
    rateAgainstINR: 0.0108,
    symbolPlacement: 'prefix',
    decimalPlaces: 2,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound (£ GBP)',
    locale: 'en-GB',
    rateAgainstINR: 0.0092,
    symbolPlacement: 'prefix',
    decimalPlaces: 2,
  },
  AED: {
    code: 'AED',
    symbol: 'AED ',
    name: 'UAE Dirham (AED)',
    locale: 'ar-AE',
    rateAgainstINR: 0.0426,
    symbolPlacement: 'prefix',
    decimalPlaces: 2,
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar (S$ SGD)',
    locale: 'en-SG',
    rateAgainstINR: 0.0154,
    symbolPlacement: 'prefix',
    decimalPlaces: 2,
  },
};

export const DEFAULT_CURRENCY = 'INR';

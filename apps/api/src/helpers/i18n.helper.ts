import { Request } from 'express';
import { locales, DEFAULT_LOCALE, SupportedLocale, LocaleDictionary } from '../locales';

/**
 * Extracts the requested locale from Express Request
 * Checks:
 * 1. Header `x-sutra-locale` or `x-locale`
 * 2. Query param `locale`
 * 3. Header `accept-language`
 * 4. Fallback to DEFAULT_LOCALE ('en-IN')
 */
export function getLocale(req?: Request): SupportedLocale {
  if (!req) return DEFAULT_LOCALE;

  const customHeader = req.headers['x-sutra-locale'] || req.headers['x-locale'];
  if (typeof customHeader === 'string' && isSupportedLocale(customHeader)) {
    return customHeader;
  }

  const queryLocale = req.query?.locale;
  if (typeof queryLocale === 'string' && isSupportedLocale(queryLocale)) {
    return queryLocale;
  }

  const acceptLang = req.headers['accept-language'];
  if (typeof acceptLang === 'string') {
    if (acceptLang.includes('hi')) return 'hi-IN';
    if (acceptLang.includes('en-US')) return 'en-US';
    if (acceptLang.includes('en-IN') || acceptLang.includes('en')) return 'en-IN';
  }

  return DEFAULT_LOCALE;
}

function isSupportedLocale(locale: string): locale is SupportedLocale {
  return locale === 'en-IN' || locale === 'en-US' || locale === 'hi-IN';
}

/**
 * Translates a dot-notated key with optional parameter interpolation
 * Example: t('compliance.gstinRequired', {}, 'hi-IN')
 */
export function t(
  key: string,
  params?: Record<string, string | number>,
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  const dict = locales[locale] || locales[DEFAULT_LOCALE];
  const keys = key.split('.');

  let value: any = dict;
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to default locale if missing in current locale
      let fallback: any = locales[DEFAULT_LOCALE];
      for (const fk of keys) {
        if (fallback && typeof fallback === 'object' && fk in fallback) {
          fallback = fallback[fk];
        } else {
          return key; // return key if not found in dictionary
        }
      }
      value = fallback;
      break;
    }
  }

  if (typeof value !== 'string') {
    return key;
  }

  if (params) {
    return Object.entries(params).reduce((str, [paramKey, paramVal]) => {
      return str.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
    }, value);
  }

  return value;
}

/**
 * Translates a key using the request's detected locale
 */
export function tReq(
  req: Request,
  key: string,
  params?: Record<string, string | number>
): string {
  const locale = getLocale(req);
  return t(key, params, locale);
}

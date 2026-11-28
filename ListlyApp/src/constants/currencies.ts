export const CURRENCY_NONE = 'none';

export const CURRENCY_IDS = [
  'none',
  'currency_euro',
  'currency_usd',
  'currency_gbp',
  'currency_jpy',
  'currency_chf',
  'currency_cad',
  'currency_aud',
  'currency_nzd',
  'currency_sek',
  'currency_nok',
  'currency_dkk',
  'currency_pln',
  'currency_czk',
  'currency_huf',
  'currency_ron',
  'currency_try',
  'currency_brl',
  'currency_inr',
  'currency_krw',
  'currency_cny',
  'currency_thb',
  'currency_sgd',
  'currency_myr',
  'currency_php',
  'currency_idr',
  'currency_vnd',
  'currency_zar',
  'currency_ils',
  'currency_aed',
  'currency_sar',
] as const;

export type CurrencyId = (typeof CURRENCY_IDS)[number];

export type CurrencyLabelKey =
  | 'currency_none'
  | 'currency_euro'
  | 'currency_usd'
  | 'currency_gbp'
  | 'currency_jpy'
  | 'currency_chf'
  | 'currency_cad'
  | 'currency_aud'
  | 'currency_nzd'
  | 'currency_sek'
  | 'currency_nok'
  | 'currency_dkk'
  | 'currency_pln'
  | 'currency_czk'
  | 'currency_huf'
  | 'currency_ron'
  | 'currency_try'
  | 'currency_brl'
  | 'currency_inr'
  | 'currency_krw'
  | 'currency_cny'
  | 'currency_thb'
  | 'currency_sgd'
  | 'currency_myr'
  | 'currency_php'
  | 'currency_idr'
  | 'currency_vnd'
  | 'currency_zar'
  | 'currency_ils'
  | 'currency_aed'
  | 'currency_sar';

export interface CurrencyOption {
  id: CurrencyId;
  symbol: string;
  /** ISO 4217 code, used for plain-text clipboard copies (empty for none). */
  code: string;
  labelKey: CurrencyLabelKey;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { id: 'none', symbol: '', code: '', labelKey: 'currency_none' },
  { id: 'currency_euro', symbol: '€', code: 'EUR', labelKey: 'currency_euro' },
  { id: 'currency_usd', symbol: '$', code: 'USD', labelKey: 'currency_usd' },
  { id: 'currency_gbp', symbol: '£', code: 'GBP', labelKey: 'currency_gbp' },
  { id: 'currency_jpy', symbol: '¥', code: 'JPY', labelKey: 'currency_jpy' },
  { id: 'currency_chf', symbol: 'CHF', code: 'CHF', labelKey: 'currency_chf' },
  { id: 'currency_cad', symbol: 'C$', code: 'CAD', labelKey: 'currency_cad' },
  { id: 'currency_aud', symbol: 'A$', code: 'AUD', labelKey: 'currency_aud' },
  { id: 'currency_nzd', symbol: 'NZ$', code: 'NZD', labelKey: 'currency_nzd' },
  { id: 'currency_sek', symbol: 'kr', code: 'SEK', labelKey: 'currency_sek' },
  { id: 'currency_nok', symbol: 'kr', code: 'NOK', labelKey: 'currency_nok' },
  { id: 'currency_dkk', symbol: 'kr', code: 'DKK', labelKey: 'currency_dkk' },
  { id: 'currency_pln', symbol: 'zł', code: 'PLN', labelKey: 'currency_pln' },
  { id: 'currency_czk', symbol: 'Kč', code: 'CZK', labelKey: 'currency_czk' },
  { id: 'currency_huf', symbol: 'Ft', code: 'HUF', labelKey: 'currency_huf' },
  { id: 'currency_ron', symbol: 'lei', code: 'RON', labelKey: 'currency_ron' },
  { id: 'currency_try', symbol: '₺', code: 'TRY', labelKey: 'currency_try' },
  { id: 'currency_brl', symbol: 'R$', code: 'BRL', labelKey: 'currency_brl' },
  { id: 'currency_inr', symbol: '₹', code: 'INR', labelKey: 'currency_inr' },
  { id: 'currency_krw', symbol: '₩', code: 'KRW', labelKey: 'currency_krw' },
  { id: 'currency_cny', symbol: '¥', code: 'CNY', labelKey: 'currency_cny' },
  { id: 'currency_thb', symbol: '฿', code: 'THB', labelKey: 'currency_thb' },
  { id: 'currency_sgd', symbol: 'S$', code: 'SGD', labelKey: 'currency_sgd' },
  { id: 'currency_myr', symbol: 'RM', code: 'MYR', labelKey: 'currency_myr' },
  { id: 'currency_php', symbol: '₱', code: 'PHP', labelKey: 'currency_php' },
  { id: 'currency_idr', symbol: 'Rp', code: 'IDR', labelKey: 'currency_idr' },
  { id: 'currency_vnd', symbol: '₫', code: 'VND', labelKey: 'currency_vnd' },
  { id: 'currency_zar', symbol: 'R', code: 'ZAR', labelKey: 'currency_zar' },
  { id: 'currency_ils', symbol: '₪', code: 'ILS', labelKey: 'currency_ils' },
  { id: 'currency_aed', symbol: 'AED', code: 'AED', labelKey: 'currency_aed' },
  { id: 'currency_sar', symbol: 'SAR', code: 'SAR', labelKey: 'currency_sar' },
];

export function getCurrencySymbol(currency: CurrencyId): string {
  return CURRENCY_OPTIONS.find(option => option.id === currency)?.symbol ?? '';
}

export function getCurrencyCode(currency: CurrencyId): string {
  return CURRENCY_OPTIONS.find(option => option.id === currency)?.code ?? '';
}

/**
 * Right-hand space reserved for the symbol inside a fixed line-total slot.
 * 1-2 character symbols fit 18px (space + glyph); 3-letter codes need 32px.
 * The returned value is in unscaled px, so callers apply `fs()`.
 */
export function currencySuffixWidth(currency: CurrencyId): number {
  const symbol = getCurrencySymbol(currency);
  if (symbol.length === 0) return 0;
  return symbol.length <= 2 ? 18 : 32;
}

/** 3-letter codes (CHF, AED, SAR) go in a label when space is tight. */
export function usesCurrencyCode(currency: CurrencyId): boolean {
  return getCurrencySymbol(currency).length > 2;
}

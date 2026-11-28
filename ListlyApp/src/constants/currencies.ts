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
  labelKey: CurrencyLabelKey;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { id: 'none', symbol: '', labelKey: 'currency_none' },
  { id: 'currency_euro', symbol: '€', labelKey: 'currency_euro' },
  { id: 'currency_usd', symbol: '$', labelKey: 'currency_usd' },
  { id: 'currency_gbp', symbol: '£', labelKey: 'currency_gbp' },
  { id: 'currency_jpy', symbol: '¥', labelKey: 'currency_jpy' },
  { id: 'currency_chf', symbol: 'CHF', labelKey: 'currency_chf' },
  { id: 'currency_cad', symbol: 'C$', labelKey: 'currency_cad' },
  { id: 'currency_aud', symbol: 'A$', labelKey: 'currency_aud' },
  { id: 'currency_nzd', symbol: 'NZ$', labelKey: 'currency_nzd' },
  { id: 'currency_sek', symbol: 'kr', labelKey: 'currency_sek' },
  { id: 'currency_nok', symbol: 'kr', labelKey: 'currency_nok' },
  { id: 'currency_dkk', symbol: 'kr', labelKey: 'currency_dkk' },
  { id: 'currency_pln', symbol: 'zł', labelKey: 'currency_pln' },
  { id: 'currency_czk', symbol: 'Kč', labelKey: 'currency_czk' },
  { id: 'currency_huf', symbol: 'Ft', labelKey: 'currency_huf' },
  { id: 'currency_ron', symbol: 'lei', labelKey: 'currency_ron' },
  { id: 'currency_try', symbol: '₺', labelKey: 'currency_try' },
  { id: 'currency_brl', symbol: 'R$', labelKey: 'currency_brl' },
  { id: 'currency_inr', symbol: '₹', labelKey: 'currency_inr' },
  { id: 'currency_krw', symbol: '₩', labelKey: 'currency_krw' },
  { id: 'currency_cny', symbol: '¥', labelKey: 'currency_cny' },
  { id: 'currency_thb', symbol: '฿', labelKey: 'currency_thb' },
  { id: 'currency_sgd', symbol: 'S$', labelKey: 'currency_sgd' },
  { id: 'currency_myr', symbol: 'RM', labelKey: 'currency_myr' },
  { id: 'currency_php', symbol: '₱', labelKey: 'currency_php' },
  { id: 'currency_idr', symbol: 'Rp', labelKey: 'currency_idr' },
  { id: 'currency_vnd', symbol: '₫', labelKey: 'currency_vnd' },
  { id: 'currency_zar', symbol: 'R', labelKey: 'currency_zar' },
  { id: 'currency_ils', symbol: '₪', labelKey: 'currency_ils' },
  { id: 'currency_aed', symbol: 'AED', labelKey: 'currency_aed' },
  { id: 'currency_sar', symbol: 'SAR', labelKey: 'currency_sar' },
];

export function getCurrencySymbol(currency: CurrencyId): string {
  return CURRENCY_OPTIONS.find(option => option.id === currency)?.symbol ?? '';
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

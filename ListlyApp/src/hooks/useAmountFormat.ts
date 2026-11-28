import { useMemo } from 'react';
import { useConfig } from '../context/ConfigContext';
import type { AmountFormatOptions } from '../utils/numeric';

/** The global numeric display format (currency + decimal/grouping style). */
export function useAmountFormat(): Required<AmountFormatOptions> {
  const { config } = useConfig();
  return useMemo(
    () => ({ currency: config.currency, amountFormat: config.amountFormat }),
    [config.currency, config.amountFormat],
  );
}

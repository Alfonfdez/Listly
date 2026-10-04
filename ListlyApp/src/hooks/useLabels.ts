import { useConfig } from '../context/ConfigContext';
import { getLabels } from '../i18n';
import type { Translations } from '../i18n/en';

export function useLabels(): Translations {
  const { config } = useConfig();
  return getLabels(config.language);
}

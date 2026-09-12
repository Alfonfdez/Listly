import type { Language } from './en';

export const es: Language = {
  app_name: 'Listly',
  common_cancel: 'Cancelar',
  common_close: 'Cerrar',
  home_search_placeholder: 'Buscar listas y elementos...',
  home_progress: (checked: number, total: number) => `${checked}/${total}`,
  home_empty: 'Aún no hay listas',
  home_empty_hint: 'Pulsa + para crear tu primera lista',
  home_no_results: 'Sin resultados',
  settings_title: 'Ajustes',
};
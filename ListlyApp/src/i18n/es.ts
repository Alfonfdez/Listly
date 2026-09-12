import type { Language } from './en';

export const es: Language = {
  app_name: 'Listly',
  common_cancel: 'Cancelar',
  common_close: 'Cerrar',
  coming_soon: 'Próximamente',
  nav_home: 'Inicio',
  nav_lists: 'Listas',
  nav_settings: 'Ajustes',
  home_add: 'Añadir lista',
  home_open_menu: 'Abrir menú',
  home_search_toggle: 'Buscar listas',
  home_search_placeholder: 'Buscar listas y elementos...',
  home_progress: (checked: number, total: number) => `${checked}/${total}`,
  home_empty: 'Aún no hay listas',
  home_empty_hint: 'Pulsa + para crear tu primera lista',
  home_no_results: 'Sin resultados',
  settings_title: 'Ajustes',
};
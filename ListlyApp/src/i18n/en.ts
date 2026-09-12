export const en = {
  app_name: 'Listly',
  common_cancel: 'Cancel',
  common_close: 'Close',
  coming_soon: 'Coming soon',
  nav_home: 'Home',
  nav_lists: 'Lists',
  nav_settings: 'Settings',
  home_add: 'Add list',
  home_open_menu: 'Open menu',
  home_search_toggle: 'Search lists',
  home_search_placeholder: 'Search lists and items...',
  home_progress: (checked: number, total: number) => `${checked}/${total}`,
  home_empty: 'No lists yet',
  home_empty_hint: 'Tap + to create your first list',
  home_no_results: 'No results found',
  settings_title: 'Settings',
};

export type Language = typeof en;
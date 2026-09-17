import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { Appearance } from 'react-native';
import { type ColorPalette, darkColors, lightColors } from '../constants/themes';
import { THEMES, type Theme } from '../constants/types';
import { setLanguage } from '../i18n';
import { DEFAULT_CONFIG } from '../database/configDefaults';
import { configRepository as configRepo } from '../database';
import type { Config } from '../database/types';

interface ConfigContextType {
  config: Config;
  activeColors: ColorPalette;
  updateConfig: (partial: Partial<Config>) => Promise<void>;
  reload: () => Promise<void>;
  loading: boolean;
}

const ConfigContext = createContext<ConfigContextType | null>(null);

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
}

function resolveTheme(theme: Theme): Exclude<Theme, 'system'> {
  if (theme === THEMES.system) {
    return Appearance.getColorScheme() === THEMES.dark ? THEMES.dark : THEMES.light;
  }
  return theme;
}

function resolveColors(theme: Theme): ColorPalette {
  return resolveTheme(theme) === THEMES.dark ? darkColors : lightColors;
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [activeColors, setActiveColors] = useState<ColorPalette>(() => resolveColors(DEFAULT_CONFIG.theme));
  const configRef = useRef<Config>(DEFAULT_CONFIG);

  const applyConfig = useCallback((next: Config) => {
    configRef.current = next;
    setConfig(next);
    setLanguage(next.language);
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const loaded = await configRepo.get();
        if (!active) return;
        applyConfig(loaded);
      } catch (error) {
        console.error('Failed to load config:', error);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [applyConfig]);

  useEffect(() => {
    setActiveColors(resolveColors(config.theme));
  }, [config.theme]);

  useEffect(() => {
    if (config.theme !== THEMES.system) return;
    const sub = Appearance.addChangeListener(() => {
      setActiveColors(resolveColors(THEMES.system));
    });
    return () => sub?.remove();
  }, [config.theme]);

  const updateConfig = useCallback(async (partial: Partial<Config>) => {
    const previous = configRef.current;
    const next = { ...previous, ...partial };
    configRef.current = next;
    setConfig(next);
    if (partial.language) setLanguage(partial.language);
    try {
      await configRepo.save(partial);
    } catch (error) {
      console.error('Failed to save config:', error);
      applyConfig(previous);
    }
  }, [applyConfig]);

  const reload = useCallback(async () => {
    try {
      applyConfig(await configRepo.get());
    } catch (error) {
      console.error('Failed to reload config:', error);
    }
  }, [applyConfig]);

  const value = useMemo(
    () => ({ config, activeColors, updateConfig, reload, loading }),
    [config, activeColors, updateConfig, reload, loading]
  );

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { Appearance } from 'react-native';
import { type ColorPalette, darkColors, lightColors } from '../constants/themes';
import { LANGUAGES, type Language } from '../constants/languages';
import { THEMES, TEXT_SIZES, type Theme, type TextSize } from '../constants/types';
import { setLanguage } from '../i18n';

export interface Config {
  theme: Theme;
  language: Language;
  textSize: TextSize;
}

export const DEFAULT_CONFIG: Config = {
  theme: THEMES.system,
  language: LANGUAGES.en,
  textSize: TEXT_SIZES.medium,
};

interface ConfigContextType {
  config: Config;
  activeColors: ColorPalette;
  updateConfig: (partial: Partial<Config>) => Promise<void>;
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
  const [activeColors, setActiveColors] = useState<ColorPalette>(darkColors);

  useEffect(() => {
    setConfig(DEFAULT_CONFIG);
    setActiveColors(resolveColors(DEFAULT_CONFIG.theme));
    setLanguage(DEFAULT_CONFIG.language);
    setLoading(false);
  }, []);

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
    if (partial.language) setLanguage(partial.language);
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const value = useMemo(
    () => ({ config, activeColors, updateConfig, loading }),
    [config, activeColors, updateConfig, loading]
  );

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}
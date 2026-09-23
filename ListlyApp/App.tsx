import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Appearance, StyleSheet, View } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { ConfigProvider, useConfig } from './src/context/ConfigContext';
import { AppProvider } from './src/context/AppContext';
import { ToastProvider } from './src/context/ToastContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import { THEMES } from './src/constants/types';
import { isWeb } from './src/utils/platform';
import { initDatabase } from './src/database/database';

if (!isWeb) {
  void SplashScreen.preventAutoHideAsync();
}

function StatusBarTheme() {
  const { config } = useConfig();
  const isDark = config.theme === THEMES.dark
    || (config.theme === THEMES.system && Appearance.getColorScheme() === THEMES.dark);
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

function AppShell() {
  const { activeColors: c } = useConfig();
  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <AppNavigator />
      <StatusBarTheme />
    </View>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        await initDatabase();
      } catch (error) {
        console.error('Failed to initialize database:', error);
      } finally {
        if (active) {
          setReady(true);
          if (!isWeb) void SplashScreen.hideAsync();
        }
      }
    })();
    return () => { active = false; };
  }, []);

  if (!ready) return null;

  return (
    <ConfigProvider>
      <AppProvider>
        <ToastProvider>
          <ErrorBoundary>
            <AppShell />
          </ErrorBoundary>
        </ToastProvider>
      </AppProvider>
    </ConfigProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
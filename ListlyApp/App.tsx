import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Appearance, StyleSheet, View } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { ConfigProvider, useConfig } from './src/context/ConfigContext';
import { THEMES } from './src/constants/types';
import { isWeb } from './src/utils/platform';

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
  useEffect(() => {
    if (isWeb) return;
    void SplashScreen.hideAsync();
  }, []);

  return (
    <ConfigProvider>
      <AppShell />
    </ConfigProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
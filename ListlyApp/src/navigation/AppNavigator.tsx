import { Appearance, StyleSheet, Text, View } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer, type Theme as NavTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { t } from '../i18n';
import { THEMES, type RootStackParamList } from '../constants/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function HomePlaceholder() {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  return (
    <View style={[styles.center, { backgroundColor: c.background }]}>
      <Text style={[styles.title, { color: c.text, fontSize: fs(22), fontWeight: '700' }]}>
        {t().app_name}
      </Text>
    </View>
  );
}

export default function AppNavigator() {
  const { config, activeColors: c } = useConfig();
  const fs = useFontSize();
  const isDark = config.theme === THEMES.dark
    || (config.theme === THEMES.system && Appearance.getColorScheme() === THEMES.dark);

  const navTheme: NavTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: c.background,
      card: c.surface,
      text: c.text,
      primary: c.primary,
      border: c.border,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerTitleAlign: 'center',
          headerTitleStyle: { fontSize: fs(17), fontWeight: '600' },
        }}
      >
        <Stack.Screen name="Home" component={HomePlaceholder} options={{ title: t().app_name }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
  },
});
import { type ReactNode } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useConfig } from '../context/ConfigContext';

interface ScreenShellProps {
  children: ReactNode;
  style?: ViewStyle;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default function ScreenShell({ children, style }: ScreenShellProps) {
  const { activeColors: c } = useConfig();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }, style]} edges={['bottom']}>
      {children}
    </SafeAreaView>
  );
}

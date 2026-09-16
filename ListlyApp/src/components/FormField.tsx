import { type ReactNode } from 'react';
import { Text, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';

interface Props {
  label: string;
  error?: string | null;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

export default function FormField({ label, error, style, children }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  return (
    <View style={style}>
      <Text style={[styles.label, { color: c.textSecondary, fontSize: fs(13) }]}>{label}</Text>
      {children}
      {error ? (
        <Text style={[styles.error, { color: c.red, fontSize: fs(12) }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  error: {
    marginTop: 4,
  },
});

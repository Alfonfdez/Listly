import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import type { IconName } from '../constants/types';

interface Props {
  icon?: IconName;
  message: string;
  hint?: string;
}

export default function EmptyState({ icon, message, hint }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  return (
    <View style={styles.container}>
      {icon && <Ionicons name={icon} size={64} color={c.textSecondary} />}
      <Text style={[styles.text, { color: c.textSecondary, fontSize: fs(16) }]}>{message}</Text>
      {hint && (
        <Text style={[styles.hint, { color: c.textSecondary, fontSize: fs(13) }]}>{hint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  text: {
    textAlign: 'center',
  },
  hint: {
    textAlign: 'center',
  },
});
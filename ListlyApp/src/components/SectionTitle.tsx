import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import type { IconName } from '../constants/types';

interface Props {
  icon: IconName;
  label: string;
}

export default function SectionTitle({ icon, label }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={14} color={c.textSecondary} />
      <Text style={[styles.title, { color: c.textSecondary, fontSize: fs(12) }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  title: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

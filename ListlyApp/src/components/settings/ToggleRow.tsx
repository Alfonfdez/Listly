import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../../context/ConfigContext';
import { useFontSize } from '../../hooks/useFontSize';
import { PRESSED_OPACITY } from '../componentStyles';

interface Props {
  checked: boolean;
  onToggle: () => void;
  label: string;
}

export default function ToggleRow({ checked, onToggle, label }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onToggle}
      activeOpacity={PRESSED_OPACITY}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
    >
      <Text style={[styles.label, { color: c.text, fontSize: fs(15) }]}>{label}</Text>
      <Ionicons
        name={checked ? 'toggle' : 'toggle-outline'}
        size={32}
        color={checked ? c.primary : c.textSecondary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 12,
  },
  label: {
    flex: 1,
    fontWeight: '600',
  },
});

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

export default function CheckboxRow({ checked, onToggle, label }: Props) {
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
      <Ionicons
        name={checked ? 'checkbox' : 'square-outline'}
        size={22}
        color={checked ? c.primary : c.textSecondary}
      />
      <Text style={[styles.label, { color: c.text, fontSize: fs(14) }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  label: {
    fontWeight: '500',
  },
});

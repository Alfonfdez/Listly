import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { BUTTON_BORDER_RADIUS, HIT_SLOP } from './componentStyles';
import { MAX_QUANTITY } from '../constants/types';

interface Props {
  value: number;
  onChange: (value: number) => void;
  label: string;
  decrementLabel: string;
  incrementLabel: string;
  /** Narrower buttons/gaps so three numeric fields fit on one row in the edit modal. */
  compact?: boolean;
}

export default function QuantityStepper({
  value,
  onChange,
  label,
  decrementLabel,
  incrementLabel,
  compact = false,
}: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  const set = (next: number) => onChange(Math.min(MAX_QUANTITY, Math.max(0, Math.trunc(next))));

  return (
    <View style={[styles.row, compact && styles.rowCompact, { backgroundColor: c.surface, borderColor: c.border }]}>
      <TouchableOpacity
        onPress={() => set(value - 1)}
        disabled={value <= 0}
        style={[styles.button, compact && styles.buttonCompact]}
        accessibilityRole="button"
        accessibilityLabel={decrementLabel}
        hitSlop={HIT_SLOP}
      >
        <Ionicons name="remove" size={18} color={value <= 0 ? c.textSecondary : c.text} />
      </TouchableOpacity>
      <Text
        style={[styles.value, { color: c.text, fontSize: fs(15), minWidth: fs(42) }]}
        accessibilityLabel={`${label}: ${value}`}
        numberOfLines={1}
      >
        {value}
      </Text>
      <TouchableOpacity
        onPress={() => set(value + 1)}
        disabled={value >= MAX_QUANTITY}
        style={[styles.button, compact && styles.buttonCompact]}
        accessibilityRole="button"
        accessibilityLabel={incrementLabel}
        hitSlop={HIT_SLOP}
      >
        <Ionicons name="add" size={18} color={value >= MAX_QUANTITY ? c.textSecondary : c.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingHorizontal: 4,
    height: 40,
  },
  rowCompact: {
    paddingHorizontal: 2,
  },
  button: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCompact: {
    width: 26,
  },
  value: {
    textAlign: 'center',
    fontWeight: '600',
  },
});

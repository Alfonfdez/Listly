import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../../context/ConfigContext';
import { useFontSize } from '../../hooks/useFontSize';
import { BUTTON_BORDER_RADIUS, PRESSED_OPACITY } from '../componentStyles';

interface Props {
  label: string;
  value: string;
  onPress: () => void;
}

export default function SettingsPickerRow({ label, value, onPress }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: c.text, fontSize: fs(14) }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.trigger, { borderColor: c.border }]}
        onPress={onPress}
        activeOpacity={PRESSED_OPACITY}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={[styles.value, { color: c.text, fontSize: fs(15) }]}>{value}</Text>
        <Ionicons name="chevron-down" size={18} color={c.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontWeight: '600',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
  },
  value: {
    flex: 1,
    fontWeight: '500',
  },
});

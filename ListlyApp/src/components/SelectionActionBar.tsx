import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { BUTTON_BORDER_RADIUS, DISABLED_OPACITY } from './componentStyles';
import type { IconName } from '../constants/types';

interface Props {
  selectedCount: number;
  countLabel: string;
  deleteLabel: string;
  cancelLabel: string;
  onDelete: () => void;
  onCancel: () => void;
  deleteAccessibilityLabel?: string;
  cancelAccessibilityLabel?: string;
  onPin?: () => void;
  pinLabel?: string;
  pinIcon?: IconName;
  pinAccessibilityLabel?: string;
}

export default function SelectionActionBar({
  selectedCount,
  countLabel,
  deleteLabel,
  cancelLabel,
  onDelete,
  onCancel,
  deleteAccessibilityLabel,
  cancelAccessibilityLabel,
  onPin,
  pinLabel,
  pinIcon = 'star',
  pinAccessibilityLabel,
}: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const disabled = selectedCount === 0;

  return (
    <View style={[styles.bar, { backgroundColor: c.surface, borderTopColor: c.border }]}>
      <Text style={[styles.count, { color: c.text, fontSize: fs(14) }]}>{countLabel}</Text>
      <View style={styles.actions}>
        {onPin ? (
          <TouchableOpacity
            onPress={onPin}
            disabled={disabled}
            style={[styles.button, { borderColor: c.border }, disabled && styles.disabled]}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            accessibilityLabel={pinAccessibilityLabel ?? pinLabel}
          >
            <Ionicons name={pinIcon} size={20} color={disabled ? c.textSecondary : c.star} />
            <Text style={[styles.buttonText, { color: disabled ? c.textSecondary : c.text, fontSize: fs(14) }]}>
              {pinLabel}
            </Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          onPress={onCancel}
          style={[styles.button, { borderColor: c.border }]}
          accessibilityRole="button"
          accessibilityLabel={cancelAccessibilityLabel ?? cancelLabel}
        >
          <Ionicons name="close-outline" size={20} color={c.textSecondary} />
          <Text style={[styles.buttonText, { color: c.text, fontSize: fs(14) }]}>{cancelLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          disabled={disabled}
          style={[
            styles.button,
            disabled
              ? { borderColor: c.border }
              : { backgroundColor: c.red, borderColor: c.red },
            disabled && styles.disabled,
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          accessibilityLabel={deleteAccessibilityLabel ?? deleteLabel}
        >
          <Ionicons name="trash-outline" size={20} color={disabled ? c.textSecondary : c.background} />
          <Text style={[styles.buttonText, { color: disabled ? c.textSecondary : c.background, fontSize: fs(14) }]}>
            {deleteLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  count: {
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  buttonText: {
    fontWeight: '600',
  },
  disabled: {
    opacity: DISABLED_OPACITY,
  },
});
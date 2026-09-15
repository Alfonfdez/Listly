import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { BUTTON_BORDER_RADIUS } from './componentStyles';

interface Props {
  cancelLabel?: string;
  confirmLabel: string;
  onCancel?: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  borderTop?: boolean;
  destructive?: boolean;
}

export default function ModalFooter({
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  confirmDisabled = false,
  borderTop = false,
  destructive = false,
}: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  const confirmBg = confirmDisabled ? c.surface : destructive ? c.red : c.primary;
  const confirmFg = confirmDisabled ? c.textSecondary : c.background;

  return (
    <View
      style={[
        styles.row,
        borderTop && styles.borderTop,
        borderTop && { borderTopColor: c.border },
      ]}
    >
      {cancelLabel && onCancel ? (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: c.background, borderColor: c.border }]}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
        >
          <Text style={[styles.buttonText, { color: c.text, fontSize: fs(14) }]}>{cancelLabel}</Text>
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: confirmBg }]}
        onPress={onConfirm}
        disabled={confirmDisabled}
        accessibilityRole="button"
        accessibilityLabel={confirmLabel}
      >
        <Text style={[styles.buttonText, { color: confirmFg, fontSize: fs(14) }]}>{confirmLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  borderTop: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 0,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BUTTON_BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
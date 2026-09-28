import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, type StyleProp, type ViewStyle } from 'react-native';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { withAlpha } from '../utils/color';
import { ALPHA_TINT, CARD_BORDER_RADIUS, PRESSED_OPACITY } from './componentStyles';
import ModalShell from './ModalShell';

interface PickerModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  scrollStyle?: StyleProp<ViewStyle>;
}

export function PickerModal({ visible, title, subtitle, onClose, children, footer, scrollStyle }: PickerModalProps) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  return (
    <ModalShell visible={visible} onClose={onClose} maxWidth={380} padding={20}>
      <Text style={[styles.title, { color: c.text, fontSize: fs(18) }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: c.textSecondary, fontSize: fs(13) }]}>{subtitle}</Text>
      ) : null}
      <ScrollView style={[styles.scroll, scrollStyle]} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      {footer}
    </ModalShell>
  );
}

interface PickerRowProps {
  label: string;
  selected?: boolean;
  selectedTint?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function PickerRow({
  label,
  selected = false,
  selectedTint = false,
  onPress,
  accessibilityLabel,
  leading,
  trailing,
  style,
}: PickerRowProps) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        pickerStyles.row,
        { borderBottomColor: c.border },
        selected && selectedTint && { backgroundColor: withAlpha(c.primary, ALPHA_TINT) },
        style,
      ]}
      activeOpacity={PRESSED_OPACITY}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
    >
      {leading}
      <Text style={[pickerStyles.label, { color: selected ? c.primary : c.text, fontSize: fs(15) }]} numberOfLines={1}>
        {label}
      </Text>
      {trailing}
    </TouchableOpacity>
  );
}

export const pickerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderRadius: 8,
  },
  label: {
    flex: 1,
    fontWeight: '600',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: CARD_BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leadingIconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
});

const styles = StyleSheet.create({
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
  },
  scroll: {
    marginTop: 12,
    flexGrow: 0,
  },
});

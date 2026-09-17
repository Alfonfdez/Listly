import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../../context/ConfigContext';
import { useFontSize } from '../../hooks/useFontSize';
import { useResetOnOpen } from '../../hooks/useResetOnOpen';
import { BUTTON_BORDER_RADIUS, PRESSED_OPACITY } from '../componentStyles';
import ModalShell from '../ModalShell';
import type { Option } from './SelectorInline';

interface Props<T extends string> {
  visible: boolean;
  title: string;
  options: Option<T>[];
  selected: T;
  cancelLabel: string;
  confirmLabel: string;
  onSelect: (value: T) => void;
  onClose: () => void;
}

export default function OptionPickerModal<T extends string>({
  visible,
  title,
  options,
  selected,
  cancelLabel,
  confirmLabel,
  onSelect,
  onClose,
}: Props<T>) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const [temp, setTemp] = useState<T>(selected);

  const resetOnOpen = useCallback(() => {
    setTemp(selected);
  }, [selected]);
  useResetOnOpen(visible, resetOnOpen);

  const handleConfirm = () => {
    onSelect(temp);
    onClose();
  };

  if (!visible) return null;

  return (
    <ModalShell visible={visible} onClose={onClose} maxWidth={380} padding={20}>
      <Text style={[styles.title, { color: c.text, fontSize: fs(18) }]}>{title}</Text>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {options.map(option => {
          const isSelected = option.value === temp;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.row, { borderBottomColor: c.border }]}
              onPress={() => setTemp(option.value)}
              activeOpacity={PRESSED_OPACITY}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={option.label}
            >
              <View style={styles.leading}>
                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={isSelected ? c.primary : c.textSecondary}
                />
                {option.icon ? <View style={styles.iconWrap}>{option.icon}</View> : null}
              </View>
              <Text
                style={[styles.label, { color: isSelected ? c.primary : c.text, fontSize: fs(15) }]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: c.background, borderColor: c.border }]}
          onPress={onClose}
          activeOpacity={PRESSED_OPACITY}
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
        >
          <Text style={[styles.buttonText, { color: c.text, fontSize: fs(14) }]}>{cancelLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.confirm, { backgroundColor: c.primary }]}
          onPress={handleConfirm}
          activeOpacity={PRESSED_OPACITY}
          accessibilityRole="button"
          accessibilityLabel={confirmLabel}
        >
          <Text style={[styles.buttonText, { color: c.background, fontSize: fs(14) }]}>
            {confirmLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  scroll: {
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    flex: 1,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BUTTON_BORDER_RADIUS,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  confirm: {
    borderWidth: 0,
  },
  buttonText: {
    fontWeight: '600',
  },
});

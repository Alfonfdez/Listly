import { type ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useConfig } from '../../context/ConfigContext';
import { useFontSize } from '../../hooks/useFontSize';
import { withAlpha } from '../../utils/color';
import { ALPHA_SELECTED, BUTTON_BORDER_RADIUS, PRESSED_OPACITY } from '../componentStyles';

export interface Option<T extends string = string> {
  label: string;
  value: T;
  icon?: ReactNode;
}

interface Props<T extends string> {
  options: Option<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

export default function SelectorInline<T extends string>({ options, selected, onSelect }: Props<T>) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  return (
    <View style={styles.row}>
      {options.map(option => {
        const isSelected = option.value === selected;
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              {
                borderColor: isSelected ? c.primary : c.border,
                backgroundColor: isSelected ? withAlpha(c.primary, ALPHA_SELECTED) : 'transparent',
              },
            ]}
            onPress={() => onSelect(option.value)}
            activeOpacity={PRESSED_OPACITY}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={option.label}
          >
            {option.icon}
            <Text
              style={[styles.label, { color: isSelected ? c.primary : c.text, fontSize: fs(14) }]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: BUTTON_BORDER_RADIUS,
  },
  label: {
    fontWeight: '600',
  },
});

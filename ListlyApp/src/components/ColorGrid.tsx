import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WHITE, TRANSPARENT } from '../constants/themes';
import { QUICK_COLORS } from '../constants/listColors';
import { useConfig } from '../context/ConfigContext';
import { useLabels } from '../hooks/useLabels';

interface Props {
  selectedColor: string | null;
  customColor: string | null;
  onSelect: (color: string) => void;
  onOpenPicker: () => void;
}

export default function ColorGrid({ selectedColor, customColor, onSelect, onOpenPicker }: Props) {
  const { activeColors: c } = useConfig();
  const labels = useLabels();

  return (
    <View style={styles.row}>
      {QUICK_COLORS.map((color) => {
        const isSelected = selectedColor === color;
        return (
          <TouchableOpacity
            key={color}
            style={[
              styles.circle,
              { backgroundColor: color },
              isSelected && { borderWidth: 3, borderColor: c.text },
            ]}
            onPress={() => onSelect(color)}
            accessibilityLabel={color}
            accessibilityState={{ selected: isSelected }}
          >
            {isSelected && (
              <Ionicons name="checkmark" size={14} color={WHITE} />
            )}
          </TouchableOpacity>
        );
      })}
      {customColor && (
        <TouchableOpacity
          style={[
            styles.circle,
            { backgroundColor: customColor },
            selectedColor === customColor && { borderWidth: 3, borderColor: c.text },
          ]}
          onPress={() => onSelect(customColor)}
          accessibilityLabel={customColor}
          accessibilityState={{ selected: selectedColor === customColor }}
        >
          {selectedColor === customColor && (
            <Ionicons name="checkmark" size={14} color={WHITE} />
          )}
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[styles.circle, { backgroundColor: c.textSecondary }]}
        onPress={onOpenPicker}
        accessibilityLabel={labels.color_grid_more}
      >
        <Ionicons name="add" size={18} color={WHITE} />
      </TouchableOpacity>
    </View>
  );
}

const SWATCH_SIZE = 36;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  circle: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: TRANSPARENT,
  },
});
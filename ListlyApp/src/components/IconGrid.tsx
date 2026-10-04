import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { TRANSPARENT } from '../constants/themes';
import { withAlpha } from '../utils/color';
import { ALPHA_SELECTED, CARD_BORDER_RADIUS } from './componentStyles';
import type { IconName } from '../constants/types';

interface Props {
  options: IconName[];
  selected: IconName;
  onSelect: (icon: IconName) => void;
}

export default function IconGrid({ options, selected, onSelect }: Props) {
  const { activeColors: c } = useConfig();

  return (
    <View style={styles.grid}>
      {options.map(option => {
        const isSelected = option === selected;
        return (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            accessibilityRole="button"
            accessibilityLabel={option}
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.iconOption,
              {
                borderColor: isSelected ? c.primary : TRANSPARENT,
                backgroundColor: isSelected ? withAlpha(c.primary, ALPHA_SELECTED) : c.surface,
              },
            ]}
          >
            <Ionicons name={option} size={20} color={isSelected ? c.primary : c.text} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: CARD_BORDER_RADIUS,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

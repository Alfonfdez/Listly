import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { SELECTION_CHECK_SIZE, SELECTION_CHECK_RADIUS } from './componentStyles';

interface Props {
  selected: boolean;
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
  unselectedBackground?: string;
}

export default function SelectionCheck({ selected, style, iconSize = 12, unselectedBackground }: Props) {
  const { activeColors: c } = useConfig();

  return (
    <View
      style={[
        styles.check,
        selected
          ? { backgroundColor: c.primary, borderColor: c.primary }
          : { backgroundColor: unselectedBackground ?? 'transparent', borderColor: c.border },
        style,
      ]}
    >
      {selected ? <Ionicons name="checkmark" size={iconSize} color={c.background} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  check: {
    width: SELECTION_CHECK_SIZE,
    height: SELECTION_CHECK_SIZE,
    borderRadius: SELECTION_CHECK_RADIUS,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

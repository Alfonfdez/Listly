import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useLabels } from '../hooks/useLabels';
import { ICONS } from '../constants/icons';

interface Props {
  style?: StyleProp<ViewStyle>;
}

export default function NumericBadge({ style }: Props) {
  const { activeColors: c } = useConfig();
  const labels = useLabels();

  return (
    <View
      style={[styles.badge, { backgroundColor: c.surface, borderColor: c.border }, style]}
      accessibilityLabel={labels.list_kind_numeric}
    >
      <Ionicons name={ICONS.numeric} size={13} color={c.primary} />
    </View>
  );
}

const BADGE_SIZE = 22;

const styles = StyleSheet.create({
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

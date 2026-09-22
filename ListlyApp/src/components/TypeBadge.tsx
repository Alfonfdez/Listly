import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import type { IconName } from '../constants/types';

interface Props {
  type: 'collection' | 'list';
  style?: StyleProp<ViewStyle>;
}

export default function TypeBadge({ type, style }: Props) {
  const { activeColors: c } = useConfig();
  const icon: IconName = type === 'collection' ? 'albums-outline' : 'list-outline';

  return (
    <View style={[styles.badge, { backgroundColor: c.surface, borderColor: c.border }, style]}>
      <Ionicons name={icon} size={13} color={c.textSecondary} />
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

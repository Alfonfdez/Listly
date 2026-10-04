import { StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sortable from 'react-native-sortables';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { withAlpha } from '../utils/color';
import { TRANSPARENT } from '../constants/themes';
import { ICONS } from '../constants/icons';
import { ALPHA_TINT, ALPHA_SUBTLE, FAB_SIZE, FAB_BOTTOM_OFFSET } from './componentStyles';

interface Props {
  active: boolean;
  hover: boolean;
  onItemEnter: () => void;
  onItemLeave: () => void;
  onItemDrop: () => void;
  label: string;
  hint: string;
}

export default function RemoveFromCollectionTarget({
  active,
  hover,
  onItemEnter,
  onItemLeave,
  onItemDrop,
  label,
  hint,
}: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  return (
    <Sortable.BaseZone
      onItemEnter={onItemEnter}
      onItemLeave={onItemLeave}
      onItemDrop={onItemDrop}
      style={[
        styles.removeTarget,
        {
          opacity: active ? 1 : 0,
          borderColor: hover ? c.primary : TRANSPARENT,
          backgroundColor: hover
            ? withAlpha(c.primary, ALPHA_TINT)
            : withAlpha(c.textSecondary, ALPHA_SUBTLE),
        },
      ]}
      pointerEvents={active ? 'auto' : 'none'}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={active ? hint : undefined}
    >
      <Ionicons name={ICONS.removeFromCollection} size={20} color={hover ? c.primary : c.textSecondary} />
      <Text style={[styles.removeTargetText, { color: hover ? c.primary : c.textSecondary, fontSize: fs(13) }]}>
        {label}
      </Text>
    </Sortable.BaseZone>
  );
}

const styles = StyleSheet.create({
  removeTarget: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: FAB_BOTTOM_OFFSET + FAB_SIZE + 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1,
  },
  removeTargetText: {
    fontWeight: '600',
  },
});

import { memo } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useLabels } from '../hooks/useLabels';
import { CARD_BORDER_RADIUS, ALPHA_TINT, ALPHA_BADGE } from './componentStyles';
import { withAlpha } from '../utils/color';
import SortablePressable from './SortablePressable';
import SelectionCheck from './SelectionCheck';
import TypeBadge from './TypeBadge';
import type { CollectionWithCounts } from '../database/types';
import type { IconName } from '../constants/types';

interface Props {
  collection: CollectionWithCounts;
  selectMode: boolean;
  selected: boolean;
  onPress: () => void;
}

function CollectionRowInner({ collection, selectMode, selected, onPress }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();

  return (
    <SortablePressable
      style={[
        styles.row,
        { backgroundColor: withAlpha(collection.color, ALPHA_TINT) },
        selectMode && selected && { borderColor: c.primary },
        selectMode && !selected && { borderColor: c.border },
      ]}
      onPress={onPress}
      accessibilityRole={selectMode ? 'checkbox' : undefined}
      accessibilityState={selectMode ? { checked: selected } : undefined}
      accessibilityLabel={selected ? `${collection.name}, ${labels.select_selected(1)}` : collection.name}
    >
      <View style={[styles.accentBar, { backgroundColor: collection.color }]} />
      <View style={styles.badgeWrap}>
        <View style={[styles.badge, { backgroundColor: withAlpha(collection.color, ALPHA_BADGE) }]}>
          <Ionicons name={collection.icon as IconName} size={22} color={collection.color} />
        </View>
        {selectMode ? (
          <SelectionCheck selected={selected} style={styles.check} unselectedBackground={c.surface} />
        ) : null}
      </View>
      <Text style={[styles.name, { color: c.text, fontSize: fs(15) }]} numberOfLines={1}>
        {collection.name}
      </Text>
      <Text style={[styles.progress, { color: c.textSecondary, fontSize: fs(13) }]}>
        {labels.home_progress(collection.completed, collection.total)}
      </Text>
      {!selectMode ? <TypeBadge type="collection" /> : null}
    </SortablePressable>
  );
}

const BADGE_SIZE = 40;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: CARD_BORDER_RADIUS,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  badgeWrap: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    position: 'relative',
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    position: 'absolute',
    top: -3,
    right: -3,
  },
  name: {
    flex: 1,
    fontWeight: '600',
  },
  progress: {
    fontWeight: '500',
  },
});

export default memo(CollectionRowInner);
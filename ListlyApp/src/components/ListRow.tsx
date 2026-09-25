import { memo } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useLabels } from '../hooks/useLabels';
import { CARD_BORDER_RADIUS, ALPHA_TINT, ALPHA_BADGE } from './componentStyles';
import { TRANSPARENT } from '../constants/themes';
import { ICONS } from '../constants/icons';
import { withAlpha } from '../utils/color';
import SortablePressable from './SortablePressable';
import SelectionCheck from './SelectionCheck';
import TypeBadge from './TypeBadge';
import type { ListWithCounts } from '../database/types';
import type { IconName } from '../constants/types';

interface Props {
  list: ListWithCounts;
  collection?: { name: string; color: string };
  selectMode: boolean;
  selected: boolean;
  onPress: () => void;
}

function ListRowInner({ list, collection, selectMode, selected, onPress }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();

  return (
    <SortablePressable
      style={[
        styles.row,
        { backgroundColor: withAlpha(list.color, ALPHA_TINT) },
        selectMode && selected && { borderColor: c.primary },
        selectMode && !selected && { borderColor: c.border },
      ]}
      onPress={onPress}
      accessibilityRole={selectMode ? 'checkbox' : undefined}
      accessibilityState={selectMode ? { checked: selected } : undefined}
      accessibilityLabel={selected ? `${list.name}, ${labels.select_selected(1)}` : list.name}
    >
      <View style={styles.badgeWrap}>
        <View style={[styles.badge, { backgroundColor: withAlpha(list.color, ALPHA_BADGE) }]}>
          <Ionicons name={list.icon as IconName} size={22} color={list.color} />
        </View>
        {selectMode ? (
          <SelectionCheck selected={selected} style={styles.check} unselectedBackground={c.surface} />
        ) : null}
      </View>
      <View style={styles.nameColumn}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: c.text, fontSize: fs(15) }]} numberOfLines={1}>
            {list.name}
          </Text>
          {list.pinned === 1 && !selectMode ? (
            <Ionicons name="star" size={13} color={c.star} accessibilityLabel={labels.home_pinned} />
          ) : null}
        </View>
        {collection && !selectMode ? (
          <View style={styles.collectionRow}>
            <Ionicons name={ICONS.collection} size={12} color={collection.color} />
            <Text style={[styles.collectionName, { color: collection.color, fontSize: fs(12) }]} numberOfLines={1}>
              {collection.name}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.progress, { color: c.textSecondary, fontSize: fs(13) }]}>
        {labels.home_progress(list.completed, list.total)}
      </Text>
      {!selectMode ? <TypeBadge type="list" /> : null}
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
    borderColor: TRANSPARENT,
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
    fontWeight: '600',
    flexShrink: 1,
  },
  nameColumn: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  collectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  collectionName: {
    fontWeight: '500',
  },
  progress: {
    fontWeight: '500',
  },
});

export default memo(ListRowInner);
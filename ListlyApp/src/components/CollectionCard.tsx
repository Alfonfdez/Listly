import { memo } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useLabels } from '../hooks/useLabels';
import { CARD_BORDER_RADIUS, ALPHA_TINT } from './componentStyles';
import { TRANSPARENT } from '../constants/themes';
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
  dropTarget?: boolean;
}

function CollectionCardInner({ collection, selectMode, selected, onPress, dropTarget = false }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();

  return (
    <SortablePressable
      style={[
        styles.card,
        { backgroundColor: withAlpha(collection.color, ALPHA_TINT) },
        selectMode && selected && { borderColor: c.primary },
        selectMode && !selected && { borderColor: c.border },
        dropTarget && { borderColor: c.primary, backgroundColor: withAlpha(c.primary, ALPHA_TINT) },
      ]}
      onPress={onPress}
      accessibilityRole={selectMode ? 'checkbox' : undefined}
      accessibilityState={selectMode ? { checked: selected } : undefined}
      accessibilityLabel={selected ? `${collection.name}, ${labels.select_selected(1)}` : collection.name}
      accessibilityHint={dropTarget ? labels.home_drop_hint : undefined}
    >
      <View style={[styles.accentBar, { backgroundColor: collection.color }]} />
      {selectMode ? <SelectionCheck selected={selected} style={styles.check} iconSize={14} /> : null}
      {!selectMode ? <TypeBadge type="collection" style={styles.typeBadge} /> : null}
      <Ionicons name={collection.icon as IconName} size={28} color={collection.color} />
      <View style={styles.nameRow}>
        <Text style={[styles.name, { color: c.text, fontSize: fs(14) }]} numberOfLines={1}>
          {collection.name}
        </Text>
        {collection.pinned === 1 && !selectMode ? (
          <Ionicons name="star" size={14} color={c.star} accessibilityLabel={labels.home_pinned} />
        ) : null}
      </View>
      <Text style={[styles.progress, { color: c.textSecondary, fontSize: fs(12) }]}>
        {labels.home_progress(collection.completed, collection.total)}
      </Text>
    </SortablePressable>
  );
}

export default memo(CollectionCardInner);

const styles = StyleSheet.create({
  card: {
    borderRadius: CARD_BORDER_RADIUS,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: TRANSPARENT,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  name: {
    fontWeight: '600',
    flexShrink: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'stretch',
  },
  progress: {
    fontWeight: '500',
  },
});
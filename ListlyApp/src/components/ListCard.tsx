import { memo } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useLabels } from '../hooks/useLabels';
import { CARD_BORDER_RADIUS, ALPHA_TINT } from './componentStyles';
import { TRANSPARENT } from '../constants/themes';
import { NBSP } from '../constants/text';
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
  reserveCollectionLine?: boolean;
}

function ListCardInner({ list, collection, selectMode, selected, onPress, reserveCollectionLine = false }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();

  return (
    <SortablePressable
      style={[
        styles.card,
        { backgroundColor: withAlpha(list.color, ALPHA_TINT) },
        selectMode && selected && { borderColor: c.primary },
        selectMode && !selected && { borderColor: c.border },
      ]}
      onPress={onPress}
      accessibilityRole={selectMode ? 'checkbox' : undefined}
      accessibilityState={selectMode ? { checked: selected } : undefined}
      accessibilityLabel={selected ? `${list.name}, ${labels.select_selected(1)}` : list.name}
    >
      {selectMode ? <SelectionCheck selected={selected} style={styles.check} iconSize={14} /> : null}
      {!selectMode ? <TypeBadge type="list" style={styles.typeBadge} /> : null}
      <Ionicons name={list.icon as IconName} size={28} color={list.color} />
      <Text style={[styles.name, { color: c.text, fontSize: fs(14) }]} numberOfLines={1}>
        {list.name}
      </Text>
      {(collection || reserveCollectionLine) && !selectMode ? (
        <View style={[styles.collectionRow, !collection && styles.collectionRowHidden]}>
          <Ionicons name={ICONS.collection} size={12} color={collection?.color ?? c.textSecondary} />
          <Text
            style={[styles.collectionName, { color: collection?.color ?? c.textSecondary, fontSize: fs(12) }]}
            numberOfLines={1}
          >
            {collection?.name ?? NBSP}
          </Text>
        </View>
      ) : null}
      <Text style={[styles.progress, { color: c.textSecondary, fontSize: fs(12) }]}>
        {labels.home_progress(list.completed, list.total)}
      </Text>
    </SortablePressable>
  );
}

export default memo(ListCardInner);

const styles = StyleSheet.create({
  card: {
    borderRadius: CARD_BORDER_RADIUS,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: TRANSPARENT,
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
  },
  collectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  collectionRowHidden: {
    opacity: 0,
  },
  collectionName: {
    fontWeight: '500',
  },
  progress: {
    fontWeight: '500',
  },
});
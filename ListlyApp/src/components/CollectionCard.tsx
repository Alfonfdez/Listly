import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { CARD_BORDER_RADIUS, ALPHA_TINT } from './componentStyles';
import { TRANSPARENT } from '../constants/themes';
import { withAlpha } from '../utils/color';
import SelectionCheck from './SelectionCheck';
import TypeBadge from './TypeBadge';
import { TileShell, TileName, TileProgress, TileIcon, tileStyles } from './Tile';
import { useFontSize } from '../hooks/useFontSize';
import { useLabels } from '../hooks/useLabels';
import type { CollectionWithCounts } from '../database/types';

interface Props {
  collection: CollectionWithCounts;
  selectMode: boolean;
  selected: boolean;
  onPress: () => void;
  dropTarget?: boolean;
}

function CollectionCardInner({ collection, selectMode, selected, onPress, dropTarget = false }: Props) {
  const fs = useFontSize();
  const labels = useLabels();

  return (
    <TileShell
      name={collection.name}
      selectMode={selectMode}
      selected={selected}
      onPress={onPress}
      dropTarget={dropTarget}
      accessibilityHint={dropTarget ? labels.home_drop_hint : undefined}
      style={[styles.card, { backgroundColor: withAlpha(collection.color, ALPHA_TINT) }]}
    >
      <View style={[styles.accentBar, { backgroundColor: collection.color }]} />
      {selectMode ? <SelectionCheck selected={selected} style={tileStyles.check} iconSize={14} /> : null}
      {!selectMode ? <TypeBadge type="collection" style={tileStyles.typeBadge} /> : null}
      <TileIcon icon={collection.icon} color={collection.color} />
      <TileName name={collection.name} pinned={collection.pinned} fontSize={fs(14)} />
      <TileProgress completed={collection.completed} total={collection.total} fontSize={fs(12)} />
    </TileShell>
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
});

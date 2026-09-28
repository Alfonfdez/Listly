import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { CARD_BORDER_RADIUS, ALPHA_TINT } from './componentStyles';
import { TRANSPARENT } from '../constants/themes';
import { withAlpha } from '../utils/color';
import SelectionCheck from './SelectionCheck';
import TypeBadge from './TypeBadge';
import { TileShell, TileName, TileProgress, TileBadge, tileStyles, tileBadgeSize } from './Tile';
import { useConfig } from '../context/ConfigContext';
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

function CollectionRowInner({ collection, selectMode, selected, onPress, dropTarget = false }: Props) {
  const { activeColors: c } = useConfig();
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
      style={[styles.row, { backgroundColor: withAlpha(collection.color, ALPHA_TINT) }]}
    >
      <View style={[styles.accentBar, { backgroundColor: collection.color }]} />
      <View style={styles.badgeWrap}>
        <TileBadge icon={collection.icon} color={collection.color} />
        {selectMode ? (
          <SelectionCheck selected={selected} style={tileStyles.rowCheck} unselectedBackground={c.surface} />
        ) : null}
      </View>
      <TileName name={collection.name} pinned={collection.pinned} fontSize={fs(15)} starSize={13} style={styles.nameRow} />
      <TileProgress completed={collection.completed} total={collection.total} fontSize={fs(13)} />
      {!selectMode ? <TypeBadge type="collection" /> : null}
    </TileShell>
  );
}

export default memo(CollectionRowInner);

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
    width: tileBadgeSize,
    height: tileBadgeSize,
    position: 'relative',
  },
  nameRow: {
    flex: 1,
  },
});

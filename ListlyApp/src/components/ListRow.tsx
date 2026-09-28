import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { CARD_BORDER_RADIUS, ALPHA_TINT } from './componentStyles';
import { TRANSPARENT } from '../constants/themes';
import { withAlpha } from '../utils/color';
import SelectionCheck from './SelectionCheck';
import TypeBadge from './TypeBadge';
import { TileShell, TileName, TileCollection, TileProgress, TileBadge, tileStyles, tileBadgeSize } from './Tile';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import type { ListWithCounts } from '../database/types';

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

  return (
    <TileShell
      name={list.name}
      selectMode={selectMode}
      selected={selected}
      onPress={onPress}
      style={[styles.row, { backgroundColor: withAlpha(list.color, ALPHA_TINT) }]}
    >
      <View style={styles.badgeWrap}>
        <TileBadge icon={list.icon} color={list.color} />
        {selectMode ? (
          <SelectionCheck selected={selected} style={tileStyles.rowCheck} unselectedBackground={c.surface} />
        ) : null}
      </View>
      <View style={styles.nameColumn}>
        <TileName name={list.name} pinned={list.pinned} fontSize={fs(15)} starSize={13} style={styles.nameRow} />
        {collection && !selectMode ? <TileCollection collection={collection} /> : null}
      </View>
      <TileProgress completed={list.completed} total={list.total} fontSize={fs(13)} />
      {!selectMode ? <TypeBadge type="list" /> : null}
    </TileShell>
  );
}

export default memo(ListRowInner);

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
    width: tileBadgeSize,
    height: tileBadgeSize,
    position: 'relative',
  },
  nameColumn: {
    flex: 1,
  },
  nameRow: {
    alignSelf: 'stretch',
  },
});

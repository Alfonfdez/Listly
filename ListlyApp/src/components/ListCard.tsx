import { memo } from 'react';
import { StyleSheet } from 'react-native';
import { CARD_BORDER_RADIUS, ALPHA_TINT } from './componentStyles';
import { TRANSPARENT } from '../constants/themes';
import { withAlpha } from '../utils/color';
import SelectionCheck from './SelectionCheck';
import TypeBadge from './TypeBadge';
import { TileShell, TileName, TileCollection, TileProgress, TileIcon, tileStyles } from './Tile';
import { useFontSize } from '../hooks/useFontSize';
import type { ListWithCounts } from '../database/types';

interface Props {
  list: ListWithCounts;
  collection?: { name: string; color: string };
  selectMode: boolean;
  selected: boolean;
  onPress: () => void;
  reserveCollectionLine?: boolean;
}

function ListCardInner({ list, collection, selectMode, selected, onPress, reserveCollectionLine = false }: Props) {
  const fs = useFontSize();

  return (
    <TileShell
      name={list.name}
      selectMode={selectMode}
      selected={selected}
      onPress={onPress}
      style={[styles.card, { backgroundColor: withAlpha(list.color, ALPHA_TINT) }]}
    >
      {selectMode ? <SelectionCheck selected={selected} style={tileStyles.check} iconSize={14} /> : null}
      {!selectMode ? <TypeBadge type="list" style={tileStyles.typeBadge} /> : null}
      <TileIcon icon={list.icon} color={list.color} />
      <TileName name={list.name} pinned={list.pinned} fontSize={fs(14)} />
      {!selectMode ? (
        <TileCollection collection={collection} reserveLine={reserveCollectionLine} />
      ) : null}
      <TileProgress completed={list.completed} total={list.total} fontSize={fs(12)} />
    </TileShell>
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
});

import { View, StyleSheet } from 'react-native';
import { CARD_BORDER_RADIUS, ALPHA_TINT } from './componentStyles';
import { TRANSPARENT } from '../constants/themes';
import { withAlpha } from '../utils/color';
import SelectionCheck from './SelectionCheck';
import TypeBadge from './TypeBadge';
import {
  TileShell,
  TileName,
  TileCollection,
  TileProgress,
  TileLocked,
  TileIcon,
  TileBadge,
  tileStyles,
  tileBadgeSize,
} from './Tile';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useLabels } from '../hooks/useLabels';
import type { Flag } from '../utils/flags';

type EntityKind = 'list' | 'collection';
type EntityLayout = 'card' | 'row';

export interface TileEntity {
  id: number;
  kind: EntityKind;
  name: string;
  color: string;
  icon: string;
  pinned: Flag;
  completed: number;
  total: number;
  locked?: boolean;
  collection?: { name: string; color: string };
}

interface Props {
  entity: TileEntity;
  layout: EntityLayout;
  selectMode: boolean;
  selected: boolean;
  onPress: () => void;
  reserveCollectionLine?: boolean;
  dropTarget?: boolean;
}

export default function EntityTile({
  entity,
  layout,
  selectMode,
  selected,
  onPress,
  reserveCollectionLine = false,
  dropTarget = false,
}: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();

  const isCard = layout === 'card';
  const isCollection = entity.kind === 'collection';
  const showCollection = entity.kind === 'list' && !selectMode;
  const progressFont = fs(isCard ? 12 : 13);
  const progress = entity.locked ? (
    <TileLocked fontSize={progressFont} />
  ) : (
    <TileProgress completed={entity.completed} total={entity.total} fontSize={progressFont} />
  );

  return (
    <TileShell
      name={entity.name}
      selectMode={selectMode}
      selected={selected}
      onPress={onPress}
      dropTarget={dropTarget}
      accessibilityHint={dropTarget ? labels.home_drop_hint : undefined}
      style={[
        isCard ? styles.card : styles.row,
        isCollection && styles.clip,
        { backgroundColor: withAlpha(entity.color, ALPHA_TINT) },
      ]}
    >
      {isCollection ? (
        <View style={[isCard ? styles.accentTop : styles.accentLeft, { backgroundColor: entity.color }]} />
      ) : null}
      {isCard ? (
        <>
          {selectMode ? <SelectionCheck selected={selected} style={tileStyles.check} iconSize={14} /> : null}
          {!selectMode ? <TypeBadge type={entity.kind} style={tileStyles.typeBadge} /> : null}
          <TileIcon icon={entity.icon} color={entity.color} />
          <TileName name={entity.name} pinned={entity.pinned} locked={entity.locked} fontSize={fs(14)} />
          {showCollection ? (
            <TileCollection collection={entity.collection} reserveLine={reserveCollectionLine} />
          ) : null}
          {progress}
        </>
      ) : (
        <>
          <View style={styles.badgeWrap}>
            <TileBadge icon={entity.icon} color={entity.color} />
            {selectMode ? (
              <SelectionCheck selected={selected} style={tileStyles.rowCheck} unselectedBackground={c.surface} />
            ) : null}
          </View>
          <View style={styles.nameColumn}>
            <TileName
              name={entity.name}
              pinned={entity.pinned}
              locked={entity.locked}
              fontSize={fs(15)}
              starSize={13}
              style={styles.nameRow}
            />
            {showCollection && entity.collection ? <TileCollection collection={entity.collection} /> : null}
          </View>
          {progress}
          {!selectMode ? <TypeBadge type={entity.kind} /> : null}
        </>
      )}
    </TileShell>
  );
}

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
  clip: {
    overflow: 'hidden',
  },
  accentTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  accentLeft: {
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
  nameColumn: {
    flex: 1,
  },
  nameRow: {
    alignSelf: 'stretch',
  },
});

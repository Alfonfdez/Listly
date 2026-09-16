import { memo } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { t } from '../i18n';
import { CARD_BORDER_RADIUS, ALPHA_TINT, ALPHA_BADGE } from './componentStyles';
import { withAlpha } from '../utils/color';
import SortablePressable from './SortablePressable';
import SelectionCheck from './SelectionCheck';
import type { ListWithCounts } from '../database/types';
import type { IconName } from '../constants/types';

interface Props {
  list: ListWithCounts;
  selectMode: boolean;
  selected: boolean;
  onPress: () => void;
}

function ListRowInner({ list, selectMode, selected, onPress }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = t();

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
      <Text style={[styles.name, { color: c.text, fontSize: fs(15) }]} numberOfLines={1}>
        {list.name}
      </Text>
      <Text style={[styles.progress, { color: c.textSecondary, fontSize: fs(13) }]}>
        {labels.home_progress(list.completed, list.total)}
      </Text>
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

export default memo(ListRowInner);
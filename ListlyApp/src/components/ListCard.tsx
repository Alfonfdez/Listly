import { memo } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { t } from '../i18n';
import { CARD_BORDER_RADIUS } from './componentStyles';
import { withAlpha } from '../utils/color';
import SortablePressable from './SortablePressable';
import type { ListWithCounts } from '../database/types';
import type { IconName } from '../constants/types';

interface Props {
  list: ListWithCounts;
  selectMode: boolean;
  selected: boolean;
  onPress: () => void;
}

function ListCardInner({ list, selectMode, selected, onPress }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = t();

  return (
    <SortablePressable
      style={[
        styles.card,
        { backgroundColor: withAlpha(list.color, 13) },
        selectMode && selected && { borderColor: c.primary },
        selectMode && !selected && { borderColor: c.border },
      ]}
      onPress={onPress}
      accessibilityRole={selectMode ? 'checkbox' : undefined}
      accessibilityState={selectMode ? { checked: selected } : undefined}
      accessibilityLabel={selected ? `${list.name}, ${labels.select_selected(1)}` : list.name}
    >
      {selectMode ? (
        <View style={[styles.check, selected ? { backgroundColor: c.primary } : { borderColor: c.border }]}>
          {selected ? <Ionicons name="checkmark" size={14} color={c.background} /> : null}
        </View>
      ) : null}
      <Ionicons name={list.icon as IconName} size={28} color={list.color} />
      <Text style={[styles.name, { color: c.text, fontSize: fs(14) }]} numberOfLines={1}>
        {list.name}
      </Text>
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
    borderColor: 'transparent',
  },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontWeight: '600',
  },
  progress: {
    fontWeight: '500',
  },
});
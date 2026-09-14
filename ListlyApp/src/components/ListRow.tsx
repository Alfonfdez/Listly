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
  onPress: () => void;
}

function ListRowInner({ list, onPress }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = t();

  return (
    <SortablePressable
      style={[styles.row, { backgroundColor: withAlpha(list.color, 13) }]}
      onPress={onPress}
      accessibilityLabel={`${list.name}, ${labels.home_progress(list.completed, list.total)}`}
    >
      <View style={[styles.badge, { backgroundColor: withAlpha(list.color, 18) }]}>
        <Ionicons name={list.icon as IconName} size={22} color={list.color} />
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

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: CARD_BORDER_RADIUS,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
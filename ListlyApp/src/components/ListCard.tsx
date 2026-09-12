import { memo } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { t } from '../i18n';
import { CARD_BORDER_RADIUS } from './componentStyles';
import { withAlpha } from '../utils/color';
import type { ListWithCounts } from '../database/types';
import type { IconName } from '../constants/types';

interface Props {
  list: ListWithCounts;
  onPress: () => void;
}

function ListCardInner({ list, onPress }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = t();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: withAlpha(list.color, 13) }]}
      onPress={onPress}
      accessibilityLabel={`${list.name}, ${labels.home_progress(list.completed, list.total)}`}
    >
      <Ionicons name={list.icon as IconName} size={28} color={list.color} />
      <Text style={[styles.name, { color: c.text, fontSize: fs(14) }]} numberOfLines={1}>
        {list.name}
      </Text>
      <Text style={[styles.progress, { color: c.textSecondary, fontSize: fs(12) }]}>
        {labels.home_progress(list.completed, list.total)}
      </Text>
    </TouchableOpacity>
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
  },
  name: {
    fontWeight: '600',
  },
  progress: {
    fontWeight: '500',
  },
});
import { memo } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useLabels } from '../hooks/useLabels';
import { CARD_BORDER_RADIUS, ALPHA_TINT } from './componentStyles';
import { withAlpha } from '../utils/color';
import SortablePressable from './SortablePressable';
import type { CollectionWithCounts } from '../database/types';
import type { IconName } from '../constants/types';

interface Props {
  collection: CollectionWithCounts;
  onPress: () => void;
}

function CollectionCardInner({ collection, onPress }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();

  return (
    <SortablePressable
      style={[
        styles.card,
        { backgroundColor: withAlpha(collection.color, ALPHA_TINT) },
      ]}
      onPress={onPress}
      accessibilityLabel={collection.name}
    >
      <Ionicons name={collection.icon as IconName} size={28} color={collection.color} />
      <Text style={[styles.name, { color: c.text, fontSize: fs(14) }]} numberOfLines={1}>
        {collection.name}
      </Text>
      <Text style={[styles.progress, { color: c.textSecondary, fontSize: fs(12) }]}>
        {labels.home_progress(collection.completed, collection.total)}
      </Text>
    </SortablePressable>
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
    borderColor: 'transparent',
  },
  name: {
    fontWeight: '600',
  },
  progress: {
    fontWeight: '500',
  },
});
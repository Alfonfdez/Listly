import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useLabels } from '../hooks/useLabels';
import type { CollectionWithCounts } from '../database/types';
import type { IconName } from '../constants/types';
import { withAlpha } from '../utils/color';
import { ALPHA_TINT, CARD_BORDER_RADIUS, PRESSED_OPACITY } from './componentStyles';
import ModalShell from './ModalShell';
import ModalFooter from './ModalFooter';

interface Props {
  visible: boolean;
  collections: CollectionWithCounts[];
  standaloneListCount?: number;
  onMove: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export default function CollectionDeleteModal({
  visible,
  collections,
  standaloneListCount = 0,
  onMove,
  onDelete,
  onCancel,
}: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();

  const options = useMemo(
    () => [
      {
        icon: 'move-outline' as IconName,
        label: labels.collection_delete_move,
        color: c.primary,
        action: onMove,
      },
      {
        icon: 'trash-outline' as IconName,
        label: labels.collection_delete_also,
        color: c.red,
        action: onDelete,
      },
    ],
    [labels.collection_delete_move, labels.collection_delete_also, c.primary, c.red, onMove, onDelete]
  );

  return (
    <ModalShell visible={visible} onClose={onCancel} padding={20}>
      <Text style={[styles.title, { color: c.text, fontSize: fs(17) }]}>
        {labels.collection_delete_many_title(collections.length)}
      </Text>
      <Text style={[styles.message, { color: c.textSecondary, fontSize: fs(14) }]}>
        {standaloneListCount > 0 ? labels.collection_delete_standalone_message : labels.collection_delete_message}
      </Text>
      {collections.length > 1 ? (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {collections.map(collection => (
            <View
              key={collection.id}
              style={[styles.row, { backgroundColor: withAlpha(collection.color, ALPHA_TINT) }]}
            >
              <Ionicons name={collection.icon as IconName} size={16} color={collection.color} />
              <Text style={[styles.rowName, { color: collection.color, fontSize: fs(14) }]} numberOfLines={1}>
                {collection.name}
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : null}
      <View style={styles.optionStack}>
        {options.map(option => (
          <Pressable
            key={option.label}
            onPress={option.action}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            style={({ pressed }) => [
              styles.option,
              { backgroundColor: c.background, borderColor: c.border },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name={option.icon} size={18} color={option.color} />
            <Text style={[styles.optionText, { color: c.text, fontSize: fs(15) }]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
      <ModalFooter confirmLabel={labels.common_cancel} onConfirm={onCancel} />
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: '700',
    marginBottom: 6,
  },
  message: {
    marginBottom: 16,
  },
  list: {
    maxHeight: 132,
    marginBottom: 12,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  rowName: {
    flex: 1,
    fontWeight: '600',
  },
  optionStack: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: CARD_BORDER_RADIUS,
    borderWidth: 1,
  },
  optionText: {
    fontWeight: '500',
  },
  pressed: {
    opacity: PRESSED_OPACITY,
  },
});
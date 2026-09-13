import { memo } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { t } from '../i18n';
import { BUTTON_BORDER_RADIUS } from './componentStyles';
import type { Item } from '../database/types';

interface Props {
  item: Item;
  onToggle: () => void;
  onEdit: () => void;
}

function ItemRowInner({ item, onToggle, onEdit }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = t();
  const isDone = item.checked === 1;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, { backgroundColor: c.surface }, pressed && styles.pressed]}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isDone }}
      accessibilityLabel={item.name}
    >
      <Ionicons
        name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
        size={24}
        color={isDone ? c.green : c.border}
        style={styles.checkbox}
      />
      <Text
        style={[
          styles.name,
          {
            color: isDone ? c.textSecondary : c.text,
            fontSize: fs(16),
            textDecorationLine: isDone ? 'line-through' : 'none',
          },
        ]}
        numberOfLines={1}
      >
        {item.name}
      </Text>
      {item.note ? (
        <Ionicons name="document-text-outline" size={16} color={c.textSecondary} style={styles.noteIcon} />
      ) : null}
      <Pressable
        style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={labels.item_edit_title}
        hitSlop={8}
      >
        <Ionicons name="pencil-outline" size={18} color={c.textSecondary} />
      </Pressable>
    </Pressable>
  );
}

export default memo(ItemRowInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: BUTTON_BORDER_RADIUS,
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.7,
  },
  checkbox: {
    marginRight: 2,
  },
  name: {
    flex: 1,
    fontWeight: '500',
  },
  noteIcon: {},
  editButton: {
    padding: 4,
  },
});
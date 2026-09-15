import { memo } from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { t } from '../i18n';
import { BUTTON_BORDER_RADIUS } from './componentStyles';
import type { Item } from '../database/types';

interface Props {
  item: Item;
  selectMode: boolean;
  selected: boolean;
  onToggle: () => void;
  onLongPress: () => void;
  onEdit: () => void;
}

function ItemRowInner({ item, selectMode, selected, onToggle, onLongPress, onEdit }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = t();
  const isDone = item.checked === 1;

  const checkbox = selectMode ? (
    <View style={[styles.check, selected ? { backgroundColor: c.primary } : { borderColor: c.border }]}>
      {selected ? <Ionicons name="checkmark" size={12} color={c.background} /> : null}
    </View>
  ) : (
    <Ionicons
      name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
      size={24}
      color={isDone ? c.green : c.border}
      style={styles.checkbox}
    />
  );

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: c.surface },
        selectMode && selected && { backgroundColor: c.primary + '15' },
        pressed && styles.pressed,
      ]}
      onPress={onToggle}
      onLongPress={onLongPress}
      accessibilityRole={selectMode ? 'checkbox' : 'checkbox'}
      accessibilityState={selectMode ? { checked: selected } : { checked: isDone }}
      accessibilityLabel={item.name}
    >
      {checkbox}
      <Text
        style={[
          styles.name,
          {
            color: isDone ? c.textSecondary : c.text,
            fontSize: fs(16),
            textDecorationLine: isDone && !selectMode ? 'line-through' : 'none',
          },
        ]}
        numberOfLines={1}
      >
        {item.name}
      </Text>
      {item.note ? (
        <Ionicons name="document-text-outline" size={16} color={c.textSecondary} style={styles.noteIcon} />
      ) : null}
      {!selectMode ? (
        <Pressable
          style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={labels.item_edit_title}
          hitSlop={8}
        >
          <Ionicons name="pencil-outline" size={18} color={c.textSecondary} />
        </Pressable>
      ) : null}
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
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
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
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRoute, type RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../constants/types';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH, type IconName } from '../constants/types';
import type { Item } from '../database/types';
import { itemRepository as itemRepo } from '../database';
import { useApp } from '../context/AppContext';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { t } from '../i18n';
import { validateItemName, uniqueNormalizedNames, type ItemNameError } from '../utils/validation';
import { withAlpha } from '../utils/color';
import { BUTTON_BORDER_RADIUS } from '../components/componentStyles';
import ScreenShell from '../components/ScreenShell';
import EmptyState from '../components/EmptyState';
import ItemRow from '../components/ItemRow';
import ItemFormModal from '../components/ItemFormModal';

export default function ListDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ListDetail'>>();
  const { listId } = route.params;

  const { lists, itemsByListId, refresh } = useApp();
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = t();

  const list = useMemo(() => lists.find(l => l.id === listId), [lists, listId]);
  const items = useMemo(() => itemsByListId.get(listId) ?? [], [itemsByListId, listId]);

  const [newName, setNewName] = useState('');
  const [newNote, setNewNote] = useState('');
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [addError, setAddError] = useState<ItemNameError | null>(null);
  const [editing, setEditing] = useState<Item | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const existingNames = useMemo(() => uniqueNormalizedNames(items.map(i => i.name)), [items]);
  const maxPosition = useMemo(() => items.reduce((max, i) => Math.max(max, i.position), -1) + 1, [items]);
  const editingExclusiveNames = useMemo(
    () => (editing ? uniqueNormalizedNames(items.filter(i => i.id !== editing.id).map(i => i.name)) : new Set<string>()),
    [items, editing]
  );

  const done = items.filter(i => i.checked === 1).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  if (!list) {
    return <ScreenShell style={styles.center}><EmptyState icon="help-circle-outline" message={labels.home_empty} /></ScreenShell>;
  }

  const toggle = async (item: Item) => {
    try {
      await itemRepo.toggle(item.id);
    } catch (error) {
      console.error('Failed to toggle item:', error);
    }
    void refresh();
  };

  const submitAdd = async () => {
    const err = validateItemName(newName, existingNames);
    if (err) {
      setAddError(err);
      return;
    }
    try {
      await itemRepo.create({
        list_id: listId,
        name: newName.trim(),
        note: newNote.trim() || null,
        checked: 0,
        position: maxPosition,
      });
      setNewName('');
      setNewNote('');
      setNoteExpanded(false);
      setAddError(null);
    } catch (error) {
      console.error('Failed to add item:', error);
    }
    void refresh();
  };

  const saveEdit = async (name: string, note: string | null) => {
    if (!editing) return;
    try {
      await itemRepo.update(editing.id, { name, note });
      setEditing(null);
    } catch (error) {
      console.error('Failed to update item:', error);
    }
    void refresh();
  };

  const deleteItem = async () => {
    if (!editing) return;
    try {
      await itemRepo.delete(editing.id);
      setEditing(null);
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
    void refresh();
  };

  const header = (
    <View style={styles.headerBlock}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: withAlpha(list.color, 13) }]}>
          <Ionicons name={list.icon as IconName} size={24} color={list.color} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.listName, { color: list.color, fontSize: fs(18) }]} numberOfLines={1}>
            {list.name}
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: fs(13) }}>{labels.home_progress(done, total)}</Text>
        </View>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: withAlpha(list.color, 20) }]}>
        <View style={[styles.progressFill, { backgroundColor: list.color, width: `${pct}%` }]} />
      </View>
    </View>
  );

  return (
    <ScreenShell>
      <FlatList
        data={items}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <ItemRow item={item} onToggle={() => void toggle(item)} onEdit={() => setEditing(item)} />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState icon="list-outline" message={labels.item_empty} hint={labels.item_empty_hint} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.addRow}>
        {addError ? (
          <Text style={[styles.errorText, { color: c.red, fontSize: fs(12) }]}>{labels[addError]}</Text>
        ) : null}
        <View style={styles.inputRow}>
          <TextInput
            value={newName}
            onChangeText={value => {
              setNewName(value);
              setAddError(null);
            }}
            maxLength={MAX_ITEM_NAME_LENGTH}
            placeholder={labels.item_add_placeholder}
            placeholderTextColor={c.textSecondary}
            returnKeyType="done"
            onSubmitEditing={() => void submitAdd()}
            style={[
              styles.input,
              { backgroundColor: c.surface, borderColor: c.border, color: c.text, fontSize: fs(15) },
            ]}
            accessibilityLabel={labels.item_add_placeholder}
          />
          <TouchableOpacity
            onPress={() => setNoteExpanded(prev => !prev)}
            style={[styles.noteToggle, { backgroundColor: c.surface, borderColor: c.border }]}
            accessibilityRole="button"
            accessibilityLabel={labels.item_add_note_toggle}
          >
            <Ionicons
              name="chevron-down"
              size={18}
              color={c.textSecondary}
              style={noteExpanded ? styles.chevronOpen : undefined}
            />
          </TouchableOpacity>
          <Pressable
            style={({ pressed }) => [styles.addButton, { backgroundColor: c.primary }, pressed && styles.pressed]}
            onPress={() => void submitAdd()}
            accessibilityRole="button"
            accessibilityLabel={labels.item_add}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={[styles.addButtonText, { fontSize: fs(15) }]}>{labels.item_add}</Text>
          </Pressable>
        </View>
        {noteExpanded ? (
          <TextInput
            value={newNote}
            onChangeText={setNewNote}
            maxLength={MAX_ITEM_NOTE_LENGTH}
            placeholder={labels.item_note_label}
            placeholderTextColor={c.textSecondary}
            multiline
            textAlignVertical="top"
            style={[
              styles.input,
              styles.noteInput,
              { backgroundColor: c.surface, borderColor: c.border, color: c.text, fontSize: fs(15) },
            ]}
            accessibilityLabel={labels.item_note_label}
          />
        ) : null}
      </View>

      <ItemFormModal
        visible={editing !== null}
        title={labels.item_edit_title}
        initialName={editing?.name ?? ''}
        initialNote={editing?.note ?? ''}
        existingNames={editingExclusiveNames}
        allowDelete
        onCancel={() => setEditing(null)}
        onSave={(name, note) => void saveEdit(name, note)}
        onDelete={() => void deleteItem()}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerBlock: {
    marginBottom: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    borderRadius: 22,
    padding: 10,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  listName: {
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  addRow: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noteToggle: {
    borderWidth: 1,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  noteInput: {
    minHeight: 64,
    paddingTop: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  errorText: {
    paddingHorizontal: 4,
  },
  pressed: {
    opacity: 0.7,
  },
});
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import {
  MAX_ITEM_NAME_LENGTH,
  MAX_ITEM_NOTE_LENGTH,
  type IconName,
  type RootStackParamList,
} from '../constants/types';
import type { Item } from '../database/types';
import { itemRepository as itemRepo } from '../database';
import { useApp } from '../context/AppContext';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useSelectMode } from '../hooks/useSelectMode';
import { t } from '../i18n';
import { validateItemName, uniqueNormalizedNames, type ItemNameError } from '../utils/validation';
import { filterItemsByQuery } from '../utils/search';
import { withAlpha } from '../utils/color';
import { BUTTON_BORDER_RADIUS } from '../components/componentStyles';
import ScreenShell from '../components/ScreenShell';
import EmptyState from '../components/EmptyState';
import SearchBar from '../components/SearchBar';
import ItemRow from '../components/ItemRow';
import ItemFormModal from '../components/ItemFormModal';
import SelectionActionBar from '../components/SelectionActionBar';
import ConfirmModal from '../components/ConfirmModal';
import SelectSearchHeader from '../components/SelectSearchHeader';

export default function ListDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ListDetail'>>();
  const navigation = useNavigation();
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
  const [searchActive, setSearchActive] = useState(false);
  const [query, setQuery] = useState('');

  const {
    selectMode,
    selectedIds,
    enterSelectMode,
    toggleItem,
    toggleSelectMode,
    exitSelectMode,
    deleteConfirmVisible,
    openDeleteConfirm,
    closeDeleteConfirm,
    confirmDelete,
  } = useSelectMode({
    deleteMany: (ids) => itemRepo.deleteMany(ids as number[]),
    afterDelete: refresh,
  });

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const toggleSearch = useCallback(() => {
    if (selectMode) return;
    setSearchActive(prev => !prev);
    if (searchActive) setQuery('');
  }, [searchActive, selectMode]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: items.length > 0
        ? () => (
          <SelectSearchHeader
            selectMode={selectMode}
            showSelect={items.length > 0}
            searchActive={searchActive}
            onToggleSelect={toggleSelectMode}
            onToggleSearch={toggleSearch}
          />
        )
        : undefined,
    });
  }, [navigation, selectMode, toggleSelectMode, searchActive, toggleSearch, items.length]);

  useEffect(() => {
    return () => {
      navigation.setOptions({ headerRight: undefined });
    };
  }, [navigation]);

  const existingNames = useMemo(() => uniqueNormalizedNames(items.map(i => i.name)), [items]);
  const maxPosition = useMemo(() => items.reduce((max, i) => Math.max(max, i.position), -1) + 1, [items]);
  const filteredItems = useMemo(() => filterItemsByQuery(items, query), [items, query]);
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

  const noResults = searchActive && items.length > 0 && filteredItems.length === 0;

  return (
    <ScreenShell>
      <FlatList
        data={filteredItems}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <ItemRow
            item={item}
            selectMode={selectMode}
            selected={selectedIds.has(item.id)}
            onToggle={() => selectMode ? toggleItem(item.id) : void toggle(item)}
            onLongPress={() => enterSelectMode(item.id)}
            onEdit={() => setEditing(item)}
          />
        )}
        ListHeaderComponent={
          <>
            {searchActive && !selectMode ? (
              <SearchBar
                placeholder={labels.item_search_placeholder}
                value={query}
                onChangeText={setQuery}
                onClose={() => { setQuery(''); setSearchActive(false); }}
                autoFocus
              />
            ) : null}
            {header}
          </>
        }
        ListEmptyComponent={
          noResults ? (
            <EmptyState icon="search-outline" message={labels.home_no_results} />
          ) : (
            <EmptyState icon="list-outline" message={labels.item_empty} hint={labels.item_empty_hint} />
          )
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {!selectMode ? (
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
      ) : (
        <SelectionActionBar
          selectedCount={selectedIds.size}
          countLabel={labels.select_selected(selectedIds.size)}
          deleteLabel={labels.select_delete}
          cancelLabel={labels.common_cancel}
          onDelete={openDeleteConfirm}
          onCancel={exitSelectMode}
          deleteAccessibilityLabel={labels.select_delete}
          cancelAccessibilityLabel={labels.select_exit_mode}
        />
      )}

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

      <ConfirmModal
        visible={deleteConfirmVisible}
        title={labels.select_delete_items_confirm(selectedIds.size)}
        message={labels.select_delete_items_message}
        cancelLabel={labels.common_cancel}
        confirmLabel={labels.select_delete}
        onCancel={closeDeleteConfirm}
        onConfirm={confirmDelete}
        destructive
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
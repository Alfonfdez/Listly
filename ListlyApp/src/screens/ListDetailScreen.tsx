import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sortable, { type SortableGridRenderItem } from 'react-native-sortables';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import {
  MAX_ITEM_NAME_LENGTH,
  MAX_ITEM_NOTE_LENGTH,
  type IconName,
  type NavigationProp,
  type RootStackParamList,
} from '../constants/types';
import type { Item } from '../database/types';
import { itemRepository as itemRepo } from '../database';
import { useApp } from '../context/AppContext';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useSelectMode } from '../hooks/useSelectMode';
import { useDragOrder } from '../hooks/useDragOrder';
import { useLabels } from '../hooks/useLabels';
import { validateItemName, uniqueNormalizedNames, type ItemNameError } from '../utils/validation';
import { filterItemsByQuery } from '../utils/search';
import { parseItemPhotos, serializeItemPhotos } from '../utils/itemPhotos';
import { withAlpha } from '../utils/color';
import { BUTTON_BORDER_RADIUS, ALPHA_TINT, ALPHA_TRACK, PRESSED_OPACITY } from '../components/componentStyles';
import ScreenShell from '../components/ScreenShell';
import EmptyState from '../components/EmptyState';
import SearchBar from '../components/SearchBar';
import ItemRow from '../components/ItemRow';
import ItemFormModal from '../components/ItemFormModal';
import PhotoSection from '../components/PhotoSection';
import CharCounter from '../components/CharCounter';
import SelectionActionBar from '../components/SelectionActionBar';
import ConfirmModal from '../components/ConfirmModal';
import SelectSearchHeader from '../components/SelectSearchHeader';
import { useItemPhotos } from '../hooks/useItemPhotos';

export default function ListDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ListDetail'>>();
  const navigation = useNavigation<NavigationProp<'ListDetail'>>();
  const { listId } = route.params;

  const { lists, itemsByListId, refresh } = useApp();
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();

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
    photos: newPhotos,
    setPhotos: setNewPhotos,
    handleTakePhoto,
    handlePickFromGallery,
    handleRemovePhoto,
  } = useItemPhotos();

  const {
    selectMode,
    selectedIds,
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

  const { display: displayItems, onDragEnd: handleDragEnd } = useDragOrder(
    filteredItems,
    useCallback((ids: number[]) => {
      void itemRepo.reorder(listId, ids);
      void refresh();
    }, [listId, refresh])
  );
  const editingExclusiveNames = useMemo(
    () => (editing ? uniqueNormalizedNames(items.filter(i => i.id !== editing.id).map(i => i.name)) : new Set<string>()),
    [items, editing]
  );

  const done = items.filter(i => i.checked === 1).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const toggle = useCallback(
    async (item: Item) => {
      try {
        await itemRepo.toggle(item.id);
      } catch (error) {
        console.error('Failed to toggle item:', error);
      }
      void refresh();
    },
    [refresh]
  );

  const renderItem = useCallback<SortableGridRenderItem<Item>>(
    ({ item }) => (
      <ItemRow
        item={item}
        selectMode={selectMode}
        selected={selectedIds.has(item.id)}
        onToggle={() => (selectMode ? toggleItem(item.id) : void toggle(item))}
        onEdit={() => setEditing(item)}
      />
    ),
    [selectMode, selectedIds, toggleItem, toggle]
  );

  if (!list) {
    return <ScreenShell style={styles.center}><EmptyState icon="help-circle-outline" message={labels.home_empty} /></ScreenShell>;
  }

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
        pictures: serializeItemPhotos(newPhotos),
        checked: 0,
        position: maxPosition,
      });
      setNewName('');
      setNewNote('');
      setNewPhotos([]);
      setNoteExpanded(false);
      setAddError(null);
    } catch (error) {
      console.error('Failed to add item:', error);
    }
    void refresh();
  };

  const saveEdit = async (name: string, note: string | null, photos: string[]) => {
    if (!editing) return;
    try {
      await itemRepo.update(editing.id, { name, note, pictures: serializeItemPhotos(photos) });
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
        <View style={[styles.iconBadge, { backgroundColor: withAlpha(list.color, ALPHA_TINT) }]}>
          <Ionicons name={list.icon as IconName} size={24} color={list.color} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.listName, { color: list.color, fontSize: fs(18) }]} numberOfLines={1}>
            {list.name}
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: fs(13) }}>{labels.home_progress(done, total)}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('EditList', { listId })}
          style={styles.editButton}
          accessibilityRole="button"
          accessibilityLabel={labels.list_edit_label}
          hitSlop={8}
        >
          <Ionicons name="create-outline" size={20} color={list.color} />
        </TouchableOpacity>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: withAlpha(list.color, ALPHA_TRACK) }]}>
        <View style={[styles.progressFill, { backgroundColor: list.color, width: `${pct}%` }]} />
      </View>
    </View>
  );

  const noResults = searchActive && items.length > 0 && filteredItems.length === 0;

  return (
    <ScreenShell>
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
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
        {displayItems.length === 0 ? (
          noResults ? (
            <EmptyState icon="search-outline" message={labels.home_no_results} />
          ) : (
            <EmptyState icon={list.icon as IconName} message={labels.item_empty} hint={labels.item_empty_hint} color={list.color} />
          )
        ) : (
          <Sortable.Grid
            data={displayItems}
            keyExtractor={item => String(item.id)}
            renderItem={renderItem}
            columns={1}
            sortEnabled={!selectMode && query === '' && items.length > 1}
            rowGap={8}
            onDragEnd={handleDragEnd}
          />
        )}
      </ScrollView>

      {!selectMode ? (
        <View style={styles.addRow}>
          {addError ? (
            <Text style={[styles.errorText, { color: c.red, fontSize: fs(12) }]}>{labels[addError]}</Text>
          ) : null}
          <View style={styles.inputRow}>
            <View style={styles.nameColumn}>
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
              <CharCounter current={newName.length} max={MAX_ITEM_NAME_LENGTH} />
            </View>
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
              <Ionicons name="add" size={20} color={c.background} />
              <Text style={[styles.addButtonText, { color: c.background, fontSize: fs(15) }]}>{labels.item_add}</Text>
            </Pressable>
          </View>
          {noteExpanded ? (
            <>
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
              <CharCounter current={newNote.length} max={MAX_ITEM_NOTE_LENGTH} />
            </>
          ) : null}
          {noteExpanded ? (
            <PhotoSection
              photos={newPhotos}
              onTakePhoto={() => void handleTakePhoto()}
              onPickFromGallery={() => void handlePickFromGallery()}
              onRemovePhoto={uri => void handleRemovePhoto(uri)}
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
        initialPhotos={parseItemPhotos(editing?.pictures ?? null)}
        existingNames={editingExclusiveNames}
        allowDelete
        onCancel={() => setEditing(null)}
        onSave={(name, note, photos) => void saveEdit(name, note, photos)}
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

const ADD_ROW_HEIGHT = 40;
const ICON_BADGE_SIZE = 44;
const PROGRESS_BAR_HEIGHT = 6;

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
    width: ICON_BADGE_SIZE,
    height: ICON_BADGE_SIZE,
    borderRadius: ICON_BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  editButton: {
    marginLeft: 'auto',
    padding: 6,
  },
  listName: {
    fontWeight: '700',
  },
  progressTrack: {
    height: PROGRESS_BAR_HEIGHT,
    borderRadius: PROGRESS_BAR_HEIGHT / 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: PROGRESS_BAR_HEIGHT,
    borderRadius: PROGRESS_BAR_HEIGHT / 2,
  },
  addRow: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  nameColumn: {
    flex: 1,
  },
  input: {
    height: ADD_ROW_HEIGHT,
    borderWidth: 1,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingHorizontal: 12,
    textAlignVertical: 'center',
  },
  noteToggle: {
    height: ADD_ROW_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingHorizontal: 10,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  noteInput: {
    minHeight: 64,
    paddingTop: 10,
  },
  addButton: {
    height: ADD_ROW_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingHorizontal: 14,
  },
  addButtonText: {
    fontWeight: '600',
  },
  errorText: {
    paddingHorizontal: 4,
  },
  pressed: {
    opacity: PRESSED_OPACITY,
  },
});
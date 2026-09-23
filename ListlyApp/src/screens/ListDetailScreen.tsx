import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Sortable, { type SortableGridRenderItem } from 'react-native-sortables';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import {
  COPY_FEEDBACK_MS,
  type IconName,
  type NavigationProp,
  type RootStackParamList,
} from '../constants/types';
import type { Item } from '../database/types';
import { itemRepository as itemRepo } from '../database';
import { logError, runSafely, ERROR_SCOPE } from '../utils/errors';
import { useApp } from '../context/AppContext';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useSelectMode } from '../hooks/useSelectMode';
import { useDragOrder } from '../hooks/useDragOrder';
import { useLabels } from '../hooks/useLabels';
import { uniqueNormalizedNames } from '../utils/validation';
import { filterItemsByQuery } from '../utils/search';
import { buildListCopyText } from '../utils/copyList';
import { parseItemPhotos, serializeItemPhotos } from '../utils/itemPhotos';
import { HIT_SLOP } from '../components/componentStyles';
import ScreenShell from '../components/ScreenShell';
import EmptyState from '../components/EmptyState';
import NotFoundScreen from '../components/NotFoundScreen';
import DetailHeader from '../components/DetailHeader';
import SearchBar from '../components/SearchBar';
import ItemRow from '../components/ItemRow';
import ItemFormModal from '../components/ItemFormModal';
import AddItemBar from '../components/AddItemBar';
import SelectionActionBar from '../components/SelectionActionBar';
import ConfirmModal from '../components/ConfirmModal';
import SelectSearchHeader from '../components/SelectSearchHeader';

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

  const [editing, setEditing] = useState<Item | null>(null);
  const [searchActive, setSearchActive] = useState(false);
  const [query, setQuery] = useState('');
  const [copiedAction, setCopiedAction] = useState<'all' | 'names' | null>(null);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
              showSearch={items.length > 0}
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

  useEffect(() => {
    return () => {
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
    };
  }, []);

  const existingNames = useMemo(() => uniqueNormalizedNames(items.map(i => i.name)), [items]);
  const maxPosition = useMemo(() => items.reduce((max, i) => Math.max(max, i.position), -1) + 1, [items]);
  const filteredItems = useMemo(() => filterItemsByQuery(items, query), [items, query]);

  const { display: displayItems, onDragEnd: handleDragEnd } = useDragOrder(
    filteredItems,
    useCallback((ids: number[]) => {
      runSafely(itemRepo.reorder(listId, ids), ERROR_SCOPE.reorderItems);
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
        logError(ERROR_SCOPE.toggleItem, error);
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

  const copyList = useCallback(
    (withNotes: boolean) => {
      if (!list) return;
      const text = buildListCopyText(list.name, items, withNotes);
      void Clipboard.setStringAsync(text);
      setCopiedAction(withNotes ? 'all' : 'names');
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
      copyTimeout.current = setTimeout(() => setCopiedAction(null), COPY_FEEDBACK_MS);
    },
    [list, items]
  );

  if (!list) {
    return <NotFoundScreen />;
  }

  const saveEdit = async (name: string, note: string | null, photos: string[]) => {
    if (!editing) return;
    try {
      await itemRepo.update(editing.id, { name, note, pictures: serializeItemPhotos(photos) });
      setEditing(null);
    } catch (error) {
      logError(ERROR_SCOPE.updateItem, error);
    }
    void refresh();
  };

  const deleteItem = async () => {
    if (!editing) return;
    try {
      await itemRepo.delete(editing.id);
      setEditing(null);
    } catch (error) {
      logError(ERROR_SCOPE.deleteItem, error);
    }
    void refresh();
  };

  const header = (
    <DetailHeader
      icon={list.icon as IconName}
      color={list.color}
      name={list.name}
      progressLabel={labels.home_progress(done, total)}
      onEdit={() => navigation.navigate('EditList', { listId })}
      editAccessibilityLabel={labels.list_edit_label}
      progressPercent={pct}
      trailing={
        items.length > 0 ? (
          <View style={styles.copyGroup}>
            <TouchableOpacity
              onPress={() => copyList(false)}
              style={styles.copyButton}
              accessibilityRole="button"
              accessibilityLabel={labels.list_copy_names}
              hitSlop={HIT_SLOP}
            >
              <Ionicons
                name={copiedAction === 'names' ? 'checkmark' : 'copy-outline'}
                size={20}
                color={copiedAction === 'names' ? c.green : list.color}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => copyList(true)}
              style={styles.copyButton}
              accessibilityRole="button"
              accessibilityLabel={labels.list_copy_all}
              hitSlop={HIT_SLOP}
            >
              <Ionicons
                name={copiedAction === 'all' ? 'checkmark' : 'reader-outline'}
                size={20}
                color={copiedAction === 'all' ? c.green : list.color}
              />
            </TouchableOpacity>
            {copiedAction ? (
              <Text style={[styles.copiedLabel, { color: c.green, fontSize: fs(12) }]}>
                {copiedAction === 'all' ? labels.list_copied_notes : labels.list_copied_names}
              </Text>
            ) : null}
          </View>
        ) : null
      }
    />
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
        <AddItemBar
          listId={listId}
          existingNames={existingNames}
          position={maxPosition}
          onAdded={refresh}
        />
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

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
  },
  copyGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyButton: {
    padding: 4,
  },
  copiedLabel: {
    fontWeight: '600',
  },
});
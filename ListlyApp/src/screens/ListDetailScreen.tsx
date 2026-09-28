import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Sortable, { type SortableGridRenderItem } from 'react-native-sortables';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import {
  COPY_FEEDBACK_MS,
  MERGE_NOTICE,
  type IconName,
  type NavigationProp,
  type RootStackParamList,
} from '../constants/types';
import type { Item, ListWithCounts } from '../database/types';
import { itemRepository as itemRepo } from '../database';
import { logError, runSafelyAsync, ERROR_SCOPE } from '../utils/errors';
import { useApp } from '../context/AppContext';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useSelectMode } from '../hooks/useSelectMode';
import { useDragOrder } from '../hooks/useDragOrder';
import { useLabels } from '../hooks/useLabels';
import { uniqueNormalizedNames } from '../utils/validation';
import { filterItemsByQuery } from '../utils/search';
import {
  DEFAULT_ITEM_SORT,
  itemSortValue,
  parseItemSortValue,
  sortItems,
  type ItemSort,
  type ItemSortValue,
  type SortDirection,
} from '../utils/itemSort';
import { buildListCopyText } from '../utils/copyList';
import { parseItemPhotos, serializeItemPhotos } from '../utils/itemPhotos';
import { isOn } from '../utils/flags';
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
import { useSelectSearchHeader } from '../hooks/useSelectSearchHeader';
import OptionPickerModal from '../components/settings/OptionPickerModal';
import ListPickerModal from '../components/ListPickerModal';
import type { Option } from '../components/settings/SelectorInline';

export default function ListDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ListDetail'>>();
  const navigation = useNavigation<NavigationProp<'ListDetail'>>();
  const { listId, notice } = route.params;

  const { lists, itemsByListId, refresh } = useApp();
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();

  const list = useMemo(() => lists.find(l => l.id === listId), [lists, listId]);
  const items = useMemo(() => itemsByListId.get(listId) ?? [], [itemsByListId, listId]);

  const [editing, setEditing] = useState<Item | null>(null);
  const [searchActive, setSearchActive] = useState(false);
  const [query, setQuery] = useState('');
  const [copiedAction, setCopiedAction] = useState<'all' | 'names' | 'to-list' | null>(null);
  const [copiedToName, setCopiedToName] = useState<string | null>(null);
  const [copyPickerVisible, setCopyPickerVisible] = useState(false);
  const [mergePickerVisible, setMergePickerVisible] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<ListWithCounts | null>(null);
  const [mergeBusy, setMergeBusy] = useState(false);
  const [mergeNoticeVisible, setMergeNoticeVisible] = useState(false);
  const [clearCompletedVisible, setClearCompletedVisible] = useState(false);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sort, setSort] = useState<ItemSort>(DEFAULT_ITEM_SORT);
  const [sortModalVisible, setSortModalVisible] = useState(false);

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

  useSelectSearchHeader({
    navigation,
    searchActive,
    onSearchClose: useCallback(() => { setQuery(''); setSearchActive(false); }, []),
    onSearchToggle: useCallback(() => setSearchActive(true), []),
    selectMode,
    visible: items.length > 0,
    showSelect: items.length > 0,
    showSearch: items.length > 0,
    onToggleSelect: toggleSelectMode,
  });

  useEffect(() => {
    if (notice !== MERGE_NOTICE) return;
    setMergeNoticeVisible(true);
    const timer = setTimeout(() => setMergeNoticeVisible(false), COPY_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    return () => {
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
    };
  }, []);

  const existingNames = useMemo(() => uniqueNormalizedNames(items.map(i => i.name)), [items]);
  const maxPosition = useMemo(() => items.reduce((max, i) => Math.max(max, i.position), -1) + 1, [items]);
  const filteredItems = useMemo(() => filterItemsByQuery(items, query), [items, query]);

  const { display: dragItems, onDragEnd: handleDragEnd } = useDragOrder(
    filteredItems,
    useCallback((ids: number[]) => {
      void (async () => {
        await runSafelyAsync(itemRepo.reorder(listId, ids), ERROR_SCOPE.reorderItems);
        await refresh();
      })();
    }, [listId, refresh])
  );
  const sortActive = sort.key !== 'manual';
  const displayItems = useMemo(
    () => (sortActive ? sortItems(filteredItems, sort) : dragItems),
    [sortActive, sort, filteredItems, dragItems]
  );
  const sortOptions = useMemo<Option<ItemSortValue>[]>(() => {
    const directionIcon = (direction: SortDirection) => (
      <Ionicons name={direction === 'asc' ? 'arrow-up' : 'arrow-down'} size={16} color={c.primary} />
    );
    const modeIcon = (name: IconName) => <Ionicons name={name} size={16} color={c.primary} />;
    return [
      { value: 'manual', label: labels.item_sort_manual, icon: modeIcon('swap-vertical') },
      { value: 'name-asc', label: `${labels.item_sort_name} ${labels.item_sort_asc}`, icon: directionIcon('asc') },
      { value: 'name-desc', label: `${labels.item_sort_name} ${labels.item_sort_desc}`, icon: directionIcon('desc') },
      { value: 'created-asc', label: `${labels.item_sort_created} ${labels.item_sort_asc}`, icon: directionIcon('asc') },
      { value: 'created-desc', label: `${labels.item_sort_created} ${labels.item_sort_desc}`, icon: directionIcon('desc') },
    ];
  }, [c, labels]);
  const sortModeLabel =
    sort.key === 'manual' ? labels.item_sort_manual : sort.key === 'name' ? labels.item_sort_name : labels.item_sort_created;
  const sortLabel = sortActive
    ? `${labels.item_sort}: ${sortModeLabel} ${sort.direction === 'asc' ? labels.item_sort_asc : labels.item_sort_desc}`
    : `${labels.item_sort}: ${labels.item_sort_manual}`;
  const editingExclusiveNames = useMemo(
    () => (editing ? uniqueNormalizedNames(items.filter(i => i.id !== editing.id).map(i => i.name)) : new Set<string>()),
    [items, editing]
  );

  const done = items.filter(i => isOn(i.checked)).length;
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
      void Clipboard.setStringAsync(text).catch(error => logError(ERROR_SCOPE.copyToClipboard, error));
      setCopiedAction(withNotes ? 'all' : 'names');
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
      copyTimeout.current = setTimeout(() => setCopiedAction(null), COPY_FEEDBACK_MS);
    },
    [list, items]
  );

  const copyToList = useCallback((target: ListWithCounts) => {
    if (!list) return;
    setCopiedAction('to-list');
    setCopiedToName(target.name);
    if (copyTimeout.current) clearTimeout(copyTimeout.current);
    copyTimeout.current = setTimeout(() => setCopiedAction(null), COPY_FEEDBACK_MS);
    void (async () => {
      await runSafelyAsync(itemRepo.duplicateItems(list.id, target.id), ERROR_SCOPE.copyItemsToList);
      await refresh();
    })();
  }, [list, refresh]);

  const doMerge = useCallback(async (target: ListWithCounts) => {
    if (!list) return;
    setMergeBusy(true);
    try {
      await itemRepo.mergeInto(list.id, target.id);
      await refresh();
      setMergeBusy(false);
      setMergeTarget(null);
      navigation.replace('ListDetail', { listId: target.id, notice: MERGE_NOTICE });
    } catch (error) {
      setMergeBusy(false);
      logError(ERROR_SCOPE.mergeLists, error);
    }
  }, [list, refresh, navigation]);

  const completeAll = useCallback(async () => {
    try {
      await itemRepo.setAllChecked(listId, true);
    } catch (error) {
      logError(ERROR_SCOPE.completeAllItems, error);
    }
    void refresh();
  }, [listId, refresh]);

  const uncompleteAll = useCallback(async () => {
    try {
      await itemRepo.setAllChecked(listId, false);
    } catch (error) {
      logError(ERROR_SCOPE.uncompleteAllItems, error);
    }
    void refresh();
  }, [listId, refresh]);

  const clearCompleted = useCallback(async () => {
    setClearCompletedVisible(false);
    try {
      await itemRepo.deleteCompleted(listId);
    } catch (error) {
      logError(ERROR_SCOPE.clearCompletedItems, error);
    }
    void refresh();
  }, [listId, refresh]);

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
            <TouchableOpacity
              onPress={() => setCopyPickerVisible(true)}
              style={styles.copyButton}
              accessibilityRole="button"
              accessibilityLabel={labels.list_copy_to}
              accessibilityHint={labels.list_picker_hint}
              hitSlop={HIT_SLOP}
            >
              <Ionicons
                name={copiedAction === 'to-list' ? 'checkmark' : 'duplicate-outline'}
                size={20}
                color={copiedAction === 'to-list' ? c.green : list.color}
              />
            </TouchableOpacity>
            {copiedAction ? (
              <Text style={[styles.copiedLabel, { color: c.green, fontSize: fs(12) }]}>
                {copiedAction === 'to-list' && copiedToName
                  ? labels.list_copied_to(copiedToName)
                  : copiedAction === 'all'
                    ? labels.list_copied_notes
                    : labels.list_copied_names}
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
        {mergeNoticeVisible && list ? (
          <Text
            style={[styles.mergeNotice, { color: c.green, fontSize: fs(12) }]}
            accessibilityLiveRegion="polite"
          >
            {labels.list_merged(list.name)}
          </Text>
        ) : null}
        {items.length > 0 && !selectMode && !searchActive ? (
          <>
            <View style={styles.batchRow}>
              <TouchableOpacity
                onPress={() => setSortModalVisible(true)}
                style={[styles.batchButton, { borderColor: sortActive ? c.primary : c.border }]}
                accessibilityRole="button"
                accessibilityLabel={sortLabel}
              >
                <Ionicons name="swap-vertical" size={16} color={sortActive ? c.primary : c.textSecondary} />
                <Text style={[styles.batchText, { color: sortActive ? c.primary : c.text, fontSize: fs(13) }]}>
                  {sortModeLabel}
                </Text>
                {sortActive ? (
                  <Ionicons
                    name={sort.direction === 'asc' ? 'arrow-up' : 'arrow-down'}
                    size={14}
                    color={c.primary}
                  />
                ) : null}
                <Ionicons name="chevron-down" size={14} color={c.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMergePickerVisible(true)}
                style={[styles.batchButton, { borderColor: c.warning }]}
                accessibilityRole="button"
                accessibilityLabel={labels.list_merge_into}
              >
                <Ionicons name="git-merge-outline" size={16} color={c.warning} />
                <Text style={[styles.batchText, { color: c.warning, fontSize: fs(13) }]}>
                  {labels.list_merge_into}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.batchRow}>
              <TouchableOpacity
                onPress={() => void completeAll()}
                disabled={done === total}
                style={[styles.batchButton, { borderColor: c.border }]}
                accessibilityRole="button"
                accessibilityLabel={labels.item_complete_all_a11y}
              >
                <Ionicons name="checkmark-done-outline" size={16} color={done === total ? c.textSecondary : c.primary} />
                <Text style={[styles.batchText, { color: done === total ? c.textSecondary : c.primary, fontSize: fs(13) }]}>
                  {labels.item_complete_all}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => void uncompleteAll()}
                disabled={done === 0}
                style={[styles.batchButton, { borderColor: c.border }]}
                accessibilityRole="button"
                accessibilityLabel={labels.item_uncomplete_all_a11y}
              >
                <Ionicons name="square-outline" size={16} color={done === 0 ? c.textSecondary : list.color} />
                <Text style={[styles.batchText, { color: done === 0 ? c.textSecondary : list.color, fontSize: fs(13) }]}>
                  {labels.item_uncomplete_all}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setClearCompletedVisible(true)}
                disabled={done === 0}
                style={[styles.batchButton, { borderColor: c.border }]}
                accessibilityRole="button"
                accessibilityLabel={labels.item_clear_completed_a11y}
              >
                <Ionicons name="close-circle-outline" size={16} color={done === 0 ? c.textSecondary : c.red} />
                <Text style={[styles.batchText, { color: done === 0 ? c.textSecondary : c.red, fontSize: fs(13) }]}>
                  {labels.item_clear_completed}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
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
            sortEnabled={!selectMode && query === '' && items.length > 1 && !sortActive}
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

      <ConfirmModal
        visible={clearCompletedVisible}
        title={labels.item_clear_completed_confirm(done)}
        message={labels.item_clear_completed_message}
        cancelLabel={labels.common_cancel}
        confirmLabel={labels.item_delete}
        onCancel={() => setClearCompletedVisible(false)}
        onConfirm={() => void clearCompleted()}
        destructive
      />

      <OptionPickerModal
        visible={sortModalVisible}
        title={labels.item_sort}
        options={sortOptions}
        selected={itemSortValue(sort)}
        cancelLabel={labels.common_cancel}
        confirmLabel={labels.common_select}
        onSelect={value => setSort(parseItemSortValue(value))}
        onClose={() => setSortModalVisible(false)}
      />

      <ListPickerModal
        visible={copyPickerVisible}
        title={labels.list_copy_to}
        subtitle={labels.list_copy_picker_subtitle}
        options={lists}
        excludeListId={listId}
        cancelLabel={labels.common_cancel}
        onSelect={copyToList}
        onClose={() => setCopyPickerVisible(false)}
      />

      <ListPickerModal
        visible={mergePickerVisible}
        title={labels.list_merge_into}
        options={lists}
        excludeListId={listId}
        cancelLabel={labels.common_cancel}
        emptyLabel={labels.list_merge_empty}
        onSelect={setMergeTarget}
        onClose={() => setMergePickerVisible(false)}
      />

      <ConfirmModal
        visible={mergeTarget !== null}
        title={labels.list_merge_confirm_title}
        message={
          mergeTarget
            ? labels.list_merge_confirm_message(items.length, mergeTarget.name, list?.name ?? '')
            : undefined
        }
        cancelLabel={labels.common_cancel}
        confirmLabel={labels.list_merge_confirm}
        onCancel={() => setMergeTarget(null)}
        onConfirm={() => {
          if (mergeTarget) void doMerge(mergeTarget);
        }}
        destructive
        confirmDisabled={mergeBusy}
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
  mergeNotice: {
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 4,
    marginBottom: 8,
  },
  batchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  batchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  batchText: {
    fontWeight: '600',
  },
});
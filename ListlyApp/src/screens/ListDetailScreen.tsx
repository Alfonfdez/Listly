import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sortable, { type SortableGridRenderItem } from 'react-native-sortables';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { type IconName, type NavigationProp, type RootStackParamList, COPY_FEEDBACK_MS } from '../constants/types';
import type { Item } from '../database/types';
import { vaultRepo } from '../database';
import { logError, ERROR_SCOPE } from '../utils/errors';
import { useApp } from '../context/AppContext';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useSelectMode } from '../hooks/useSelectMode';
import { useDragOrder } from '../hooks/useDragOrder';
import { useLabels } from '../hooks/useLabels';
import { uniqueNormalizedNames } from '../utils/validation';
import { filterItemsByQuery } from '../utils/search';
import { parseItemPhotos } from '../utils/itemPhotos';
import { isOn } from '../utils/flags';
import { sumTotals } from '../utils/numeric';
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
import { useItemSort } from '../hooks/useItemSort';
import { useClipboardCopy } from '../hooks/useClipboardCopy';
import { useMergeFlow } from '../hooks/useMergeFlow';
import { useItemEditing } from '../hooks/useItemEditing';
import { useBatchItemActions } from '../hooks/useBatchItemActions';
import OptionPickerModal from '../components/settings/OptionPickerModal';
import ListPickerModal from '../components/ListPickerModal';
import LockListModal from '../components/LockListModal';
import VaultUnlockView from '../components/VaultUnlockView';
import InfoModal from '../components/InfoModal';
import { useVaultSession } from '../hooks/useVaultSession';
import { useItemStore } from '../hooks/useItemStore';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';
import { isVaultAvailable, isWrongPassphrase } from '../utils/vaultCrypto';

export default function ListDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ListDetail'>>();
  const navigation = useNavigation<NavigationProp<'ListDetail'>>();
  const { listId, notice } = route.params;

  const { lists, itemsByListId, refresh, lockedListIds } = useApp();
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();
  const keyboardHeight = useKeyboardHeight();

  const list = useMemo(() => lists.find(l => l.id === listId), [lists, listId]);
  const locked = lockedListIds.has(listId);
  const vault = useVaultSession(listId);
  const [lockModalVisible, setLockModalVisible] = useState(false);
  const [passphraseChanged, setPassphraseChanged] = useState(false);
  const [vaultInfoVisible, setVaultInfoVisible] = useState(false);
  const vaultReady = useMemo(() => isVaultAvailable(), []);

  const repoItems = useMemo(() => itemsByListId.get(listId) ?? [], [itemsByListId, listId]);
  const store = useItemStore({ listId, repoItems, refresh, vault });
  const { reorder, toggle } = store;
  const items = store.items;
  const hasPhotos = useMemo(() => items.some(i => parseItemPhotos(i.pictures).length > 0), [items]);
  const hasOtherLists = useMemo(() => lists.some(l => l.id !== listId && !lockedListIds.has(l.id)), [lists, listId, lockedListIds]);

  const [searchActive, setSearchActive] = useState(false);
  const [query, setQuery] = useState('');

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
    deleteMany: store.removeMany,
    afterDelete: refresh,
  });

  const relock = vault.relock;
  useFocusEffect(
    useCallback(() => {
      void refresh();
      return () => {
        relock();
      };
    }, [refresh, relock])
  );

  useEffect(() => {
    if (!passphraseChanged) return;
    const timer = setTimeout(() => setPassphraseChanged(false), COPY_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [passphraseChanged]);

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

  const existingNames = useMemo(() => uniqueNormalizedNames(items.map(i => i.name)), [items]);
  const maxPosition = useMemo(() => items.reduce((max, i) => Math.max(max, i.position), -1) + 1, [items]);
  const filteredItems = useMemo(() => filterItemsByQuery(items, query), [items, query]);

  const { display: dragItems, onDragEnd: handleDragEnd } = useDragOrder(
    filteredItems,
    useCallback((ids: number[]) => {
      void reorder(ids);
    }, [reorder])
  );

  const {
    sortValue,
    sortDirection,
    selectSort,
    sortModalVisible,
    openSortModal,
    closeSortModal,
    sortActive,
    displayItems,
    sortOptions,
    sortModeLabel,
    sortLabel,
  } = useItemSort({ filteredItems, dragItems });

  const {
    copiedAction,
    copiedToName,
    copyPickerVisible,
    openCopyPicker,
    closeCopyPicker,
    copyList,
    copyToList,
  } = useClipboardCopy({ list, items, refresh });

  const {
    mergePickerVisible,
    openMergePicker,
    closeMergePicker,
    mergeTarget,
    setMergeTarget,
    mergeBusy,
    mergeNoticeVisible,
    doMerge,
  } = useMergeFlow({ list, notice, refresh, navigation });

  const { editing, setEditing, editingExclusiveNames, saveEdit, deleteItem } = useItemEditing({
    items,
    update: store.update,
    remove: store.remove,
  });

  const {
    clearCompletedVisible,
    openClearCompleted,
    closeClearCompleted,
    completeAll,
    uncompleteAll,
    clearCompleted,
  } = useBatchItemActions({
    setAllChecked: store.setAllChecked,
    deleteCompleted: store.deleteCompleted,
  });

  const done = items.filter(i => isOn(i.checked)).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const numeric = list?.kind === 'numeric';
  const totals = useMemo(
    () =>
      numeric
        ? { all: sumTotals(items, { onlyDone: false }), done: sumTotals(items, { onlyDone: true }) }
        : undefined,
    [numeric, items]
  );

  const renderItem = useCallback<SortableGridRenderItem<Item>>(
    ({ item }) => (
      <ItemRow
        item={item}
        selectMode={selectMode}
        selected={selectedIds.has(item.id)}
        numeric={numeric}
        onToggle={() => (selectMode ? toggleItem(item.id) : void toggle(item.id))}
        onEdit={() => setEditing(item)}
      />
    ),
    [selectMode, selectedIds, toggleItem, toggle, setEditing, numeric]
  );

  if (!list) {
    return <NotFoundScreen />;
  }

  if (locked && !vault.unlocked) {
    if (!vaultReady) {
      return (
        <ScreenShell>
          <EmptyState
            icon="lock-closed-outline"
            message={labels.vault_unsupported_title}
            hint={labels.vault_unsupported_message}
          />
        </ScreenShell>
      );
    }
    return (
      <ScreenShell>
        <VaultUnlockView
          wrongPassphrase={vault.wrongPassphrase}
          onUnlock={async (passphrase) => {
            try {
              await vault.unlock(passphrase);
            } catch (error) {
              logError(ERROR_SCOPE.unlockList, error);
              throw error;
            }
          }}
          onRemoveLock={async (passphrase) => {
            try {
              if (await vault.removeLock(passphrase)) {
                await refresh();
              }
            } catch (error) {
              logError(ERROR_SCOPE.removeLock, error);
              throw error;
            }
          }}
        />
      </ScreenShell>
    );
  }

  const header = (
    <DetailHeader
      icon={list.icon as IconName}
      color={list.color}
      name={list.name}
      progressLabel={labels.home_progress(done, total)}
      onEdit={() => navigation.navigate('EditList', { listId })}
      editAccessibilityLabel={labels.list_edit_label}
      progressPercent={pct}
      totals={totals}
      trailing={
        <View style={styles.copyGroup}>
          {!locked && items.length > 0 ? (
            <>
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
            {hasOtherLists && !locked ? (
              <TouchableOpacity
                onPress={openCopyPicker}
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
            ) : null}
              </>
            ) : null}
            <TouchableOpacity
              onPress={() => (vaultReady ? setLockModalVisible(true) : setVaultInfoVisible(true))}
              style={styles.copyButton}
              accessibilityRole="button"
              accessibilityLabel={locked ? labels.list_change_passphrase : labels.list_lock_action}
              hitSlop={HIT_SLOP}
            >
              <Ionicons name={locked ? 'key-outline' : 'lock-closed-outline'} size={20} color={list.color} />
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
      }
    />
  );

  const noResults = searchActive && items.length > 0 && filteredItems.length === 0;

  return (
    <ScreenShell>
      <View testID="list-body" style={[styles.body, keyboardHeight > 0 && { paddingBottom: keyboardHeight }]}>
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
          {passphraseChanged ? (
            <Text
              style={[styles.mergeNotice, { color: c.green, fontSize: fs(12) }]}
              accessibilityLiveRegion="polite"
            >
              {labels.vault_passphrase_changed}
            </Text>
          ) : null}
          {items.length > 0 && !selectMode && !searchActive ? (
            <>
              <View style={styles.batchRow}>
                <TouchableOpacity
                  onPress={openSortModal}
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
                      name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                      size={14}
                      color={c.primary}
                    />
                  ) : null}
                  <Ionicons name="chevron-down" size={14} color={c.textSecondary} />
                </TouchableOpacity>
                {hasOtherLists && !locked ? (
                  <TouchableOpacity
                    onPress={openMergePicker}
                    style={[styles.batchButton, { borderColor: c.warning }]}
                    accessibilityRole="button"
                    accessibilityLabel={labels.list_merge_into}
                  >
                    <Ionicons name="git-merge-outline" size={16} color={c.warning} />
                    <Text style={[styles.batchText, { color: c.warning, fontSize: fs(13) }]}>
                      {labels.list_merge_into}
                    </Text>
                  </TouchableOpacity>
                ) : null}
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
                  onPress={openClearCompleted}
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
            numeric={numeric}
            photosAllowed={!locked}
            onAdded={() => undefined}
            onSubmitOverride={store.add}
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
      </View>

      <ItemFormModal
        visible={editing !== null}
        title={labels.item_edit_title}
        initialName={editing?.name ?? ''}
        initialNote={editing?.note ?? ''}
        initialPhotos={parseItemPhotos(editing?.pictures ?? null)}
        existingNames={editingExclusiveNames}
        allowDelete
        numeric={numeric}
        photosAllowed={!locked}
        initialAmountMinor={editing?.amount_minor ?? null}
        initialQuantity={editing?.quantity ?? 0}
        onCancel={() => setEditing(null)}
        onSave={(name, note, photos, amountMinor, quantity) =>
          void saveEdit(name, note, photos, amountMinor, quantity)
        }
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
        onCancel={closeClearCompleted}
        onConfirm={() => void clearCompleted()}
        destructive
      />

      <OptionPickerModal
        visible={sortModalVisible}
        title={labels.item_sort}
        options={sortOptions}
        selected={sortValue}
        cancelLabel={labels.common_cancel}
        confirmLabel={labels.common_select}
        onSelect={selectSort}
        onClose={closeSortModal}
      />

      <ListPickerModal
        visible={copyPickerVisible}
        title={labels.list_copy_to}
        subtitle={labels.list_copy_picker_subtitle}
        options={lists}
        excludeListId={listId}
        cancelLabel={labels.common_cancel}
        onSelect={copyToList}
        onClose={closeCopyPicker}
      />

      <ListPickerModal
        visible={mergePickerVisible}
        title={labels.list_merge_into}
        options={lists}
        excludeListId={listId}
        cancelLabel={labels.common_cancel}
        emptyLabel={labels.list_merge_empty}
        onSelect={setMergeTarget}
        onClose={closeMergePicker}
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

      <LockListModal
        visible={lockModalVisible}
        hasPhotos={hasPhotos}
        mode={locked ? 'change' : 'lock'}
        onCancel={() => setLockModalVisible(false)}
        onConfirm={async (passphrase, currentPassphrase) => {
          try {
            if (locked) {
              await vault.changePassphrase(currentPassphrase, passphrase);
              setLockModalVisible(false);
              setPassphraseChanged(true);
              return;
            }
            await vaultRepo.lock(listId, passphrase, await vaultRepo.readPlainItems(listId));
            setLockModalVisible(false);
            await refresh();
          } catch (error) {
            if (!isWrongPassphrase(error)) {
              logError(locked ? ERROR_SCOPE.changePassphrase : ERROR_SCOPE.lockList, error);
            }
            throw error;
          }
        }}
      />

      <InfoModal
        visible={vaultInfoVisible}
        title={labels.vault_unsupported_title}
        message={labels.vault_unsupported_message}
        closeLabel={labels.common_close}
        onClose={() => setVaultInfoVisible(false)}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
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

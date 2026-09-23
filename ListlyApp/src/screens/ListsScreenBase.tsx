import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { collectionRepository as collectionRepo, listRepository as listRepo } from '../database';
import type { Config } from '../database/types';
import { useApp } from '../context/AppContext';
import { useConfig } from '../context/ConfigContext';
import { useSelectMode } from '../hooks/useSelectMode';
import { useLabels } from '../hooks/useLabels';
import ListsView, { type ListViewMode } from '../components/ListsView';
import SelectSearchHeader from '../components/SelectSearchHeader';
import CollectionDeleteModal from '../components/CollectionDeleteModal';
import ConfirmModal from '../components/ConfirmModal';

type LayoutKey = keyof Pick<
  Config,
  'homeCollectionsLayout' | 'homeListsLayout' | 'collectionsLayout' | 'listsLayout'
>;

export default function ListsScreenBase({
  listsLayoutKey,
  collectionsLayoutKey,
  mode = 'lists',
}: {
  listsLayoutKey: LayoutKey;
  collectionsLayoutKey?: LayoutKey;
  mode?: ListViewMode;
}) {
  const navigation = useNavigation();
  const { lists, collections, listsByCollectionId, refresh } = useApp();
  const { config } = useConfig();
  const labels = useLabels();
  const [searchActive, setSearchActive] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<ReadonlySet<number>>(new Set());
  const [collectionDeleteVisible, setCollectionDeleteVisible] = useState(false);
  const [combinedDeleteVisible, setCombinedDeleteVisible] = useState(false);

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
    deleteMany: (ids) => listRepo.deleteMany(ids as number[]),
    afterDelete: refresh,
  });

  const toggleSearch = useCallback(() => {
    if (selectMode) return;
    setSearchActive(prev => !prev);
    if (searchActive) setQuery('');
  }, [searchActive, selectMode]);

  const resetSelectionExtras = useCallback(() => {
    setSelectedCollectionIds(new Set());
    setCollectionDeleteVisible(false);
    setCombinedDeleteVisible(false);
  }, []);

  const handleToggleSelectMode = useCallback(() => {
    resetSelectionExtras();
    toggleSelectMode();
  }, [resetSelectionExtras, toggleSelectMode]);

  const handleExitSelectMode = useCallback(() => {
    resetSelectionExtras();
    exitSelectMode();
  }, [resetSelectionExtras, exitSelectMode]);

  const selectedCollections = useMemo(
    () => collections.filter(col => selectedCollectionIds.has(col.id)),
    [collections, selectedCollectionIds]
  );

  const selectedCollectionsHaveLists = useMemo(
    () => selectedCollections.some(col => (listsByCollectionId.get(col.id)?.length ?? 0) > 0),
    [selectedCollections, listsByCollectionId]
  );

  const handleDeletePress = useCallback(() => {
    if (selectedCollectionIds.size > 0) {
      if (selectedCollectionsHaveLists) {
        setCollectionDeleteVisible(true);
      } else {
        setCombinedDeleteVisible(true);
      }
    } else {
      openDeleteConfirm();
    }
  }, [selectedCollectionIds.size, selectedCollectionsHaveLists, openDeleteConfirm]);

  const toggleCollection = useCallback((id: number) => {
    setSelectedCollectionIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const runCollectionDelete = useCallback(
    async (deleteMode: 'move' | 'cascade', closeModal: () => void, errorLabel: string) => {
      const ids = [...selectedCollectionIds];
      const listIds = [...selectedIds];
      closeModal();
      try {
        await collectionRepo.deleteMany(ids, deleteMode);
        if (listIds.length > 0) {
          await listRepo.deleteMany(listIds);
        }
        setSelectedCollectionIds(new Set());
        await refresh();
        exitSelectMode();
      } catch (error) {
        console.error(errorLabel, error);
        setSelectedCollectionIds(new Set());
        exitSelectMode();
      }
    },
    [selectedCollectionIds, selectedIds, refresh, exitSelectMode]
  );

  const hasData =
    mode === 'collections'
      ? collections.length > 0
      : lists.length > 0 || (mode === 'home' && collections.length > 0);

  useEffect(() => {
    navigation.setOptions({
      headerRight: hasData
        ? () => (
            <SelectSearchHeader
              selectMode={selectMode}
              showSelect={hasData}
              searchActive={searchActive}
              onToggleSelect={handleToggleSelectMode}
              onToggleSearch={toggleSearch}
            />
          )
        : undefined,
    });
  }, [navigation, toggleSearch, handleToggleSelectMode, searchActive, selectMode, hasData]);

  useEffect(() => {
    return () => {
      navigation.setOptions({ headerRight: undefined });
    };
  }, [navigation]);

  const selectedCount = selectedIds.size + selectedCollectionIds.size;

  return (
    <>
      <ListsView
        mode={mode}
        variant={config[listsLayoutKey]}
        collectionsVariant={collectionsLayoutKey ? config[collectionsLayoutKey] : 'grid'}
        searchActive={searchActive && !selectMode}
        query={query}
        onQueryChange={setQuery}
        onSearchClose={() => { setQuery(''); setSearchActive(false); }}
        selectMode={selectMode}
        selectedIds={selectedIds}
        selectedCollectionIds={selectedCollectionIds}
        onToggleItem={toggleItem}
        onToggleCollection={toggleCollection}
        onOpenDeleteConfirm={handleDeletePress}
        onExitSelectMode={handleExitSelectMode}
        deleteConfirmVisible={deleteConfirmVisible}
        onCancelDeleteConfirm={closeDeleteConfirm}
        onConfirmDelete={confirmDelete}
        selectedCount={selectedCount}
      />

      <CollectionDeleteModal
        visible={collectionDeleteVisible}
        collections={selectedCollections}
        standaloneListCount={selectedIds.size}
        onMove={() => void runCollectionDelete('move', () => setCollectionDeleteVisible(false), 'Failed to delete selected collections:')}
        onDelete={() => void runCollectionDelete('cascade', () => setCollectionDeleteVisible(false), 'Failed to delete selected collections:')}
        onCancel={() => setCollectionDeleteVisible(false)}
      />

      <ConfirmModal
        visible={combinedDeleteVisible}
        title={labels.collection_delete_combined_title(selectedCollections.length, selectedIds.size)}
        message={selectedIds.size > 0 ? labels.collection_delete_combined_message : labels.collection_delete_empty_many_message}
        cancelLabel={labels.common_cancel}
        confirmLabel={labels.select_delete}
        onCancel={() => setCombinedDeleteVisible(false)}
        onConfirm={() => void runCollectionDelete('cascade', () => setCombinedDeleteVisible(false), 'Failed to delete selection:')}
        destructive
      />
    </>
  );
}
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { collectionRepository as collectionRepo, listRepository as listRepo } from '../database';
import type { Config } from '../database/types';
import { useApp } from '../context/AppContext';
import { useConfig } from '../context/ConfigContext';
import { useSelectMode } from '../hooks/useSelectMode';
import ListsView, { type ListViewMode } from '../components/ListsView';
import SelectSearchHeader from '../components/SelectSearchHeader';
import CollectionDeleteModal from '../components/CollectionDeleteModal';

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
  const { lists, collections, refresh } = useApp();
  const { config } = useConfig();
  const [searchActive, setSearchActive] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<ReadonlySet<number>>(new Set());
  const [collectionDeleteVisible, setCollectionDeleteVisible] = useState(false);

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

  const handleToggleSelectMode = useCallback(() => {
    setSelectedCollectionIds(new Set());
    setCollectionDeleteVisible(false);
    toggleSelectMode();
  }, [toggleSelectMode]);

  const handleExitSelectMode = useCallback(() => {
    setSelectedCollectionIds(new Set());
    setCollectionDeleteVisible(false);
    exitSelectMode();
  }, [exitSelectMode]);

  const handleDeletePress = useCallback(() => {
    if (selectedCollectionIds.size > 0) {
      setCollectionDeleteVisible(true);
    } else {
      openDeleteConfirm();
    }
  }, [selectedCollectionIds.size, openDeleteConfirm]);

  const toggleCollection = useCallback((id: number) => {
    setSelectedCollectionIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectedCollections = useMemo(
    () => collections.filter(col => selectedCollectionIds.has(col.id)),
    [collections, selectedCollectionIds]
  );

  const performCollectionDelete = useCallback(
    async (deleteMode: 'move' | 'cascade') => {
      const ids = [...selectedCollectionIds];
      setCollectionDeleteVisible(false);
      try {
        await collectionRepo.deleteMany(ids, deleteMode);
        setSelectedCollectionIds(new Set());
        await refresh();
        if (selectedIds.size > 0) {
          openDeleteConfirm();
        } else {
          exitSelectMode();
        }
      } catch (error) {
        console.error('Failed to delete selected collections:', error);
        setSelectedCollectionIds(new Set());
        exitSelectMode();
      }
    },
    [selectedCollectionIds, selectedIds.size, refresh, openDeleteConfirm, exitSelectMode]
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
        onMove={() => void performCollectionDelete('move')}
        onDelete={() => void performCollectionDelete('cascade')}
        onCancel={() => setCollectionDeleteVisible(false)}
      />
    </>
  );
}
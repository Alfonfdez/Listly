import { useEffect, useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { listRepository as listRepo } from '../database';
import { useApp } from '../context/AppContext';
import { useConfig } from '../context/ConfigContext';
import { useSelectMode } from '../hooks/useSelectMode';
import ListsView, { type ListViewMode } from '../components/ListsView';
import SelectSearchHeader from '../components/SelectSearchHeader';

export default function ListsScreenBase({
  layoutKey,
  mode = 'lists',
}: {
  layoutKey: 'homeLayout' | 'listsLayout';
  mode?: ListViewMode;
}) {
  const navigation = useNavigation();
  const { lists, collections, refresh } = useApp();
  const { config } = useConfig();
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
    deleteMany: (ids) => listRepo.deleteMany(ids as number[]),
    afterDelete: refresh,
  });

  const toggleSearch = useCallback(() => {
    if (selectMode) return;
    setSearchActive(prev => !prev);
    if (searchActive) setQuery('');
  }, [searchActive, selectMode]);

  const hasData = lists.length > 0 || (mode === 'home' && collections.length > 0);

  useEffect(() => {
    navigation.setOptions({
      headerRight: hasData
        ? () => (
            <SelectSearchHeader
              selectMode={selectMode}
              showSelect={hasData}
              searchActive={searchActive}
              onToggleSelect={toggleSelectMode}
              onToggleSearch={toggleSearch}
            />
          )
        : undefined,
    });
  }, [navigation, toggleSearch, toggleSelectMode, searchActive, selectMode, hasData]);

  useEffect(() => {
    return () => {
      navigation.setOptions({ headerRight: undefined });
    };
  }, [navigation]);

  return (
    <ListsView
      mode={mode}
      variant={config[layoutKey]}
      searchActive={searchActive && !selectMode}
      query={query}
      onQueryChange={setQuery}
      onSearchClose={() => { setQuery(''); setSearchActive(false); }}
      selectMode={selectMode}
      selectedIds={selectedIds}
      onToggleItem={toggleItem}
      onOpenDeleteConfirm={openDeleteConfirm}
      onExitSelectMode={exitSelectMode}
      deleteConfirmVisible={deleteConfirmVisible}
      onCancelDeleteConfirm={closeDeleteConfirm}
      onConfirmDelete={confirmDelete}
      selectedCount={selectedIds.size}
    />
  );
}

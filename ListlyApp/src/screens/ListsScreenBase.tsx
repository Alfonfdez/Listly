import { useEffect, useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { listRepository as listRepo } from '../database';
import { useApp } from '../context/AppContext';
import { useConfig } from '../context/ConfigContext';
import { useSelectMode } from '../hooks/useSelectMode';
import ListsView from '../components/ListsView';
import SelectSearchHeader from '../components/SelectSearchHeader';

export default function ListsScreenBase({ layoutKey }: { layoutKey: 'homeLayout' | 'listsLayout' }) {
  const navigation = useNavigation();
  const { lists, refresh } = useApp();
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

  useEffect(() => {
    navigation.setOptions({
      headerRight: lists.length > 0
        ? () => (
            <SelectSearchHeader
              selectMode={selectMode}
              showSelect={lists.length > 0}
              searchActive={searchActive}
              onToggleSelect={toggleSelectMode}
              onToggleSearch={toggleSearch}
            />
          )
        : undefined,
    });
  }, [navigation, toggleSearch, toggleSelectMode, searchActive, selectMode, lists.length]);

  useEffect(() => {
    return () => {
      navigation.setOptions({ headerRight: undefined });
    };
  }, [navigation]);

  return (
    <ListsView
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

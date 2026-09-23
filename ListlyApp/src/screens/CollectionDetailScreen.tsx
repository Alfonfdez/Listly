import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useConfig } from '../context/ConfigContext';
import { useLabels } from '../hooks/useLabels';
import { useSelectMode } from '../hooks/useSelectMode';
import { listRepository as listRepo } from '../database';
import type { IconName, NavigationProp, RootStackParamList } from '../constants/types';
import ScreenShell from '../components/ScreenShell';
import NotFoundScreen from '../components/NotFoundScreen';
import DetailHeader from '../components/DetailHeader';
import ListsView from '../components/ListsView';
import SelectSearchHeader from '../components/SelectSearchHeader';
import ConfirmModal from '../components/ConfirmModal';

export default function CollectionDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'CollectionDetail'>>();
  const navigation = useNavigation<NavigationProp<'CollectionDetail'>>();
  const { collectionId } = route.params;

  const { collections, listsByCollectionId, refresh } = useApp();
  const { config } = useConfig();
  const labels = useLabels();

  const collection = useMemo(() => collections.find(col => col.id === collectionId), [collections, collectionId]);
  const listsInCollection = useMemo(() => listsByCollectionId.get(collectionId) ?? [], [listsByCollectionId, collectionId]);

  const [searchActive, setSearchActive] = useState(false);
  const [query, setQuery] = useState('');

  const {
    selectMode,
    selectedIds,
    toggleItem,
    toggleSelectMode,
    exitSelectMode,
    deleteConfirmVisible: listDeleteVisible,
    openDeleteConfirm,
    closeDeleteConfirm,
    confirmDelete,
  } = useSelectMode({
    deleteMany: ids => listRepo.deleteMany(ids),
    afterDelete: refresh,
  });

  const toggleSearch = useCallback(() => {
    if (selectMode) return;
    setSearchActive(prev => !prev);
    if (searchActive) setQuery('');
  }, [searchActive, selectMode]);

  const hasLists = listsInCollection.length > 0;

  useEffect(() => {
    navigation.setOptions({
      headerRight: hasLists
        ? () => (
            <SelectSearchHeader
              selectMode={selectMode}
              showSelect={hasLists}
              showSearch={hasLists}
              searchActive={searchActive}
              onToggleSelect={toggleSelectMode}
              onToggleSearch={toggleSearch}
            />
          )
        : undefined,
    });
  }, [
    navigation, selectMode, toggleSelectMode, searchActive, toggleSearch, hasLists,
  ]);

  useEffect(() => {
    return () => {
      navigation.setOptions({ headerRight: undefined });
    };
  }, [navigation]);

  if (!collection) {
    return <NotFoundScreen />;
  }

  const done = listsInCollection.reduce((sum, list) => sum + list.completed, 0);
  const total = listsInCollection.reduce((sum, list) => sum + list.total, 0);

  const header = (
    <DetailHeader
      icon={collection.icon as IconName}
      color={collection.color}
      name={collection.name}
      progressLabel={labels.home_progress(done, total)}
      onEdit={() => navigation.navigate('EditCollection', { collectionId })}
      editAccessibilityLabel={labels.collection_edit_label}
    />
  );

  return (
    <ScreenShell>
      <ListsView
        mode="collection"
        variant={config.collectionDetailLayout}
        collectionsVariant="grid"
        collectionId={collectionId}
        header={header}
        searchActive={searchActive && !selectMode}
        query={query}
        onQueryChange={setQuery}
        onSearchClose={() => { setQuery(''); setSearchActive(false); }}
        selectMode={selectMode}
        selectedIds={selectedIds}
        selectedCollectionIds={new Set()}
        onToggleItem={toggleItem}
        onToggleCollection={() => {}}
        onOpenDeleteConfirm={openDeleteConfirm}
        onExitSelectMode={exitSelectMode}
        deleteConfirmVisible={listDeleteVisible}
        onCancelDeleteConfirm={closeDeleteConfirm}
        onConfirmDelete={confirmDelete}
        selectedCount={selectedIds.size}
      />

      <ConfirmModal
        visible={listDeleteVisible}
        title={labels.select_delete_lists_confirm(selectedIds.size)}
        message={labels.select_delete_lists_message}
        cancelLabel={labels.common_cancel}
        confirmLabel={labels.select_delete}
        onCancel={closeDeleteConfirm}
        onConfirm={confirmDelete}
        destructive
      />
    </ScreenShell>
  );
}

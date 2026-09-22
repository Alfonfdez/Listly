import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Sortable, { type SortableGridRenderItem } from 'react-native-sortables';
import { useApp } from '../context/AppContext';
import { useConfig } from '../context/ConfigContext';
import { collectionRepository as collectionRepo, listRepository as listRepo } from '../database';
import type { CollectionWithCounts, ListWithCounts } from '../database/types';
import { useLabels } from '../hooks/useLabels';
import { useFontSize } from '../hooks/useFontSize';
import { filterListsByQuery } from '../utils/search';
import type { NavigationProp } from '../constants/types';
import ScreenShell from './ScreenShell';
import SearchBar from './SearchBar';
import EmptyState from './EmptyState';
import ListCard from './ListCard';
import ListRow from './ListRow';
import CollectionCard from './CollectionCard';
import CollectionRow from './CollectionRow';
import Fab from './Fab';
import AddChooserModal from './AddChooserModal';
import SelectionActionBar from './SelectionActionBar';
import ConfirmModal from './ConfirmModal';
import { useDragOrder } from '../hooks/useDragOrder';
import { GRID_GAP, WIDE_BREAKPOINT, MEDIUM_BREAKPOINT } from './componentStyles';

export type ListViewMode = 'home' | 'lists' | 'collections' | 'collection';
export type ListsViewVariant = 'grid' | 'list';

function columnCount(width: number): number {
  if (width >= WIDE_BREAKPOINT) return 4;
  if (width >= MEDIUM_BREAKPOINT) return 3;
  return 2;
}

interface Props {
  mode: ListViewMode;
  variant: ListsViewVariant;
  collectionsVariant: ListsViewVariant;
  collectionId?: number;
  header?: ReactNode;
  searchActive: boolean;
  query: string;
  onQueryChange: (text: string) => void;
  onSearchClose: () => void;
  selectMode: boolean;
  selectedIds: ReadonlySet<number>;
  selectedCollectionIds: ReadonlySet<number>;
  onToggleItem: (id: number) => void;
  onToggleCollection: (id: number) => void;
  onOpenDeleteConfirm: () => void;
  onExitSelectMode: () => void;
  deleteConfirmVisible: boolean;
  onCancelDeleteConfirm: () => void;
  onConfirmDelete: () => void;
  selectedCount: number;
}

export default function ListsView({
  mode,
  variant,
  collectionsVariant,
  collectionId,
  header,
  searchActive,
  query,
  onQueryChange,
  onSearchClose,
  selectMode,
  selectedIds,
  selectedCollectionIds,
  onToggleItem,
  onToggleCollection,
  onOpenDeleteConfirm,
  onExitSelectMode,
  deleteConfirmVisible,
  onCancelDeleteConfirm,
  onConfirmDelete,
  selectedCount,
}: Props) {
  const navigation = useNavigation<NavigationProp<'Home'>>();
  const { lists, collections, listsByCollectionId, baseLists, itemsByListId, loading, refresh } = useApp();
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();
  const [chooserVisible, setChooserVisible] = useState(false);

  const { width } = useWindowDimensions();
  const isGrid = variant === 'grid';
  const isCollectionsGrid = collectionsVariant === 'grid';
  const columns = columnCount(width);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const scopeLists = useMemo(() => {
    if (mode === 'collection' && collectionId !== undefined) {
      return listsByCollectionId.get(collectionId) ?? [];
    }
    if (mode === 'home') return baseLists;
    if (mode === 'collections') return [];
    return lists;
  }, [mode, collectionId, listsByCollectionId, baseLists, lists]);

  const filteredLists = useMemo(
    () => filterListsByQuery(scopeLists, itemsByListId, query),
    [scopeLists, itemsByListId, query]
  );

  const filteredCollections = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return collections;
    return collections.filter(col => col.name.toLowerCase().includes(needle));
  }, [collections, query]);

  const { display: displayLists, onDragEnd: handleDragEnd } = useDragOrder(
    filteredLists,
    useCallback((ids: number[]) => {
      void listRepo.reorder(ids);
      void refresh();
    }, [refresh])
  );

  const { display: displayCollections, onDragEnd: handleCollectionsDragEnd } = useDragOrder(
    filteredCollections,
    useCallback((ids: number[]) => {
      void collectionRepo.reorder(ids);
      void refresh();
    }, [refresh])
  );

  const handleTilePress = useCallback(
    (item: ListWithCounts) => {
      if (selectMode) {
        onToggleItem(item.id);
      } else {
        navigation.navigate('ListDetail', { listId: item.id });
      }
    },
    [selectMode, onToggleItem, navigation]
  );

  const handleCollectionPress = useCallback(
    (collection: CollectionWithCounts) => {
      if (selectMode) {
        onToggleCollection(collection.id);
      } else {
        navigation.navigate('CollectionDetail', { collectionId: collection.id });
      }
    },
    [selectMode, onToggleCollection, navigation]
  );

  const renderItem = useCallback<SortableGridRenderItem<ListWithCounts>>(
    ({ item }) => (
      isGrid ? (
        <ListCard
          list={item}
          selectMode={selectMode}
          selected={selectedIds.has(item.id)}
          onPress={() => handleTilePress(item)}
        />
      ) : (
        <ListRow
          list={item}
          selectMode={selectMode}
          selected={selectedIds.has(item.id)}
          onPress={() => handleTilePress(item)}
        />
      )
    ),
    [isGrid, selectMode, selectedIds, handleTilePress]
  );

  const renderCollection = useCallback<SortableGridRenderItem<CollectionWithCounts>>(
    ({ item }) => (
      isCollectionsGrid ? (
        <CollectionCard
          collection={item}
          selectMode={selectMode}
          selected={selectedCollectionIds.has(item.id)}
          onPress={() => handleCollectionPress(item)}
        />
      ) : (
        <CollectionRow
          collection={item}
          selectMode={selectMode}
          selected={selectedCollectionIds.has(item.id)}
          onPress={() => handleCollectionPress(item)}
        />
      )
    ),
    [isCollectionsGrid, selectMode, selectedCollectionIds, handleCollectionPress]
  );

  if (loading) {
    return (
      <ScreenShell style={styles.center}>
        <ActivityIndicator size="large" color={c.primary} />
      </ScreenShell>
    );
  }

  const searching = searchActive && query.trim().length > 0;
  const inHome = mode === 'home';
  const inCollections = mode === 'collections';
  const showCollectionsSection = (inHome || inCollections) && displayCollections.length > 0;
  const showListsSection = mode !== 'collections' && displayLists.length > 0;
  const hasContent = showCollectionsSection || showListsSection;

  const renderEmpty = () => {
    if (searching) {
      return <EmptyState icon="search-outline" message={labels.home_no_results} />;
    }
    if (mode === 'collection') {
      return (
        <EmptyState
          icon="albums-outline"
          message={labels.collection_empty}
          hint={labels.collection_empty_hint}
        />
      );
    }
    if (mode === 'collections') {
      return (
        <EmptyState
          icon="albums-outline"
          message={labels.collections_empty}
          hint={labels.collections_empty_hint}
        />
      );
    }
    if (mode === 'home') {
      return (
        <EmptyState
          icon="home-outline"
          message={labels.home_empty_all}
          hint={labels.home_empty_all_hint}
        />
      );
    }
    return <EmptyState icon="list-outline" message={labels.home_empty} hint={labels.home_empty_hint} />;
  };

  const sortEnabled = !selectMode && !searching && displayLists.length > 1;

  return (
    <ScreenShell>
      <View style={styles.content}>
        {header}
        {searchActive ? (
          <SearchBar
            placeholder={labels.home_search_placeholder}
            value={query}
            onChangeText={onQueryChange}
            onClose={onSearchClose}
            autoFocus
          />
        ) : null}

        {hasContent ? (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {inHome && displayCollections.length > 0 && (
              <View style={styles.sectionTitleRow}>
                <Ionicons name="albums-outline" size={14} color={c.textSecondary} />
                <Text style={[styles.sectionTitle, { color: c.textSecondary, fontSize: fs(12) }]}>
                  {labels.collection_section_title}
                </Text>
              </View>
            )}
            {showCollectionsSection && (
              <Sortable.Grid
                key={isCollectionsGrid ? `collections-${columns}` : 'collections-list'}
                data={displayCollections}
                renderItem={renderCollection}
                keyExtractor={item => String(item.id)}
                columns={isCollectionsGrid ? columns : 1}
                sortEnabled={!selectMode && !searching && displayCollections.length > 1}
                columnGap={isCollectionsGrid ? GRID_GAP : 0}
                rowGap={isCollectionsGrid ? GRID_GAP : 10}
                onDragEnd={handleCollectionsDragEnd}
              />
            )}
            {inHome && displayLists.length > 0 && (
              <View style={styles.sectionTitleRow}>
                <Ionicons name="list-outline" size={14} color={c.textSecondary} />
                <Text style={[styles.sectionTitle, { color: c.textSecondary, fontSize: fs(12) }]}>
                  {labels.home_section_lists}
                </Text>
              </View>
            )}
            {showListsSection && (
              <Sortable.Grid
                key={isGrid ? `grid-${columns}` : 'list'}
                data={displayLists}
                renderItem={renderItem}
                keyExtractor={item => String(item.id)}
                columns={isGrid ? columns : 1}
                sortEnabled={sortEnabled}
                columnGap={isGrid ? GRID_GAP : 0}
                rowGap={isGrid ? GRID_GAP : 10}
                onDragEnd={handleDragEnd}
              />
            )}
          </ScrollView>
        ) : (
          renderEmpty()
        )}

        {!selectMode ? (
          <Fab
            onPress={() => {
              if (inHome) {
                setChooserVisible(true);
              } else if (mode === 'collection') {
                navigation.navigate('CreateList', { collectionId });
              } else if (mode === 'collections') {
                navigation.navigate('CreateCollection');
              } else {
                navigation.navigate('CreateList');
              }
            }}
            accessibilityLabel={inCollections ? labels.home_add_collection_fab : labels.home_add}
          />
        ) : (
          <SelectionActionBar
            selectedCount={selectedCount}
            countLabel={labels.select_selected(selectedCount)}
            deleteLabel={labels.select_delete}
            cancelLabel={labels.common_cancel}
            onDelete={onOpenDeleteConfirm}
            onCancel={onExitSelectMode}
            deleteAccessibilityLabel={labels.select_delete}
            cancelAccessibilityLabel={labels.select_exit_mode}
          />
        )}
      </View>

      <AddChooserModal
        visible={chooserVisible}
        onClose={() => setChooserVisible(false)}
        onAddList={() => {
          setChooserVisible(false);
          navigation.navigate('CreateList');
        }}
        onAddCollection={() => {
          setChooserVisible(false);
          navigation.navigate('CreateCollection');
        }}
      />

      <ConfirmModal
        visible={deleteConfirmVisible}
        title={labels.select_delete_lists_confirm(selectedCount)}
        message={labels.select_delete_lists_message}
        cancelLabel={labels.common_cancel}
        confirmLabel={labels.select_delete}
        onCancel={onCancelDeleteConfirm}
        onConfirm={onConfirmDelete}
        destructive
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 96,
    gap: 12,
  },
  sectionTitle: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
});
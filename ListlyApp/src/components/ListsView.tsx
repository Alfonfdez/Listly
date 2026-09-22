import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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
import Fab from './Fab';
import AddChooserModal from './AddChooserModal';
import SelectionActionBar from './SelectionActionBar';
import ConfirmModal from './ConfirmModal';
import { useDragOrder } from '../hooks/useDragOrder';
import { GRID_GAP, WIDE_BREAKPOINT, MEDIUM_BREAKPOINT } from './componentStyles';

export type ListViewMode = 'home' | 'lists' | 'collection';
export type ListsViewVariant = 'grid' | 'list';

function columnCount(width: number): number {
  if (width >= WIDE_BREAKPOINT) return 4;
  if (width >= MEDIUM_BREAKPOINT) return 3;
  return 2;
}

interface Props {
  mode: ListViewMode;
  variant: ListsViewVariant;
  collectionId?: number;
  header?: ReactNode;
  searchActive: boolean;
  query: string;
  onQueryChange: (text: string) => void;
  onSearchClose: () => void;
  selectMode: boolean;
  selectedIds: ReadonlySet<number>;
  onToggleItem: (id: number) => void;
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
  collectionId,
  header,
  searchActive,
  query,
  onQueryChange,
  onSearchClose,
  selectMode,
  selectedIds,
  onToggleItem,
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
      navigation.navigate('CollectionDetail', { collectionId: collection.id });
    },
    [navigation]
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
      <CollectionCard collection={item} onPress={() => handleCollectionPress(item)} />
    ),
    [handleCollectionPress]
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
  const hasContent = inHome
    ? filteredCollections.length > 0 || filteredLists.length > 0
    : filteredLists.length > 0;

  const renderEmpty = () => {
    if (searching) {
      return <EmptyState icon="search-outline" message={labels.home_no_results} />;
    }
    if (mode === 'collection') {
      return (
        <EmptyState
          icon="folder-open-outline"
          message={labels.collection_empty}
          hint={labels.collection_empty_hint}
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
              <Text style={[styles.sectionTitle, { color: c.textSecondary, fontSize: fs(12) }]}>
                {labels.collection_section_title}
              </Text>
            )}
            {inHome && displayCollections.length > 0 && (
              <Sortable.Grid
                key={`collections-${columns}`}
                data={displayCollections}
                renderItem={renderCollection}
                keyExtractor={item => String(item.id)}
                columns={columns}
                sortEnabled={!selectMode && !searching && displayCollections.length > 1}
                columnGap={GRID_GAP}
                rowGap={GRID_GAP}
                onDragEnd={handleCollectionsDragEnd}
              />
            )}
            {inHome && displayCollections.length > 0 && displayLists.length > 0 && (
              <Text style={[styles.sectionTitle, { color: c.textSecondary, fontSize: fs(12) }]}>
                {labels.home_section_lists}
              </Text>
            )}
            {displayLists.length > 0 && (
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
              } else {
                navigation.navigate('CreateList');
              }
            }}
            accessibilityLabel={labels.home_add}
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
    marginTop: 8,
  },
});
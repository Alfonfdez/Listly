import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Sortable, { type DragStartParams, type SortableGridRenderItem } from 'react-native-sortables';
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
import { withAlpha } from '../utils/color';
import { TRANSPARENT } from '../constants/themes';
import { ICONS } from '../constants/icons';
import {
  GRID_GAP,
  WIDE_BREAKPOINT,
  MEDIUM_BREAKPOINT,
  ALPHA_TINT,
  ALPHA_SUBTLE,
  FAB_SIZE,
  FAB_BOTTOM_OFFSET,
  ZONE_MIN_ACTIVATION_DISTANCE,
} from './componentStyles';

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
      setRemoveTargetActive(false);
      if (zoneDropHandledRef.current) {
        zoneDropHandledRef.current = false;
        if (pendingMoveRef.current === null) void refresh();
        return;
      }
      if (hoverCollectionIdRef.current !== null) {
        void refresh();
        return;
      }
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

  const [hoverCollectionId, setHoverCollectionId] = useState<number | null>(null);
  const [removeTargetActive, setRemoveTargetActive] = useState(false);
  const [removeHover, setRemoveHover] = useState(false);
  const hoverCollectionIdRef = useRef<number | null>(null);
  const draggingListRef = useRef<number | null>(null);
  const zoneDropHandledRef = useRef(false);
  const pendingMoveRef = useRef<Promise<void> | null>(null);

  const inCollectionDetail = mode === 'collection';

  const handleListsDragStart = useCallback(
    (params: DragStartParams) => {
      draggingListRef.current = Number(params.key);
      setHoverCollectionId(null);
      hoverCollectionIdRef.current = null;
      setRemoveHover(false);
      setRemoveTargetActive(inCollectionDetail);
    },
    [inCollectionDetail]
  );

  const handleCollectionsDragStart = useCallback(() => {
    draggingListRef.current = null;
    setHoverCollectionId(null);
    hoverCollectionIdRef.current = null;
    setRemoveHover(false);
    setRemoveTargetActive(false);
  }, []);

  const handleRemoveZoneEnter = useCallback(() => {
    if (draggingListRef.current === null) return;
    setRemoveHover(true);
  }, []);

  const handleRemoveZoneLeave = useCallback(() => {
    setRemoveHover(false);
  }, []);

  const handleRemoveZoneDrop = useCallback(() => {
    setRemoveHover(false);
    setRemoveTargetActive(false);
    const listId = draggingListRef.current;
    if (listId === null) return;
    draggingListRef.current = null;
    zoneDropHandledRef.current = true;
    const remove = listRepo.removeFromCollection(listId);
    pendingMoveRef.current = remove;
    void remove.then(() => {
      pendingMoveRef.current = null;
      void refresh();
    });
  }, [refresh]);

  const handleZoneEnter = useCallback(
    (collectionId: number) => {
      if (draggingListRef.current === null) return;
      setHoverCollectionId(collectionId);
      hoverCollectionIdRef.current = collectionId;
    },
    []
  );

  const handleZoneLeave = useCallback(() => {
    setHoverCollectionId(null);
    hoverCollectionIdRef.current = null;
  }, []);

  const handleZoneDrop = useCallback(
    (collectionId: number) => {
      setHoverCollectionId(null);
      hoverCollectionIdRef.current = null;
      const listId = draggingListRef.current;
      if (listId === null) return;
      draggingListRef.current = null;
      zoneDropHandledRef.current = true;
      const move = listRepo.moveToCollection(listId, collectionId);
      pendingMoveRef.current = move;
      void move.then(() => {
        pendingMoveRef.current = null;
        void refresh();
      });
    },
    [refresh]
  );

  const renderItem = useCallback<SortableGridRenderItem<ListWithCounts>>(
    ({ item }) => {
      const collection =
        mode === 'lists' && item.collection_id != null
          ? collections.find(col => col.id === item.collection_id)
          : undefined;
      return isGrid ? (
        <ListCard
          list={item}
          collection={collection}
          selectMode={selectMode}
          selected={selectedIds.has(item.id)}
          onPress={() => handleTilePress(item)}
        />
      ) : (
        <ListRow
          list={item}
          collection={collection}
          selectMode={selectMode}
          selected={selectedIds.has(item.id)}
          onPress={() => handleTilePress(item)}
        />
      );
    },
    [isGrid, selectMode, selectedIds, handleTilePress, mode, collections]
  );

  const renderCollection = useCallback<SortableGridRenderItem<CollectionWithCounts>>(
    ({ item }) => (
      <Sortable.BaseZone
        minActivationDistance={ZONE_MIN_ACTIVATION_DISTANCE}
        onItemEnter={() => handleZoneEnter(item.id)}
        onItemLeave={handleZoneLeave}
        onItemDrop={() => handleZoneDrop(item.id)}
      >
        {isCollectionsGrid ? (
          <CollectionCard
            collection={item}
            selectMode={selectMode}
            selected={selectedCollectionIds.has(item.id)}
            onPress={() => handleCollectionPress(item)}
            dropTarget={hoverCollectionId === item.id}
          />
        ) : (
          <CollectionRow
            collection={item}
            selectMode={selectMode}
            selected={selectedCollectionIds.has(item.id)}
            onPress={() => handleCollectionPress(item)}
            dropTarget={hoverCollectionId === item.id}
          />
        )}
      </Sortable.BaseZone>
    ),
    [
      isCollectionsGrid,
      selectMode,
      selectedCollectionIds,
      handleCollectionPress,
      handleZoneEnter,
      handleZoneLeave,
      handleZoneDrop,
      hoverCollectionId,
    ]
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
          icon={ICONS.collection}
          message={labels.collection_empty}
          hint={labels.collection_empty_hint}
        />
      );
    }
    if (mode === 'collections') {
      return (
        <EmptyState
          icon={ICONS.collection}
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
    return <EmptyState icon={ICONS.list} message={labels.home_empty} hint={labels.home_empty_hint} />;
  };

  const sortEnabled = !selectMode && !searching && displayLists.length > (inHome || inCollectionDetail ? 0 : 1);

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

        <Sortable.MultiZoneProvider>
          {hasContent ? (
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {inHome && displayCollections.length > 0 && (
                <View style={styles.sectionTitleRow}>
                  <Ionicons name={ICONS.collection} size={14} color={c.textSecondary} />
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
                  onDragStart={handleCollectionsDragStart}
                />
              )}
              {inHome && displayLists.length > 0 && (
                <View style={styles.sectionTitleRow}>
                  <Ionicons name={ICONS.list} size={14} color={c.textSecondary} />
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
                  onDragStart={handleListsDragStart}
                />
              )}
            </ScrollView>
          ) : (
            renderEmpty()
          )}

          {inCollectionDetail && (
            <Sortable.BaseZone
              onItemEnter={handleRemoveZoneEnter}
              onItemLeave={handleRemoveZoneLeave}
              onItemDrop={handleRemoveZoneDrop}
              style={[
                styles.removeTarget,
                {
                  opacity: removeTargetActive ? 1 : 0,
                  borderColor: removeHover ? c.primary : TRANSPARENT,
                  backgroundColor: removeHover
                    ? withAlpha(c.primary, ALPHA_TINT)
                    : withAlpha(c.textSecondary, ALPHA_SUBTLE),
                },
              ]}
              pointerEvents={removeTargetActive ? 'auto' : 'none'}
              accessibilityRole="button"
              accessibilityLabel={labels.collection_remove_label}
              accessibilityHint={removeTargetActive ? labels.collection_remove_hint : undefined}
            >
              <Ionicons name={ICONS.removeFromCollection} size={20} color={removeHover ? c.primary : c.textSecondary} />
              <Text style={[styles.removeTargetText, { color: removeHover ? c.primary : c.textSecondary, fontSize: fs(13) }]}>
                {labels.collection_remove_label}
              </Text>
            </Sortable.BaseZone>
          )}
        </Sortable.MultiZoneProvider>

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
  removeTarget: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: FAB_BOTTOM_OFFSET + FAB_SIZE + 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1,
  },
  removeTargetText: {
    fontWeight: '600',
  },
});
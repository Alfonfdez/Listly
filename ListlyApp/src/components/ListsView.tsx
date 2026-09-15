import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Sortable, { type SortableGridDragEndParams, type SortableGridRenderItem } from 'react-native-sortables';
import { useApp } from '../context/AppContext';
import { useConfig } from '../context/ConfigContext';
import { listRepository as listRepo } from '../database';
import type { ListWithCounts } from '../database/types';
import { t } from '../i18n';
import { filterListsByQuery } from '../utils/search';
import type { NavigationProp } from '../constants/types';
import ScreenShell from './ScreenShell';
import SearchBar from './SearchBar';
import EmptyState from './EmptyState';
import ListCard from './ListCard';
import ListRow from './ListRow';
import Fab from './Fab';
import SelectionActionBar from './SelectionActionBar';
import ConfirmModal from './ConfirmModal';

const GAP = 12;

export type ListsViewVariant = 'grid' | 'list';

function columnCount(width: number): number {
  if (width >= 900) return 4;
  if (width >= 600) return 3;
  return 2;
}

interface Props {
  variant: ListsViewVariant;
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
  variant,
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
  const { lists, itemsByListId, loading, refresh } = useApp();
  const { activeColors: c } = useConfig();
  const labels = t();

  const [dragOrder, setDragOrder] = useState<number[] | null>(null);

  const { width } = useWindowDimensions();
  const isGrid = variant === 'grid';
  const columns = columnCount(width);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const filteredLists = useMemo(
    () => filterListsByQuery(lists, itemsByListId, query),
    [lists, itemsByListId, query]
  );

  const displayLists = useMemo(() => {
    if (!dragOrder) return filteredLists;
    const byId = new Map(filteredLists.map(l => [l.id, l]));
    const next = dragOrder
      .map(id => byId.get(id))
      .filter((l): l is ListWithCounts => Boolean(l));
    return next.length === filteredLists.length ? next : filteredLists;
  }, [filteredLists, dragOrder]);

  const handleDragEnd = useCallback(
    ({ data }: SortableGridDragEndParams<ListWithCounts>) => {
      const ids = data.map(l => l.id);
      if (ids.length !== filteredLists.length || ids.every((id, i) => id === filteredLists[i].id)) {
        return;
      }
      setDragOrder(ids);
      void listRepo.reorder(ids);
      void refresh();
    },
    [filteredLists, refresh]
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

  if (loading) {
    return (
      <ScreenShell style={styles.center}>
        <ActivityIndicator size="large" color={c.primary} />
      </ScreenShell>
    );
  }

  const listEmpty = lists.length === 0;
  const noResults = !listEmpty && filteredLists.length === 0;

  return (
    <ScreenShell>
      <View style={styles.content}>
        {searchActive ? (
          <SearchBar
            placeholder={labels.home_search_placeholder}
            value={query}
            onChangeText={onQueryChange}
            onClose={onSearchClose}
            autoFocus
          />
        ) : null}

        {displayLists.length === 0 ? (
          noResults ? (
            <EmptyState icon="search-outline" message={labels.home_no_results} />
          ) : (
            <EmptyState icon="list-outline" message={labels.home_empty} hint={labels.home_empty_hint} />
          )
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Sortable.Grid
              key={isGrid ? `grid-${columns}` : 'list'}
              data={displayLists}
              renderItem={renderItem}
              keyExtractor={item => String(item.id)}
              columns={isGrid ? columns : 1}
              sortEnabled={!selectMode && query === ''}
              columnGap={isGrid ? GAP : 0}
              rowGap={isGrid ? GAP : 10}
              onDragEnd={handleDragEnd}
            />
          </ScrollView>
        )}

        {!selectMode ? (
          <Fab onPress={() => navigation.navigate('CreateList')} accessibilityLabel={labels.home_add} />
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
  },
});
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

const GAP = 12;

export type ListsViewVariant = 'grid' | 'list';

function columnCount(width: number): number {
  if (width >= 900) return 4;
  if (width >= 600) return 3;
  return 2;
}

interface Props {
  variant: ListsViewVariant;
}

export default function ListsView({ variant }: Props) {
  const navigation = useNavigation<NavigationProp<'Home'>>();
  const { lists, itemsByListId, loading, refresh } = useApp();
  const { activeColors: c } = useConfig();
  const labels = t();

  const [searchActive, setSearchActive] = useState(false);
  const [query, setQuery] = useState('');
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

  const renderItem = useCallback<SortableGridRenderItem<ListWithCounts>>(
    ({ item }) => {
      const onPress = () => navigation.navigate('ListDetail', { listId: item.id });
      return isGrid ? (
        <ListCard list={item} onPress={onPress} />
      ) : (
        <ListRow list={item} onPress={onPress} />
      );
    },
    [isGrid, navigation]
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
            onChangeText={setQuery}
            onClose={() => {
              setQuery('');
              setSearchActive(false);
            }}
            autoFocus
          />
        ) : (
          <View style={styles.searchRow}>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => setSearchActive(true)}
              accessibilityLabel={labels.home_search_toggle}
              accessibilityRole="button"
            >
              <Ionicons name="search-outline" size={22} color={c.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

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
              sortEnabled={query === ''}
              columnGap={isGrid ? GAP : 0}
              rowGap={isGrid ? GAP : 10}
              onDragEnd={handleDragEnd}
            />
          </ScrollView>
        )}

        <Fab onPress={() => navigation.navigate('CreateList')} accessibilityLabel={labels.home_add} />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  searchRow: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  searchButton: {
    padding: 6,
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
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useConfig } from '../context/ConfigContext';
import { t } from '../i18n';
import { filterListsByQuery } from '../utils/search';
import type { NavigationProp } from '../constants/types';
import ScreenShell from '../components/ScreenShell';
import SearchBar from '../components/SearchBar';
import EmptyState from '../components/EmptyState';
import ListCard from '../components/ListCard';
import Fab from '../components/Fab';

const GAP = 12;

function columnCount(width: number): number {
  if (width >= 900) return 4;
  if (width >= 600) return 3;
  return 2;
}

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<'Home'>>();
  const { lists, itemsByListId, loading, refresh } = useApp();
  const { activeColors: c } = useConfig();
  const labels = t();

  const [searchActive, setSearchActive] = useState(false);
  const [query, setQuery] = useState('');

  const { width } = useWindowDimensions();
  const columns = columnCount(width);
  const cardWidth = useMemo(() => (width - GAP * (columns + 1)) / columns, [width, columns]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const filteredLists = useMemo(
    () => filterListsByQuery(lists, itemsByListId, query),
    [lists, itemsByListId, query]
  );

  const listEmpty = lists.length === 0;
  const noResults = !listEmpty && filteredLists.length === 0;

  const renderItem = useCallback(
    ({ item }: { item: (typeof lists)[number] }) => (
      <View style={[styles.cardWrap, { width: cardWidth }]}>
        <ListCard list={item} onPress={() => navigation.navigate('ListDetail', { listId: item.id })} />
      </View>
    ),
    [cardWidth, navigation]
  );

  if (loading) {
    return (
      <ScreenShell style={styles.center}>
        <ActivityIndicator size="large" color={c.primary} />
      </ScreenShell>
    );
  }

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

        <FlatList
          data={filteredLists}
          key={columns}
          numColumns={columns}
          renderItem={renderItem}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            noResults ? (
              <EmptyState icon="search-outline" message={labels.home_no_results} />
            ) : (
              <EmptyState icon="list-outline" message={labels.home_empty} hint={labels.home_empty_hint} />
            )
          }
        />

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
  gridContent: {
    flexGrow: 1,
    paddingBottom: 96,
  },
  cardWrap: {
    paddingBottom: GAP,
  },
});
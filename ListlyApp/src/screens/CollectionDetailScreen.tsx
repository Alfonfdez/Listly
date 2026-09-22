import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useLabels } from '../hooks/useLabels';
import { useSelectMode } from '../hooks/useSelectMode';
import { listRepository as listRepo } from '../database';
import type { IconName, NavigationProp, RootStackParamList } from '../constants/types';
import { withAlpha } from '../utils/color';
import { ALPHA_TINT, PRESSED_OPACITY } from '../components/componentStyles';
import ScreenShell from '../components/ScreenShell';
import EmptyState from '../components/EmptyState';
import ListsView from '../components/ListsView';
import SelectSearchHeader from '../components/SelectSearchHeader';
import ConfirmModal from '../components/ConfirmModal';

export default function CollectionDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'CollectionDetail'>>();
  const navigation = useNavigation<NavigationProp<'CollectionDetail'>>();
  const { collectionId } = route.params;

  const { collections, listsByCollectionId, refresh } = useApp();
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
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
    return <ScreenShell style={styles.center}><EmptyState icon="help-circle-outline" message={labels.home_empty} /></ScreenShell>;
  }

  const done = listsInCollection.reduce((sum, list) => sum + list.completed, 0);
  const total = listsInCollection.reduce((sum, list) => sum + list.total, 0);

  const header = (
    <View style={styles.headerBlock}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: withAlpha(collection.color, ALPHA_TINT) }]}>
          <Ionicons name={collection.icon as IconName} size={24} color={collection.color} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.collectionName, { color: collection.color, fontSize: fs(18) }]} numberOfLines={1}>
            {collection.name}
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: fs(13) }}>{labels.home_progress(done, total)}</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('EditCollection', { collectionId })}
          style={styles.editButton}
          accessibilityRole="button"
          accessibilityLabel={labels.collection_edit_label}
          hitSlop={8}
        >
          <Ionicons name="create-outline" size={20} color={collection.color} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <ScreenShell>
      <ListsView
        mode="collection"
        variant="grid"
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

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBlock: {
    marginBottom: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  collectionName: {
    fontWeight: '700',
  },
  editButton: {
    marginLeft: 'auto',
    padding: 6,
  },
  pressed: {
    opacity: PRESSED_OPACITY,
  },
});
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useLabels } from '../hooks/useLabels';
import type { IconName, NavigationProp, RootStackParamList } from '../constants/types';
import { collectionRepository as collectionRepo } from '../database';
import ScreenShell from '../components/ScreenShell';
import EmptyState from '../components/EmptyState';
import CollectionForm from '../components/CollectionForm';
import CollectionDeleteModal from '../components/CollectionDeleteModal';
import ConfirmModal from '../components/ConfirmModal';

export default function EditCollectionScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'EditCollection'>>();
  const navigation = useNavigation<NavigationProp<'EditCollection'>>();
  const { collectionId } = route.params;
  const { collections, listsByCollectionId, refresh } = useApp();
  const labels = useLabels();
  const [collectionDeleteVisible, setCollectionDeleteVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const collection = collections.find(col => col.id === collectionId);
  const hasLists = useMemo(
    () => (listsByCollectionId.get(collectionId)?.length ?? 0) > 0,
    [listsByCollectionId, collectionId]
  );

  const update = useCallback(
    async ({ name, icon, color }: { name: string; icon: IconName; color: string }) => {
      await collectionRepo.update(collectionId, { name, icon, color });
      await refresh();
      navigation.goBack();
    },
    [collectionId, refresh, navigation]
  );

  const performDelete = useCallback(
    async (mode: 'move' | 'cascade') => {
      try {
        await collectionRepo.delete(collectionId, mode);
        await refresh();
        navigation.popToTop();
      } catch (error) {
        console.error('Failed to delete collection:', error);
      } finally {
        setCollectionDeleteVisible(false);
        setDeleteConfirmVisible(false);
      }
    },
    [collectionId, refresh, navigation]
  );

  if (!collection) {
    return <ScreenShell style={styles.center}><EmptyState icon="help-circle-outline" message={labels.home_empty} /></ScreenShell>;
  }

  return (
    <ScreenShell>
      <CollectionForm
        initialName={collection.name}
        initialIcon={collection.icon as IconName}
        initialColor={collection.color}
        submitLabel={labels.collection_save}
        excludeId={collection.id}
        deleteLabel={labels.collection_delete_label}
        onDelete={() => (hasLists ? setCollectionDeleteVisible(true) : setDeleteConfirmVisible(true))}
        onSubmit={update}
      />

      <CollectionDeleteModal
        visible={collectionDeleteVisible}
        collections={[collection]}
        onMove={() => void performDelete('move')}
        onDelete={() => void performDelete('cascade')}
        onCancel={() => setCollectionDeleteVisible(false)}
      />

      <ConfirmModal
        visible={deleteConfirmVisible}
        title={labels.collection_delete_empty_title}
        message={labels.collection_delete_empty_message}
        cancelLabel={labels.common_cancel}
        confirmLabel={labels.collection_delete_label}
        onCancel={() => setDeleteConfirmVisible(false)}
        onConfirm={() => void performDelete('cascade')}
        destructive
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
  },
});

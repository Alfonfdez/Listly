import { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useLabels } from '../hooks/useLabels';
import type { IconName, NavigationProp, RootStackParamList } from '../constants/types';
import { collectionRepository as collectionRepo } from '../database';
import ScreenShell from '../components/ScreenShell';
import EmptyState from '../components/EmptyState';
import CollectionForm from '../components/CollectionForm';

export default function EditCollectionScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'EditCollection'>>();
  const navigation = useNavigation<NavigationProp<'EditCollection'>>();
  const { collectionId } = route.params;
  const { collections, refresh } = useApp();
  const labels = useLabels();

  const collection = collections.find(col => col.id === collectionId);

  const update = useCallback(
    async ({ name, icon, color }: { name: string; icon: IconName; color: string }) => {
      await collectionRepo.update(collectionId, { name, icon, color });
      await refresh();
      navigation.goBack();
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
        onSubmit={update}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
  },
});
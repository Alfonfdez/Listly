import { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useLabels } from '../hooks/useLabels';
import type { IconName, NavigationProp, RootStackParamList } from '../constants/types';
import { listRepository as listRepo } from '../database';
import ScreenShell from '../components/ScreenShell';
import EmptyState from '../components/EmptyState';
import ListForm from '../components/ListForm';

export default function EditListScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'EditList'>>();
  const navigation = useNavigation<NavigationProp<'EditList'>>();
  const { listId } = route.params;
  const { lists, refresh } = useApp();
  const labels = useLabels();

  const list = lists.find(l => l.id === listId);

  const update = useCallback(
    async ({ name, icon, color }: { name: string; icon: IconName; color: string }) => {
      await listRepo.update(listId, { name, icon, color });
      await refresh();
      navigation.goBack();
    },
    [listId, refresh, navigation]
  );

  if (!list) {
    return <ScreenShell style={styles.center}><EmptyState icon="help-circle-outline" message={labels.home_empty} /></ScreenShell>;
  }

  return (
    <ScreenShell>
      <ListForm
        initialName={list.name}
        initialIcon={list.icon as IconName}
        initialColor={list.color}
        heading={labels.edit_list_title}
        submitLabel={labels.list_save}
        excludeId={list.id}
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
import { useCallback, useState } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useLabels } from '../hooks/useLabels';
import type { IconName, NavigationProp, RootStackParamList } from '../constants/types';
import { listRepository as listRepo } from '../database';
import ScreenShell from '../components/ScreenShell';
import NotFoundScreen from '../components/NotFoundScreen';
import ListForm from '../components/ListForm';
import ConfirmModal from '../components/ConfirmModal';

export default function EditListScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'EditList'>>();
  const navigation = useNavigation<NavigationProp<'EditList'>>();
  const { listId } = route.params;
  const { lists, refresh } = useApp();
  const labels = useLabels();
  const [deleteVisible, setDeleteVisible] = useState(false);

  const list = lists.find(l => l.id === listId);

  const update = useCallback(
    async ({ name, icon, color }: { name: string; icon: IconName; color: string }) => {
      await listRepo.update(listId, { name, icon, color });
      await refresh();
      navigation.goBack();
    },
    [listId, refresh, navigation]
  );

  const remove = useCallback(async () => {
    try {
      await listRepo.delete(listId);
      await refresh();
      navigation.popToTop();
    } catch (error) {
      console.error('Failed to delete list:', error);
      setDeleteVisible(false);
    }
  }, [listId, refresh, navigation]);

  if (!list) {
    return <NotFoundScreen />;
  }

  return (
    <ScreenShell>
      <ListForm
        initialName={list.name}
        initialIcon={list.icon as IconName}
        initialColor={list.color}
        submitLabel={labels.list_save}
        excludeId={list.id}
        deleteLabel={labels.list_delete_label}
        onDelete={() => setDeleteVisible(true)}
        onSubmit={update}
      />

      <ConfirmModal
        visible={deleteVisible}
        title={labels.list_delete_confirm}
        message={labels.list_delete_message}
        cancelLabel={labels.common_cancel}
        confirmLabel={labels.list_delete_label}
        onCancel={() => setDeleteVisible(false)}
        onConfirm={() => void remove()}
        destructive
      />
    </ScreenShell>
  );
}

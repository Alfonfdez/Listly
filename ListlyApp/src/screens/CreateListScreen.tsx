import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useLabels } from '../hooks/useLabels';
import { LIST_ICONS } from '../constants/listIcons';
import { QUICK_COLORS } from '../constants/listColors';
import type { IconName, NavigationProp, RootStackParamList } from '../constants/types';
import { listRepository as listRepo } from '../database';
import { makeListCopyName } from '../utils/copyList';
import { logError, ERROR_SCOPE } from '../utils/errors';
import ScreenShell from '../components/ScreenShell';
import ListForm from '../components/ListForm';

export default function CreateListScreen() {
  const navigation = useNavigation<NavigationProp<'CreateList'>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CreateList'>>();
  const { lists, refresh } = useApp();
  const labels = useLabels();

  const collectionId = route.params?.collectionId;
  const duplicateFromListId = route.params?.duplicateFromListId;
  const sourceList = duplicateFromListId !== undefined ? lists.find(l => l.id === duplicateFromListId) : undefined;

  const create = async ({
    name,
    icon,
    color,
    collectionId: collectionIdToUse,
  }: {
    name: string;
    icon: IconName;
    color: string;
    collectionId?: number | null;
  }) => {
    if (duplicateFromListId !== undefined) {
      try {
        const created = await listRepo.duplicate(duplicateFromListId, {
          name,
          icon,
          color,
          collection_id: collectionIdToUse ?? collectionId ?? null,
        });
        await refresh();
        navigation.replace('ListDetail', { listId: created.id });
        return;
      } catch (error) {
        logError(ERROR_SCOPE.duplicateList, error);
        await refresh();
        return;
      }
    }
    await listRepo.create({ name, icon, color, collection_id: collectionIdToUse ?? collectionId });
    await refresh();
    navigation.goBack();
  };

  return (
    <ScreenShell>
      <ListForm
        initialName={sourceList ? makeListCopyName(sourceList.name) : ''}
        initialIcon={(sourceList?.icon as IconName) ?? LIST_ICONS[0]}
        initialColor={sourceList?.color ?? QUICK_COLORS[0]}
        submitLabel={labels.list_create}
        initialCollectionId={sourceList ? sourceList.collection_id : collectionId}
        onSubmit={create}
      />
    </ScreenShell>
  );
}
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLabels } from '../hooks/useLabels';
import { LIST_ICONS } from '../constants/listIcons';
import { QUICK_COLORS } from '../constants/listColors';
import { LIST_KINDS, type IconName, type ListKind, type NavigationProp, type RootStackParamList } from '../constants/types';
import { listRepo } from '../database';
import { makeListCopyName } from '../utils/copyList';
import { logError, ERROR_SCOPE } from '../utils/errors';
import ScreenShell from '../components/ScreenShell';
import ListForm from '../components/ListForm';
import KindSelectRow from '../components/KindSelectRow';

export default function CreateListScreen() {
  const navigation = useNavigation<NavigationProp<'CreateList'>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CreateList'>>();
  const { lists, refresh } = useApp();
  const labels = useLabels();

  const collectionId = route.params?.collectionId;
  const duplicateFromListId = route.params?.duplicateFromListId;
  const sourceList = duplicateFromListId !== undefined ? lists.find(l => l.id === duplicateFromListId) : undefined;
  const isDuplicate = duplicateFromListId !== undefined;
  const [kind, setKind] = useState<ListKind>(LIST_KINDS.standard);

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
    await listRepo.create({ name, icon, color, collection_id: collectionIdToUse ?? collectionId, kind });
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
        kindSlot={isDuplicate ? undefined : <KindSelectRow kind={kind} onChange={setKind} />}
        onSubmit={create}
      />
    </ScreenShell>
  );
}
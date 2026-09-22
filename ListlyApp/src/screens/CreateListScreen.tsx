import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useLabels } from '../hooks/useLabels';
import { LIST_ICONS } from '../constants/listIcons';
import { QUICK_COLORS } from '../constants/listColors';
import type { IconName, NavigationProp, RootStackParamList } from '../constants/types';
import { listRepository as listRepo } from '../database';
import ScreenShell from '../components/ScreenShell';
import ListForm from '../components/ListForm';

export default function CreateListScreen() {
  const navigation = useNavigation<NavigationProp<'CreateList'>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CreateList'>>();
  const { refresh } = useApp();
  const labels = useLabels();

  const collectionId = route.params?.collectionId;

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
    await listRepo.create({ name, icon, color, collection_id: collectionIdToUse ?? collectionId });
    await refresh();
    navigation.goBack();
  };

  return (
    <ScreenShell>
      <ListForm
        initialName=""
        initialIcon={LIST_ICONS[0]}
        initialColor={QUICK_COLORS[0]}
        submitLabel={labels.list_create}
        initialCollectionId={collectionId}
        onSubmit={create}
      />
    </ScreenShell>
  );
}
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useLabels } from '../hooks/useLabels';
import { LIST_ICONS } from '../constants/listIcons';
import { QUICK_COLORS } from '../constants/listColors';
import type { IconName, NavigationProp } from '../constants/types';
import { collectionRepository as collectionRepo } from '../database';
import ScreenShell from '../components/ScreenShell';
import CollectionForm from '../components/CollectionForm';

export default function CreateCollectionScreen() {
  const navigation = useNavigation<NavigationProp<'CreateCollection'>>();
  const { refresh } = useApp();
  const labels = useLabels();

  const create = async ({ name, icon, color }: { name: string; icon: IconName; color: string }) => {
    await collectionRepo.create({ name, icon, color });
    await refresh();
    navigation.goBack();
  };

  return (
    <ScreenShell>
      <CollectionForm
        initialName=""
        initialIcon={LIST_ICONS[0]}
        initialColor={QUICK_COLORS[0]}
        submitLabel={labels.collection_create}
        onSubmit={create}
      />
    </ScreenShell>
  );
}
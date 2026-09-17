import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useLabels } from '../hooks/useLabels';
import { LIST_ICONS } from '../constants/listIcons';
import { QUICK_COLORS } from '../constants/listColors';
import type { IconName, NavigationProp } from '../constants/types';
import { listRepository as listRepo } from '../database';
import ScreenShell from '../components/ScreenShell';
import ListForm from '../components/ListForm';

export default function CreateListScreen() {
  const navigation = useNavigation<NavigationProp<'CreateList'>>();
  const { refresh } = useApp();
  const labels = useLabels();

  const create = async ({ name, icon, color }: { name: string; icon: IconName; color: string }) => {
    await listRepo.create({ name, icon, color });
    await refresh();
    navigation.goBack();
  };

  return (
    <ScreenShell>
      <ListForm
        initialName=""
        initialIcon={LIST_ICONS[0]}
        initialColor={QUICK_COLORS[0]}
        heading={labels.create_list_title}
        submitLabel={labels.list_create}
        onSubmit={create}
      />
    </ScreenShell>
  );
}
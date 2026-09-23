import { useLabels } from '../hooks/useLabels';
import { MAX_COLLECTION_NAME_LENGTH, type IconName } from '../constants/types';
import { validateCollectionName } from '../utils/validation';
import { collectionRepository as collectionRepo } from '../database';
import EntityForm from './EntityForm';

interface Props {
  initialName: string;
  initialIcon: IconName;
  initialColor: string;
  submitLabel: string;
  excludeId?: number;
  deleteLabel?: string;
  onDelete?: () => void;
  onSubmit: (data: { name: string; icon: IconName; color: string }) => Promise<void>;
}

export default function CollectionForm({
  initialName,
  initialIcon,
  initialColor,
  submitLabel,
  excludeId,
  deleteLabel,
  onDelete,
  onSubmit,
}: Props) {
  const labels = useLabels();

  return (
    <EntityForm
      initialName={initialName}
      initialIcon={initialIcon}
      initialColor={initialColor}
      submitLabel={submitLabel}
      nameLabel={labels.collection_name_label}
      iconLabel={labels.collection_icon_label}
      colorLabel={labels.collection_color_label}
      maxNameLength={MAX_COLLECTION_NAME_LENGTH}
      excludeId={excludeId}
      validate={validateCollectionName}
      duplicateError="collection_name_duplicate"
      existsByName={collectionRepo.existsByName}
      deleteLabel={deleteLabel}
      onDelete={onDelete}
      onSubmit={onSubmit}
    />
  );
}

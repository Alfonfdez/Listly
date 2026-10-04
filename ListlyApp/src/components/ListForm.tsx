import { useCallback, type ReactNode } from 'react';
import { useLabels } from '../hooks/useLabels';
import { MAX_LIST_NAME_LENGTH, type IconName } from '../constants/types';
import { validateListName } from '../utils/validation';
import { listRepo } from '../database';
import EntityForm, { type SecondaryAction } from './EntityForm';

interface Props {
  initialName: string;
  initialIcon: IconName;
  initialColor: string;
  submitLabel: string;
  excludeId?: number;
  initialCollectionId?: number | null;
  deleteLabel?: string;
  onDelete?: () => void;
  secondaryActions?: SecondaryAction[];
  fieldSlot?: ReactNode;
  kindSlot?: ReactNode;
  onSubmit: (data: {
    name: string;
    icon: IconName;
    color: string;
    collectionId?: number | null;
  }) => Promise<void>;
}

export default function ListForm({
  initialName,
  initialIcon,
  initialColor,
  submitLabel,
  excludeId,
  initialCollectionId,
  deleteLabel,
  onDelete,
  secondaryActions,
  fieldSlot,
  kindSlot,
  onSubmit,
}: Props) {
  const labels = useLabels();

  const submit = useCallback(
    (data: { name: string; icon: IconName; color: string }) =>
      onSubmit({ ...data, collectionId: initialCollectionId }),
    [onSubmit, initialCollectionId]
  );

  return (
    <EntityForm
      initialName={initialName}
      initialIcon={initialIcon}
      initialColor={initialColor}
      submitLabel={submitLabel}
      nameLabel={labels.list_name_label}
      iconLabel={labels.list_icon_label}
      colorLabel={labels.list_color_label}
      maxNameLength={MAX_LIST_NAME_LENGTH}
      excludeId={excludeId}
      validate={validateListName}
      duplicateError="list_name_duplicate"
      existsByName={listRepo.existsByName}
      deleteLabel={deleteLabel}
      onDelete={onDelete}
      secondaryActions={secondaryActions}
      kindSlot={kindSlot}
      fieldSlot={fieldSlot}
      onSubmit={submit}
    />
  );
}

import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useConfig } from '../context/ConfigContext';
import { withAlpha } from '../utils/color';
import { ALPHA_TINT } from './componentStyles';
import { PickerModal, PickerRow, pickerStyles } from './PickerModal';
import ModalFooter from './ModalFooter';
import type { CollectionWithCounts } from '../database/types';
import type { IconName } from '../constants/types';

interface Props {
  visible: boolean;
  title: string;
  options: CollectionWithCounts[];
  selectedId: number | null;
  standaloneLabel: string;
  cancelLabel: string;
  onSelect: (collectionId: number | null) => void;
  onClose: () => void;
}

export default function CollectionPickerModal({
  visible,
  title,
  options,
  selectedId,
  standaloneLabel,
  cancelLabel,
  onSelect,
  onClose,
}: Props) {
  const { activeColors: c } = useConfig();

  const handleSelect = (collectionId: number | null) => {
    onSelect(collectionId);
    onClose();
  };

  const badge = (background: string, icon: IconName, color: string, border = false) => (
    <View
      style={[
        pickerStyles.iconBadge,
        { backgroundColor: background },
        border && { borderWidth: 1, borderColor: c.border },
      ]}
    >
      <Ionicons name={icon} size={18} color={color} />
    </View>
  );

  const selectedCheck = (isSelected: boolean) =>
    isSelected ? <Ionicons name="checkmark" size={20} color={c.primary} /> : null;

  return (
    <PickerModal
      visible={visible}
      title={title}
      onClose={onClose}
      footer={<ModalFooter cancelLabel={cancelLabel} onCancel={onClose} onConfirm={onClose} />}
    >
      <PickerRow
        label={standaloneLabel}
        selected={selectedId === null}
        selectedTint
        onPress={() => handleSelect(null)}
        accessibilityLabel={standaloneLabel}
        leading={badge(c.background, 'albums-outline', c.textSecondary, true)}
        trailing={selectedCheck(selectedId === null)}
      />
      {options.map(collection => (
        <PickerRow
          key={collection.id}
          label={collection.name}
          selected={selectedId === collection.id}
          selectedTint
          onPress={() => handleSelect(collection.id)}
          accessibilityLabel={collection.name}
          leading={badge(withAlpha(collection.color, ALPHA_TINT), collection.icon as IconName, collection.color)}
          trailing={selectedCheck(selectedId === collection.id)}
        />
      ))}
    </PickerModal>
  );
}

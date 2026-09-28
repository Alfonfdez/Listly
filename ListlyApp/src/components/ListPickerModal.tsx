import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useLabels } from '../hooks/useLabels';
import { withAlpha } from '../utils/color';
import { ALPHA_TINT } from './componentStyles';
import { PickerModal, PickerRow, pickerStyles } from './PickerModal';
import ModalFooter from './ModalFooter';
import type { ListWithCounts } from '../database/types';
import type { IconName } from '../constants/types';

interface Props {
  visible: boolean;
  title: string;
  options: ListWithCounts[];
  excludeListId: number;
  cancelLabel: string;
  onSelect: (list: ListWithCounts) => void;
  onClose: () => void;
  subtitle?: string;
  emptyLabel?: string;
}

export default function ListPickerModal({
  visible,
  title,
  options,
  excludeListId,
  cancelLabel,
  onSelect,
  onClose,
  subtitle,
  emptyLabel,
}: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();

  const available = options.filter(list => list.id !== excludeListId);

  const handleSelect = (list: ListWithCounts) => {
    onSelect(list);
    onClose();
  };

  return (
    <PickerModal
      visible={visible}
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      footer={<ModalFooter cancelLabel={cancelLabel} onCancel={onClose} onConfirm={onClose} />}
    >
      {available.length === 0 ? (
        <Text style={[styles.empty, { color: c.textSecondary, fontSize: fs(14) }]}>
          {emptyLabel ?? labels.list_picker_empty}
        </Text>
      ) : (
        available.map(list => (
          <PickerRow
            key={list.id}
            label={list.name}
            onPress={() => handleSelect(list)}
            accessibilityLabel={list.name}
            leading={
              <View style={[pickerStyles.iconBadge, { backgroundColor: withAlpha(list.color, ALPHA_TINT) }]}>
                <Ionicons name={list.icon as IconName} size={18} color={list.color} />
              </View>
            }
            trailing={<Ionicons name="chevron-forward" size={18} color={c.textSecondary} />}
          />
        ))
      )}
    </PickerModal>
  );
}

const styles = StyleSheet.create({
  empty: {
    textAlign: 'center',
    paddingVertical: 20,
  },
});

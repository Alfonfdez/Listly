import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../../context/ConfigContext';
import { useResetOnOpen } from '../../hooks/useResetOnOpen';
import { PickerModal, PickerRow, pickerStyles } from '../PickerModal';
import ModalFooter from '../ModalFooter';
import type { Option } from './SelectorInline';

interface Props<T extends string> {
  visible: boolean;
  title: string;
  options: Option<T>[];
  selected: T;
  cancelLabel: string;
  confirmLabel: string;
  onSelect: (value: T) => void;
  onClose: () => void;
}

export default function OptionPickerModal<T extends string>({
  visible,
  title,
  options,
  selected,
  cancelLabel,
  confirmLabel,
  onSelect,
  onClose,
}: Props<T>) {
  const { activeColors: c } = useConfig();
  const [temp, setTemp] = useState<T>(selected);

  const resetOnOpen = useCallback(() => {
    setTemp(selected);
  }, [selected]);
  useResetOnOpen(visible, resetOnOpen);

  const handleConfirm = () => {
    onSelect(temp);
    onClose();
  };

  if (!visible) return null;

  return (
    <PickerModal
      visible={visible}
      title={title}
      onClose={onClose}
      footer={
        <ModalFooter
          cancelLabel={cancelLabel}
          confirmLabel={confirmLabel}
          onCancel={onClose}
          onConfirm={handleConfirm}
        />
      }
    >
      {options.map(option => {
        const isSelected = option.value === temp;
        return (
          <PickerRow
            key={option.value}
            label={option.label}
            selected={isSelected}
            onPress={() => setTemp(option.value)}
            accessibilityLabel={option.label}
            leading={
              <View style={pickerStyles.leading}>
                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={isSelected ? c.primary : c.textSecondary}
                />
                {option.icon ? <View style={pickerStyles.leadingIconWrap}>{option.icon}</View> : null}
              </View>
            }
          />
        );
      })}
    </PickerModal>
  );
}

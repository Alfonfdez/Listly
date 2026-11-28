import { useCallback, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../../context/ConfigContext';
import { useLabels } from '../../hooks/useLabels';
import { useFontSize } from '../../hooks/useFontSize';
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
  searchable?: boolean;
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
  searchable = false,
}: Props<T>) {
  const { activeColors: c } = useConfig();
  const labels = useLabels();
  const fs = useFontSize();
  const [temp, setTemp] = useState<T>(selected);
  const [query, setQuery] = useState('');

  const resetOnOpen = useCallback(() => {
    setTemp(selected);
    setQuery('');
  }, [selected]);
  useResetOnOpen(visible, resetOnOpen);

  const visibleOptions = searchable && query.trim()
    ? options.filter(option => option.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

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
      {searchable ? (
        <View style={[styles.search, { borderColor: c.border, backgroundColor: c.surface }]}>
          <Ionicons name="search" size={16} color={c.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={labels.common_search}
            placeholderTextColor={c.textSecondary}
            style={[styles.searchInput, { color: c.text, fontSize: fs(15) }]}
            accessibilityLabel={labels.common_search}
            autoCorrect={false}
          />
        </View>
      ) : null}
      {visibleOptions.map(option => {
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

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    padding: 0,
  },
});

import { TextInput, Text, StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useLabels } from '../hooks/useLabels';
import { BUTTON_BORDER_RADIUS } from './componentStyles';
import { formatMinor, lineTotalMinor } from '../utils/numeric';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '../constants/types';
import CharCounter from './CharCounter';
import QuantityStepper from './QuantityStepper';

interface ItemNameFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  accessibilityLabel: string;
  style: StyleProp<TextStyle>;
  returnKeyType?: 'done';
  onSubmitEditing?: () => void;
  autoFocus?: boolean;
}

export function ItemNameField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  style,
  returnKeyType,
  onSubmitEditing,
  autoFocus,
}: ItemNameFieldProps) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  return (
    <>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        maxLength={MAX_ITEM_NAME_LENGTH}
        placeholder={placeholder}
        placeholderTextColor={c.textSecondary}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        autoFocus={autoFocus}
        style={[styles.input, { color: c.text, fontSize: fs(15) }, style]}
        accessibilityLabel={accessibilityLabel}
      />
      <CharCounter current={value.length} max={MAX_ITEM_NAME_LENGTH} />
    </>
  );
}

interface ItemAmountFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  style: StyleProp<TextStyle>;
}

export function ItemAmountField({ value, onChangeText, style }: ItemAmountFieldProps) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      keyboardType="decimal-pad"
      placeholder={labels.item_amount_label}
      placeholderTextColor={c.textSecondary}
      style={[styles.input, { color: c.text, fontSize: fs(15) }, style]}
      accessibilityLabel={labels.item_amount_label}
    />
  );
}

interface ItemQuantityFieldProps {
  value: number;
  onChange: (value: number) => void;
}

export function ItemQuantityField({ value, onChange }: ItemQuantityFieldProps) {
  const labels = useLabels();

  return (
    <QuantityStepper
      value={value}
      onChange={onChange}
      label={labels.item_quantity_label}
      decrementLabel={`${labels.item_quantity_label} -`}
      incrementLabel={`${labels.item_quantity_label} +`}
    />
  );
}

interface ItemNoteFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  style: StyleProp<TextStyle>;
  numberOfLines?: number;
}

export function ItemNoteField({ value, onChangeText, style, numberOfLines }: ItemNoteFieldProps) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();

  return (
    <>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        maxLength={MAX_ITEM_NOTE_LENGTH}
        placeholder={labels.item_note_label}
        placeholderTextColor={c.textSecondary}
        multiline
        numberOfLines={numberOfLines}
        textAlignVertical="top"
        style={[styles.input, { color: c.text, fontSize: fs(15) }, style]}
        accessibilityLabel={labels.item_note_label}
      />
      <CharCounter current={value.length} max={MAX_ITEM_NOTE_LENGTH} />
    </>
  );
}

interface ItemLineTotalProps {
  amountMinor: number | null;
  quantity: number;
  fontSize: number;
  style?: StyleProp<TextStyle>;
}

export function ItemLineTotal({ amountMinor, quantity, fontSize, style }: ItemLineTotalProps) {
  const { activeColors: c } = useConfig();
  const labels = useLabels();
  const total = formatMinor(lineTotalMinor(amountMinor, quantity));

  return (
    <Text
      style={[{ color: c.text, fontSize }, style]}
      accessibilityLabel={`${labels.item_line_total_label}: ${total}`}
    >
      {total}
    </Text>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingHorizontal: 12,
  },
});

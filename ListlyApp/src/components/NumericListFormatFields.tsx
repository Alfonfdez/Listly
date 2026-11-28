import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useLabels } from '../hooks/useLabels';
import { useAmountFormat } from '../hooks/useAmountFormat';
import { CURRENCY_OPTIONS, type CurrencyId } from '../constants/currencies';
import { AMOUNT_FORMATS, type AmountFormat } from '../constants/types';
import { BUTTON_BORDER_RADIUS, PRESSED_OPACITY } from './componentStyles';
import FormField from './FormField';
import OptionPickerModal from './settings/OptionPickerModal';
import type { Option } from './settings/SelectorInline';

type CurrencyChoice = 'inherit' | CurrencyId;
type FormatChoice = 'inherit' | AmountFormat;

interface Props {
  currency: CurrencyId | null;
  amountFormat: AmountFormat | null;
  onChangeCurrency: (value: CurrencyId | null) => void;
  onChangeAmountFormat: (value: AmountFormat | null) => void;
}

export default function NumericListFormatFields({
  currency,
  amountFormat,
  onChangeCurrency,
  onChangeAmountFormat,
}: Props) {
  const labels = useLabels();
  const globalFormat = useAmountFormat();
  const [picker, setPicker] = useState<'currency' | 'format' | null>(null);

  const currencyLabel = (value: CurrencyId) =>
    labels[CURRENCY_OPTIONS.find(option => option.id === value)?.labelKey ?? 'currency_none'];
  const formatLabel = (value: AmountFormat) => {
    switch (value) {
      case AMOUNT_FORMATS.comma:
        return labels.format_comma;
      case AMOUNT_FORMATS.dot:
        return labels.format_dot;
      default:
        return labels.format_plain;
    }
  };

  const effectiveCurrency = currency ?? globalFormat.currency;
  const effectiveFormat = amountFormat ?? globalFormat.amountFormat;
  const currencyText = currency === null
    ? labels.list_use_global(currencyLabel(effectiveCurrency))
    : currencyLabel(currency);
  const formatText = amountFormat === null
    ? labels.list_use_global(formatLabel(effectiveFormat))
    : formatLabel(amountFormat);

  const currencyOptions: Option<CurrencyChoice>[] = [
    { label: labels.list_use_global(currencyLabel(globalFormat.currency)), value: 'inherit' },
    ...CURRENCY_OPTIONS.map(option => ({
      label: labels[option.labelKey],
      value: option.id,
    })),
  ];
  const formatOptions: Option<FormatChoice>[] = [
    { label: labels.list_use_global(formatLabel(globalFormat.amountFormat)), value: 'inherit' },
    { label: labels.format_plain, value: AMOUNT_FORMATS.plain },
    { label: labels.format_comma, value: AMOUNT_FORMATS.comma },
    { label: labels.format_dot, value: AMOUNT_FORMATS.dot },
  ];

  return (
    <View style={styles.fields}>
      <FormField label={labels.settings_currency}>
        <Trigger
          label={currencyText}
          accessibilityLabel={`${labels.settings_currency}: ${currencyText}`}
          onPress={() => setPicker('currency')}
        />
      </FormField>
      <FormField label={labels.settings_decimal_sep}>
        <Trigger
          label={formatText}
          accessibilityLabel={`${labels.settings_decimal_sep}: ${formatText}`}
          onPress={() => setPicker('format')}
        />
      </FormField>

      <OptionPickerModal
        visible={picker === 'currency'}
        title={labels.settings_currency}
        options={currencyOptions}
        selected={currency ?? 'inherit'}
        cancelLabel={labels.common_cancel}
        confirmLabel={labels.common_select}
        onSelect={value => onChangeCurrency(value === 'inherit' ? null : value)}
        onClose={() => setPicker(null)}
        searchable
      />
      <OptionPickerModal
        visible={picker === 'format'}
        title={labels.settings_decimal_sep}
        options={formatOptions}
        selected={amountFormat ?? 'inherit'}
        cancelLabel={labels.common_cancel}
        confirmLabel={labels.common_select}
        onSelect={value => onChangeAmountFormat(value === 'inherit' ? null : value)}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}

function Trigger({
  label,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.trigger,
        { backgroundColor: c.surface, borderColor: c.border },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text
        numberOfLines={1}
        style={[styles.triggerText, { color: c.text, fontSize: fs(15) }]}
      >
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={c.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: 16,
    marginTop: 16,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  triggerText: {
    flex: 1,
    fontWeight: '500',
  },
  pressed: {
    opacity: PRESSED_OPACITY,
  },
});

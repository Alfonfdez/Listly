import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useConfig } from '../../context/ConfigContext';
import { useFontSize } from '../../hooks/useFontSize';
import { useLabels } from '../../hooks/useLabels';
import { CURRENCY_OPTIONS, type CurrencyId } from '../../constants/currencies';
import { AMOUNT_FORMATS, type AmountFormat } from '../../constants/types';
import { LANGUAGES, type LanguageId } from '../../constants/languages';
import ScreenShell from '../../components/ScreenShell';
import SettingsSection from '../../components/settings/SettingsSection';
import SettingsPickerRow from '../../components/settings/SettingsPickerRow';
import OptionPickerModal from '../../components/settings/OptionPickerModal';
import FlagIcon from '../../components/settings/FlagIcon';
import { settingsStyles } from '../../components/settings/settingsStyles';
import type { Option } from '../../components/settings/SelectorInline';

type Picker = 'language' | 'currency' | 'format';

export default function RegionalScreen() {
  const { config, activeColors: c, updateConfig } = useConfig();
  const labels = useLabels();
  const fs = useFontSize();
  const [picker, setPicker] = useState<Picker | null>(null);

  const languageOptions: Option<LanguageId>[] = [
    { label: labels.lang_en, value: LANGUAGES.en, icon: <FlagIcon code={LANGUAGES.en} /> },
    { label: labels.lang_es, value: LANGUAGES.es, icon: <FlagIcon code={LANGUAGES.es} /> },
    { label: labels.lang_ca, value: LANGUAGES.ca, icon: <FlagIcon code={LANGUAGES.ca} /> },
    { label: labels.lang_gl, value: LANGUAGES.gl, icon: <FlagIcon code={LANGUAGES.gl} /> },
    { label: labels.lang_eu, value: LANGUAGES.eu, icon: <FlagIcon code={LANGUAGES.eu} /> },
    { label: labels.lang_fr, value: LANGUAGES.fr, icon: <FlagIcon code={LANGUAGES.fr} /> },
    { label: labels.lang_de, value: LANGUAGES.de, icon: <FlagIcon code={LANGUAGES.de} /> },
    { label: labels.lang_pt, value: LANGUAGES.pt, icon: <FlagIcon code={LANGUAGES.pt} /> },
    { label: labels.lang_it, value: LANGUAGES.it, icon: <FlagIcon code={LANGUAGES.it} /> },
  ];
  const currencyOptions: Option<CurrencyId>[] = CURRENCY_OPTIONS.map(option => ({
    label: labels[option.labelKey],
    value: option.id,
    icon: (
      <Text style={[styles.currencyIcon, { color: c.text, fontSize: fs(16) }]}>
        {option.symbol || '—'}
      </Text>
    ),
  }));
  const formatOptions: Option<AmountFormat>[] = [
    { label: labels.sep_plain, value: AMOUNT_FORMATS.plain },
    { label: labels.sep_comma, value: AMOUNT_FORMATS.comma },
    { label: labels.sep_dot, value: AMOUNT_FORMATS.dot },
  ];

  const languageLabel =
    languageOptions.find(option => option.value === config.language)?.label ?? config.language;
  const currencyLabel =
    currencyOptions.find(option => option.value === config.currency)?.label ?? labels.currency_none;
  const formatLabel =
    formatOptions.find(option => option.value === config.amountFormat)?.label ?? labels.sep_plain;

  return (
    <ScreenShell>
      <ScrollView style={settingsStyles.container} contentContainerStyle={settingsStyles.content}>
        <SettingsSection title={labels.settings_language}>
          <SettingsPickerRow
            label={labels.settings_language}
            value={languageLabel}
            onPress={() => setPicker('language')}
          />
        </SettingsSection>

        <SettingsSection title={labels.settings_money}>
          <View style={styles.rows}>
            <SettingsPickerRow
              label={labels.settings_currency}
              value={currencyLabel}
              onPress={() => setPicker('currency')}
            />
            <SettingsPickerRow
              label={labels.settings_decimal_sep}
              value={formatLabel}
              onPress={() => setPicker('format')}
            />
          </View>
        </SettingsSection>
      </ScrollView>

      <OptionPickerModal
        visible={picker === 'language'}
        title={labels.settings_language_picker_title}
        options={languageOptions}
        selected={config.language}
        cancelLabel={labels.common_cancel}
        confirmLabel={labels.common_select}
        onSelect={language => void updateConfig({ language })}
        onClose={() => setPicker(null)}
      />
      <OptionPickerModal
        visible={picker === 'currency'}
        title={labels.settings_currency}
        options={currencyOptions}
        selected={config.currency}
        cancelLabel={labels.common_cancel}
        confirmLabel={labels.common_select}
        onSelect={currency => void updateConfig({ currency })}
        onClose={() => setPicker(null)}
        searchable
      />
      <OptionPickerModal
        visible={picker === 'format'}
        title={labels.settings_decimal_sep}
        options={formatOptions}
        selected={config.amountFormat}
        cancelLabel={labels.common_cancel}
        confirmLabel={labels.common_select}
        onSelect={amountFormat => void updateConfig({ amountFormat })}
        onClose={() => setPicker(null)}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  rows: {
    gap: 16,
  },
  currencyIcon: {
    fontWeight: '600',
    lineHeight: 20,
  },
});

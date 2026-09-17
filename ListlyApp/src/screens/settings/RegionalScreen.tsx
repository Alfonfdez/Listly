import { useState } from 'react';
import { ScrollView } from 'react-native';
import { useConfig } from '../../context/ConfigContext';
import { useLabels } from '../../hooks/useLabels';
import { LANGUAGES, type LanguageId } from '../../constants/languages';
import ScreenShell from '../../components/ScreenShell';
import SettingsSection from '../../components/settings/SettingsSection';
import SettingsPickerRow from '../../components/settings/SettingsPickerRow';
import OptionPickerModal from '../../components/settings/OptionPickerModal';
import FlagIcon from '../../components/settings/FlagIcon';
import { settingsStyles } from '../../components/settings/settingsStyles';
import type { Option } from '../../components/settings/SelectorInline';

export default function RegionalScreen() {
  const { config, updateConfig } = useConfig();
  const labels = useLabels();
  const [pickerOpen, setPickerOpen] = useState(false);

  const languageOptions: Option<LanguageId>[] = [
    { label: labels.lang_en, value: LANGUAGES.en, icon: <FlagIcon code={LANGUAGES.en} /> },
    { label: labels.lang_es, value: LANGUAGES.es, icon: <FlagIcon code={LANGUAGES.es} /> },
  ];
  const languageLabel =
    languageOptions.find(option => option.value === config.language)?.label ?? config.language;

  return (
    <ScreenShell>
      <ScrollView style={settingsStyles.container} contentContainerStyle={settingsStyles.content}>
        <SettingsSection title={labels.settings_language}>
          <SettingsPickerRow
            label={labels.settings_language}
            value={languageLabel}
            onPress={() => setPickerOpen(true)}
          />
        </SettingsSection>
      </ScrollView>

      <OptionPickerModal
        visible={pickerOpen}
        title={labels.settings_language_picker_title}
        options={languageOptions}
        selected={config.language}
        cancelLabel={labels.common_cancel}
        confirmLabel={labels.common_select}
        onSelect={language => void updateConfig({ language })}
        onClose={() => setPickerOpen(false)}
      />
    </ScreenShell>
  );
}

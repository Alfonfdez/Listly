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
    { label: labels.lang_ca, value: LANGUAGES.ca, icon: <FlagIcon code={LANGUAGES.ca} /> },
    { label: labels.lang_gl, value: LANGUAGES.gl, icon: <FlagIcon code={LANGUAGES.gl} /> },
    { label: labels.lang_eu, value: LANGUAGES.eu, icon: <FlagIcon code={LANGUAGES.eu} /> },
    { label: labels.lang_fr, value: LANGUAGES.fr, icon: <FlagIcon code={LANGUAGES.fr} /> },
    { label: labels.lang_de, value: LANGUAGES.de, icon: <FlagIcon code={LANGUAGES.de} /> },
    { label: labels.lang_pt, value: LANGUAGES.pt, icon: <FlagIcon code={LANGUAGES.pt} /> },
    { label: labels.lang_it, value: LANGUAGES.it, icon: <FlagIcon code={LANGUAGES.it} /> },
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

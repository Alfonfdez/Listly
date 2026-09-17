import { ScrollView, Text, View } from 'react-native';
import { useConfig } from '../../context/ConfigContext';
import { useFontSize } from '../../hooks/useFontSize';
import { useLabels } from '../../hooks/useLabels';
import { LIST_LAYOUTS, type ListLayout } from '../../constants/types';
import ScreenShell from '../../components/ScreenShell';
import SettingsSection from '../../components/settings/SettingsSection';
import SettingsSelectRow from '../../components/settings/SettingsSelectRow';
import CheckboxRow from '../../components/settings/CheckboxRow';
import { settingsStyles } from '../../components/settings/settingsStyles';
import type { Option } from '../../components/settings/SelectorInline';

export default function PersonalizationScreen() {
  const { config, activeColors: c, updateConfig } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();

  const layoutOptions: Option<ListLayout>[] = [
    { label: labels.layout_grid, value: LIST_LAYOUTS.grid },
    { label: labels.layout_list, value: LIST_LAYOUTS.list },
  ];

  return (
    <ScreenShell>
      <ScrollView style={settingsStyles.container} contentContainerStyle={settingsStyles.content}>
        <SettingsSection title={labels.settings_home_screen}>
          <SettingsSelectRow
            label={labels.settings_list_layout}
            options={layoutOptions}
            selected={config.homeLayout}
            onSelect={homeLayout => void updateConfig({ homeLayout })}
          />
        </SettingsSection>

        <SettingsSection title={labels.settings_lists_screen} card={false}>
          <View style={[settingsStyles.card, { backgroundColor: c.surface }]}>
            <SettingsSelectRow
              label={labels.settings_list_layout}
              options={layoutOptions}
              selected={config.listsLayout}
              onSelect={listsLayout => void updateConfig({ listsLayout })}
            />
          </View>

          <View style={[settingsStyles.card, { backgroundColor: c.surface }]}>
            <Text style={[settingsStyles.label, { color: c.text, fontSize: fs(15) }]}>
              {labels.settings_item_display}
            </Text>
            <Text
              style={[settingsStyles.groupSubtitle, { color: c.textSecondary, fontSize: fs(13) }]}
            >
              {labels.settings_optional_fields}
            </Text>
            <CheckboxRow
              label={labels.settings_notes}
              checked={config.showNotes}
              onToggle={() => void updateConfig({ showNotes: !config.showNotes })}
            />
            <CheckboxRow
              label={labels.settings_photos}
              checked={config.showPhotos}
              onToggle={() => void updateConfig({ showPhotos: !config.showPhotos })}
            />
          </View>

          <View style={[settingsStyles.card, { backgroundColor: c.surface }]}>
            <Text style={[settingsStyles.label, { color: c.text, fontSize: fs(15) }]}>
              {labels.settings_edit_item}
            </Text>
            <Text
              style={[settingsStyles.groupSubtitle, { color: c.textSecondary, fontSize: fs(13) }]}
            >
              {labels.settings_optional_fields}
            </Text>
            <CheckboxRow
              label={labels.settings_notes}
              checked={config.editShowNotes}
              onToggle={() => void updateConfig({ editShowNotes: !config.editShowNotes })}
            />
            <CheckboxRow
              label={labels.settings_photos}
              checked={config.editShowPhotos}
              onToggle={() => void updateConfig({ editShowPhotos: !config.editShowPhotos })}
            />
          </View>
        </SettingsSection>
      </ScrollView>
    </ScreenShell>
  );
}

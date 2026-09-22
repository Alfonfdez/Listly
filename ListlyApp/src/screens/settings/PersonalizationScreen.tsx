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
import { SECTION_SUBTITLE_FONT_SIZE, SECTION_TITLE_FONT_SIZE, textStyles } from '../../components/textStyles';
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
            label={labels.collection_section_title}
            options={layoutOptions}
            selected={config.homeCollectionsLayout}
            onSelect={homeCollectionsLayout => void updateConfig({ homeCollectionsLayout })}
          />
          <SettingsSelectRow
            label={labels.home_section_lists}
            options={layoutOptions}
            selected={config.homeListsLayout}
            onSelect={homeListsLayout => void updateConfig({ homeListsLayout })}
          />
        </SettingsSection>

        <SettingsSection title={labels.settings_collections_screen}>
          <SettingsSelectRow
            label={labels.settings_list_layout}
            options={layoutOptions}
            selected={config.collectionsLayout}
            onSelect={collectionsLayout => void updateConfig({ collectionsLayout })}
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
            <Text style={[textStyles.sectionTitle, { color: c.text, fontSize: fs(SECTION_TITLE_FONT_SIZE) }]}>
              {labels.settings_item_display}
            </Text>
            <Text
              style={[textStyles.sectionSubtitle, { color: c.textSecondary, fontSize: fs(SECTION_SUBTITLE_FONT_SIZE) }]}
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
            <Text style={[textStyles.sectionTitle, { color: c.text, fontSize: fs(SECTION_TITLE_FONT_SIZE) }]}>
              {labels.settings_edit_item}
            </Text>
            <Text
              style={[textStyles.sectionSubtitle, { color: c.textSecondary, fontSize: fs(SECTION_SUBTITLE_FONT_SIZE) }]}
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

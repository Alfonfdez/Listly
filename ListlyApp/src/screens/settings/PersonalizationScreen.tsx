import { ScrollView, StyleSheet, Text, View } from 'react-native';
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

type FlagKey = 'showNotes' | 'showPhotos' | 'editShowNotes' | 'editShowPhotos'
  | 'showNotesNumeric' | 'showPhotosNumeric' | 'editShowNotesNumeric' | 'editShowPhotosNumeric';

interface OptionalFieldsCardProps {
  title: string;
  subtitle: string;
  notes: { label: string; checked: boolean; onToggle: () => void };
  photos: { label: string; checked: boolean; onToggle: () => void };
}

function OptionalFieldsCard({ title, subtitle, notes, photos }: OptionalFieldsCardProps) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  return (
    <View style={[settingsStyles.card, { backgroundColor: c.surface }]}>
      <Text style={[textStyles.sectionTitle, { color: c.text, fontSize: fs(SECTION_TITLE_FONT_SIZE) }]}>
        {title}
      </Text>
      <Text
        style={[textStyles.sectionSubtitle, { color: c.textSecondary, fontSize: fs(SECTION_SUBTITLE_FONT_SIZE) }]}
      >
        {subtitle}
      </Text>
      <CheckboxRow label={notes.label} checked={notes.checked} onToggle={notes.onToggle} />
      <CheckboxRow label={photos.label} checked={photos.checked} onToggle={photos.onToggle} />
    </View>
  );
}

export default function PersonalizationScreen() {
  const { config, activeColors: c, updateConfig } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();

  const layoutOptions: Option<ListLayout>[] = [
    { label: labels.layout_grid, value: LIST_LAYOUTS.grid },
    { label: labels.layout_list, value: LIST_LAYOUTS.list },
  ];

  const groupHeading = (label: string) => (
    <Text style={[textStyles.sectionTitle, { color: c.textSecondary, fontSize: fs(12) }]}>{label}</Text>
  );

  const flag = (key: FlagKey) => ({
    checked: config[key],
    onToggle: () => void updateConfig({ [key]: !config[key] }),
  });

  const optionalFields = (keys: {
    showNotes: FlagKey;
    showPhotos: FlagKey;
    editShowNotes: FlagKey;
    editShowPhotos: FlagKey;
  }, titles: { display: string; edit: string }) => (
    <>
      <OptionalFieldsCard
        title={titles.display}
        subtitle={labels.settings_optional_fields}
        notes={{ label: labels.settings_notes, ...flag(keys.showNotes) }}
        photos={{ label: labels.settings_photos, ...flag(keys.showPhotos) }}
      />
      <OptionalFieldsCard
        title={titles.edit}
        subtitle={labels.settings_optional_fields}
        notes={{ label: labels.settings_notes, ...flag(keys.editShowNotes) }}
        photos={{ label: labels.settings_photos, ...flag(keys.editShowPhotos) }}
      />
    </>
  );

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
          <View style={styles.homeRowSpacer} />
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

        <SettingsSection title={labels.settings_collection_detail_screen}>
          <SettingsSelectRow
            label={labels.settings_list_layout}
            options={layoutOptions}
            selected={config.collectionDetailLayout}
            onSelect={collectionDetailLayout => void updateConfig({ collectionDetailLayout })}
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

          {groupHeading(labels.settings_standard_lists)}
          {optionalFields(
            {
              showNotes: 'showNotes',
              showPhotos: 'showPhotos',
              editShowNotes: 'editShowNotes',
              editShowPhotos: 'editShowPhotos',
            },
            { display: labels.settings_item_display, edit: labels.settings_edit_item }
          )}

          {groupHeading(labels.settings_numeric_lists)}
          {optionalFields(
            {
              showNotes: 'showNotesNumeric',
              showPhotos: 'showPhotosNumeric',
              editShowNotes: 'editShowNotesNumeric',
              editShowPhotos: 'editShowPhotosNumeric',
            },
            { display: labels.settings_item_display, edit: labels.settings_edit_item }
          )}
        </SettingsSection>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  homeRowSpacer: { height: 16 },
});

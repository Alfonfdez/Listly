import { ScrollView, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../../context/ConfigContext';
import { useFontSize } from '../../hooks/useFontSize';
import { useLabels } from '../../hooks/useLabels';
import { TEXT_SIZES, THEMES, type TextSize, type Theme } from '../../constants/types';
import ScreenShell from '../../components/ScreenShell';
import SettingsSection from '../../components/settings/SettingsSection';
import SelectorInline, { type Option } from '../../components/settings/SelectorInline';
import { settingsStyles } from '../../components/settings/settingsStyles';

export default function AppearanceScreen() {
  const { config, activeColors: c, updateConfig } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();

  const icon = (name: keyof typeof Ionicons.glyphMap) => (
    <Ionicons name={name} size={16} color={c.text} />
  );

  const sizeIcon = (size: number) => (
    <Text style={[styles.sizeIcon, { color: c.text, fontSize: size }]} allowFontScaling={false}>
      A
    </Text>
  );

  const themeOptions: Option<Theme>[] = [
    { label: labels.theme_dark, value: THEMES.dark, icon: icon('moon') },
    { label: labels.theme_light, value: THEMES.light, icon: icon('sunny') },
    { label: labels.theme_system, value: THEMES.system, icon: icon('phone-portrait-outline') },
  ];
  const sizeOptions: Option<TextSize>[] = [
    { label: labels.size_small, value: TEXT_SIZES.small, icon: sizeIcon(fs(11)) },
    { label: labels.size_medium, value: TEXT_SIZES.medium, icon: sizeIcon(fs(15)) },
    { label: labels.size_large, value: TEXT_SIZES.large, icon: sizeIcon(fs(19)) },
  ];

  return (
    <ScreenShell>
      <ScrollView style={settingsStyles.container} contentContainerStyle={settingsStyles.content}>
        <SettingsSection title={labels.settings_theme}>
          <SelectorInline
            options={themeOptions}
            selected={config.theme}
            onSelect={theme => void updateConfig({ theme })}
          />
        </SettingsSection>

        <SettingsSection title={labels.settings_text_size}>
          <SelectorInline
            options={sizeOptions}
            selected={config.textSize}
            onSelect={textSize => void updateConfig({ textSize })}
          />
        </SettingsSection>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  sizeIcon: {
    fontWeight: '700',
    lineHeight: 20,
  },
});

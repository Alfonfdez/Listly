import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLabels } from '../hooks/useLabels';
import type { NavigationProp } from '../constants/types';
import ScreenShell from '../components/ScreenShell';
import SettingsRow from '../components/settings/SettingsRow';
import { settingsStyles } from '../components/settings/settingsStyles';

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp<'Settings'>>();
  const labels = useLabels();

  return (
    <ScreenShell>
      <ScrollView style={settingsStyles.container} contentContainerStyle={settingsStyles.content}>
        <SettingsRow
          label={labels.settings_appearance}
          icon="color-palette-outline"
          onPress={() => navigation.navigate('SettingsAppearance')}
        />
        <SettingsRow
          label={labels.settings_regional}
          icon="globe-outline"
          onPress={() => navigation.navigate('SettingsRegional')}
        />
        <SettingsRow
          label={labels.settings_personalization}
          icon="options-outline"
          onPress={() => navigation.navigate('SettingsPersonalization')}
        />
        <SettingsRow
          label={labels.settings_data}
          icon="server-outline"
          onPress={() => navigation.navigate('SettingsData')}
        />
      </ScrollView>
    </ScreenShell>
  );
}

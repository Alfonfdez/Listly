import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../../context/ConfigContext';
import { useFontSize } from '../../hooks/useFontSize';
import { PRESSED_OPACITY } from '../componentStyles';
import { settingsStyles } from './settingsStyles';
import type { IconName } from '../../constants/types';

interface Props {
  label: string;
  description?: string;
  onPress: () => void;
  icon?: IconName;
  iconColor?: string;
  labelColor?: string;
  showChevron?: boolean;
}

export default function SettingsRow({
  label,
  description,
  onPress,
  icon,
  iconColor,
  labelColor,
  showChevron = true,
}: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  return (
    <TouchableOpacity
      style={[settingsStyles.card, settingsStyles.row, { backgroundColor: c.surface }]}
      onPress={onPress}
      activeOpacity={PRESSED_OPACITY}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon ? <Ionicons name={icon} size={22} color={iconColor ?? c.primary} /> : null}
      <View style={settingsStyles.rowText}>
        <Text style={[settingsStyles.rowLabel, { color: labelColor ?? c.text, fontSize: fs(15) }]}>
          {label}
        </Text>
        {description ? (
          <Text style={[settingsStyles.rowDescription, { color: c.textSecondary, fontSize: fs(12) }]}>
            {description}
          </Text>
        ) : null}
      </View>
      {showChevron ? <Ionicons name="chevron-forward-outline" size={20} color={c.textSecondary} /> : null}
    </TouchableOpacity>
  );
}

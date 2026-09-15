import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../i18n';

interface Props {
  active: boolean;
  onToggle: () => void;
  color?: string;
}

export default function SelectToggleButton({ active, onToggle, color }: Props) {
  const labels = t();
  return (
    <TouchableOpacity
      onPress={onToggle}
      hitSlop={8}
      style={{ padding: 6 }}
      accessibilityRole="button"
      accessibilityLabel={active ? labels.select_exit_mode : labels.select_enter_mode}
    >
      <Ionicons
        name={active ? 'close-outline' : 'checkbox-outline'}
        size={22}
        color={color}
      />
    </TouchableOpacity>
  );
}
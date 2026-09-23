import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLabels } from '../hooks/useLabels';
import { ICON_BUTTON_PADDING, HIT_SLOP } from './componentStyles';

interface Props {
  active: boolean;
  onToggle: () => void;
  color?: string;
}

export default function SelectToggleButton({ active, onToggle, color }: Props) {
  const labels = useLabels();
  return (
    <TouchableOpacity
      onPress={onToggle}
      hitSlop={HIT_SLOP}
      style={{ padding: ICON_BUTTON_PADDING }}
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
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import SelectToggleButton from './SelectToggleButton';
import { ICON_BUTTON_PADDING } from './componentStyles';
import { useLabels } from '../hooks/useLabels';

interface Props {
  selectMode: boolean;
  showSelect: boolean;
  showSearch?: boolean;
  searchActive: boolean;
  onToggleSelect: () => void;
  onToggleSearch: () => void;
}

export default function SelectSearchHeader({ selectMode, showSelect, showSearch = true, searchActive, onToggleSelect, onToggleSearch }: Props) {
  const { activeColors: c } = useConfig();
  const labels = useLabels();

  return (
    <View style={styles.row}>
      {showSelect && (
        <SelectToggleButton active={selectMode} onToggle={onToggleSelect} color={c.primary} />
      )}
      {showSearch && (
        <TouchableOpacity
          onPress={onToggleSearch}
          style={{ padding: ICON_BUTTON_PADDING }}
          accessibilityRole="button"
          accessibilityLabel={labels.common_search}
        >
          <Ionicons
            name={searchActive ? 'close' : 'search-outline'}
            size={22}
            color={searchActive ? c.primary : c.text}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
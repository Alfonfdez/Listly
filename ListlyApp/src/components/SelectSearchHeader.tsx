import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import SelectToggleButton from './SelectToggleButton';
import { ICON_BUTTON_PADDING } from './componentStyles';
import { t } from '../i18n';

interface Props {
  selectMode: boolean;
  showSelect: boolean;
  searchActive: boolean;
  onToggleSelect: () => void;
  onToggleSearch: () => void;
}

export default function SelectSearchHeader({ selectMode, showSelect, searchActive, onToggleSelect, onToggleSearch }: Props) {
  const { activeColors: c } = useConfig();
  const labels = t();

  return (
    <View style={styles.row}>
      {showSelect && (
        <SelectToggleButton active={selectMode} onToggle={onToggleSelect} color={c.primary} />
      )}
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
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
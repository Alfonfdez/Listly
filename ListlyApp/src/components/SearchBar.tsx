import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { BUTTON_BORDER_RADIUS } from './componentStyles';

interface Props {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
  autoFocus?: boolean;
}

export default function SearchBar({ placeholder, value, onChangeText, onClose, autoFocus = false }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  return (
    <View style={[styles.container, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Ionicons name="search-outline" size={20} color={c.textSecondary} style={styles.icon} />
      <TextInput
        style={[styles.input, { color: c.text, fontSize: fs(15) }]}
        placeholder={placeholder}
        placeholderTextColor={c.textSecondary}
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
      />
      <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityLabel="Close search">
        <Ionicons name="close-circle" size={20} color={c.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
  },
  closeButton: {
    marginLeft: 8,
  },
});
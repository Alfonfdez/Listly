import { memo } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useConfig } from '../context/ConfigContext';
import type { StyleProp, ViewStyle } from 'react-native';

interface Props {
  size?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export default memo(function DrawerMenuButton({ size = 24, accessibilityLabel, style }: Props) {
  const navigation = useNavigation();
  const { activeColors: c } = useConfig();

  return (
    <TouchableOpacity
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      style={[styles.button, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name="menu-outline" size={size} color={c.text} />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  button: {
    marginLeft: 8,
    padding: 4,
  },
});
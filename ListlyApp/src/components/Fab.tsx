import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { BLACK } from '../constants/themes';
import { isWeb } from '../utils/platform';
import { FAB_SIZE } from './componentStyles';

interface Props {
  onPress: () => void;
  accessibilityLabel: string;
}

export default function Fab({ onPress, accessibilityLabel }: Props) {
  const { activeColors: c } = useConfig();
  return (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: c.primary }, isWeb ? fabShadowWeb : fabShadowNative]}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name="add" size={28} color={c.background} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const fabShadowNative = {
  elevation: 6,
  shadowColor: BLACK,
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
};

const fabShadowWeb = {
  boxShadow: '0 3px 6px rgba(0,0,0,0.3)',
};
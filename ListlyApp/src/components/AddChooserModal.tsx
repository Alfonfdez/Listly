import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useLabels } from '../hooks/useLabels';
import ModalShell from './ModalShell';
import ModalFooter from './ModalFooter';
import { CARD_BORDER_RADIUS } from './componentStyles';
import { ICONS } from '../constants/icons';
import type { IconName } from '../constants/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAddList: () => void;
  onAddCollection: () => void;
}

export default function AddChooserModal({ visible, onClose, onAddList, onAddCollection }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();

  const row = (icon: IconName, label: string, onPress: () => void, accessibilityLabel: string) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.option,
        { backgroundColor: c.background, borderColor: c.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: c.primary }]}>
        <Ionicons name={icon} size={20} color={c.background} />
      </View>
      <Text style={[styles.optionText, { color: c.text, fontSize: fs(15) }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={c.textSecondary} />
    </Pressable>
  );

  return (
    <ModalShell visible={visible} onClose={onClose} padding={20}>
      <Text style={[styles.title, { color: c.textSecondary, fontSize: fs(12) }]}>
        {labels.home_add_choice_title}
      </Text>
      <View style={styles.stack}>
        {row(ICONS.collection, labels.home_add_collection, onAddCollection, labels.home_add_collection)}
        {row(ICONS.list, labels.home_add, onAddList, labels.home_add)}
      </View>
      <ModalFooter confirmLabel={labels.common_close} onConfirm={onClose} />
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  stack: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: CARD_BORDER_RADIUS,
    borderWidth: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.6,
  },
});
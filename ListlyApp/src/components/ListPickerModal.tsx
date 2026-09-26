import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useLabels } from '../hooks/useLabels';
import { withAlpha } from '../utils/color';
import { ALPHA_TINT, BUTTON_BORDER_RADIUS, CARD_BORDER_RADIUS, PRESSED_OPACITY } from './componentStyles';
import { TRANSPARENT } from '../constants/themes';
import ModalShell from './ModalShell';
import type { ListWithCounts } from '../database/types';
import type { IconName } from '../constants/types';

interface Props {
  visible: boolean;
  title: string;
  options: ListWithCounts[];
  excludeListId: number;
  cancelLabel: string;
  onSelect: (list: ListWithCounts) => void;
  onClose: () => void;
}

export default function ListPickerModal({
  visible,
  title,
  options,
  excludeListId,
  cancelLabel,
  onSelect,
  onClose,
}: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();

  const available = options.filter(list => list.id !== excludeListId);

  const handleSelect = (list: ListWithCounts) => {
    onSelect(list);
    onClose();
  };

  return (
    <ModalShell visible={visible} onClose={onClose} maxWidth={380} padding={20}>
      <Text style={[styles.title, { color: c.text, fontSize: fs(18) }]}>{title}</Text>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {available.length === 0 ? (
          <Text style={[styles.empty, { color: c.textSecondary, fontSize: fs(14) }]}>
            {labels.list_picker_empty}
          </Text>
        ) : (
          available.map(list => (
            <TouchableOpacity
              key={list.id}
              onPress={() => handleSelect(list)}
              style={[styles.row, { borderBottomColor: c.border }]}
              activeOpacity={PRESSED_OPACITY}
              accessibilityRole="button"
              accessibilityLabel={list.name}
            >
              <View style={[styles.iconBadge, { backgroundColor: withAlpha(list.color, ALPHA_TINT) }]}>
                <Ionicons name={list.icon as IconName} size={18} color={list.color} />
              </View>
              <Text style={[styles.label, { color: c.text, fontSize: fs(15) }]} numberOfLines={1}>
                {list.name}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={c.textSecondary} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: c.background, borderColor: c.border }]}
          onPress={onClose}
          activeOpacity={PRESSED_OPACITY}
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
        >
          <Text style={[styles.buttonText, { color: c.text, fontSize: fs(14) }]}>{cancelLabel}</Text>
        </TouchableOpacity>
      </View>
    </ModalShell>
  );
}

const ICON_BADGE_SIZE = 36;

const styles = StyleSheet.create({
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  scroll: {
    marginTop: 12,
    flexGrow: 0,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconBadge: {
    width: ICON_BADGE_SIZE,
    height: ICON_BADGE_SIZE,
    borderRadius: CARD_BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontWeight: '600',
  },
  footer: {
    marginTop: 16,
  },
  button: {
    paddingVertical: 12,
    borderRadius: BUTTON_BORDER_RADIUS,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: TRANSPARENT,
  },
  buttonText: {
    fontWeight: '600',
  },
});
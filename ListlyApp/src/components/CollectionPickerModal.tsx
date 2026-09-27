import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { withAlpha } from '../utils/color';
import { ALPHA_TINT, BUTTON_BORDER_RADIUS, CARD_BORDER_RADIUS, PRESSED_OPACITY } from './componentStyles';
import { TRANSPARENT } from '../constants/themes';
import ModalShell from './ModalShell';
import type { CollectionWithCounts } from '../database/types';
import type { IconName } from '../constants/types';

interface Props {
  visible: boolean;
  title: string;
  options: CollectionWithCounts[];
  selectedId: number | null;
  standaloneLabel: string;
  cancelLabel: string;
  onSelect: (collectionId: number | null) => void;
  onClose: () => void;
}

const ICON_BADGE_SIZE = 36;

export default function CollectionPickerModal({
  visible,
  title,
  options,
  selectedId,
  standaloneLabel,
  cancelLabel,
  onSelect,
  onClose,
}: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  const handleSelect = (collectionId: number | null) => {
    onSelect(collectionId);
    onClose();
  };

  const renderRow = (
    rowKey: string,
    collectionId: number | null,
    badge: { background: string; border?: boolean; icon: IconName; color: string },
    name: string,
    isSelected: boolean,
    accessibilityLabel: string
  ) => (
    <TouchableOpacity
      key={rowKey}
      onPress={() => handleSelect(collectionId)}
      style={[styles.row, { borderBottomColor: c.border }, isSelected && { backgroundColor: withAlpha(c.primary, ALPHA_TINT) }]}
      activeOpacity={PRESSED_OPACITY}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: isSelected }}
    >
      <View style={[styles.iconBadge, { backgroundColor: badge.background }, badge.border && { borderWidth: 1, borderColor: c.border }]}>
        <Ionicons name={badge.icon} size={18} color={badge.color} />
      </View>
      <Text style={[styles.name, { color: c.text, fontSize: fs(15) }]} numberOfLines={1}>
        {name}
      </Text>
      {isSelected ? <Ionicons name="checkmark" size={20} color={c.primary} /> : null}
    </TouchableOpacity>
  );

  return (
    <ModalShell visible={visible} onClose={onClose} maxWidth={380} padding={20}>
      <Text style={[styles.title, { color: c.text, fontSize: fs(18) }]}>{title}</Text>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {renderRow(
          'none',
          null,
          {
            background: c.background,
            border: true,
            icon: 'albums-outline',
            color: c.textSecondary,
          },
          standaloneLabel,
          selectedId === null,
          standaloneLabel
        )}
        {options.map(collection =>
          renderRow(
            String(collection.id),
            collection.id,
            {
              background: withAlpha(collection.color, ALPHA_TINT),
              icon: collection.icon as IconName,
              color: collection.color,
            },
            collection.name,
            selectedId === collection.id,
            collection.name
          )
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

const styles = StyleSheet.create({
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  scroll: {
    marginTop: 12,
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderRadius: 8,
  },
  iconBadge: {
    width: ICON_BADGE_SIZE,
    height: ICON_BADGE_SIZE,
    borderRadius: CARD_BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
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
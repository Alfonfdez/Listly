import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { withAlpha } from '../utils/color';
import { ALPHA_TINT, BUTTON_BORDER_RADIUS, CARD_BORDER_RADIUS, PRESSED_OPACITY } from './componentStyles';
import FormField from './FormField';
import type { CollectionWithCounts } from '../database/types';
import type { IconName } from '../constants/types';

interface Props {
  label: string;
  noneLabel: string;
  selectedCollection: CollectionWithCounts | null;
  onPress: () => void;
}

const ICON_BADGE_SIZE = 36;

export default function CollectionSelectRow({ label, noneLabel, selectedCollection, onPress }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  return (
    <FormField label={label}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: c.surface, borderColor: c.border },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={selectedCollection ? `${label}: ${selectedCollection.name}` : `${label}: ${noneLabel}`}
      >
        <View
          style={[
            styles.iconBadge,
            selectedCollection
              ? { backgroundColor: withAlpha(selectedCollection.color, ALPHA_TINT) }
              : { backgroundColor: c.background, borderColor: c.border, borderWidth: 1 },
          ]}
        >
          <Ionicons
            name={selectedCollection ? (selectedCollection.icon as IconName) : 'albums-outline'}
            size={18}
            color={selectedCollection ? selectedCollection.color : c.textSecondary}
          />
        </View>
        <Text style={[styles.label, { color: c.text, fontSize: fs(15) }]} numberOfLines={1}>
          {selectedCollection ? selectedCollection.name : noneLabel}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={c.textSecondary} />
      </Pressable>
    </FormField>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  pressed: {
    opacity: PRESSED_OPACITY,
  },
});
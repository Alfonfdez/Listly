import { type ReactNode } from 'react';
import { Text, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useLabels } from '../hooks/useLabels';
import { ALPHA_TINT, ALPHA_BADGE } from './componentStyles';
import { NBSP } from '../constants/text';
import { ICONS } from '../constants/icons';
import { withAlpha } from '../utils/color';
import { isOn } from '../utils/flags';
import SortablePressable from './SortablePressable';
import type { Flag } from '../utils/flags';
import type { IconName } from '../constants/types';

interface TileShellProps {
  name: string;
  selectMode: boolean;
  selected: boolean;
  onPress: () => void;
  dropTarget?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

export function TileShell({
  name,
  selectMode,
  selected,
  onPress,
  dropTarget = false,
  accessibilityHint,
  style,
  children,
}: TileShellProps) {
  const { activeColors: c } = useConfig();
  const labels = useLabels();

  return (
    <SortablePressable
      style={[
        style,
        selectMode && selected && { borderColor: c.primary },
        selectMode && !selected && { borderColor: c.border },
        dropTarget && { borderColor: c.primary, backgroundColor: withAlpha(c.primary, ALPHA_TINT) },
      ]}
      onPress={onPress}
      accessibilityRole={selectMode ? 'checkbox' : undefined}
      accessibilityState={selectMode ? { checked: selected } : undefined}
      accessibilityLabel={selected ? `${name}, ${labels.select_selected(1)}` : name}
      accessibilityHint={accessibilityHint}
    >
      {children}
    </SortablePressable>
  );
}

interface TileNameProps {
  name: string;
  pinned: Flag;
  fontSize: number;
  starSize?: number;
  style?: StyleProp<ViewStyle>;
}

export function TileName({ name, pinned, fontSize, starSize = 14, style }: TileNameProps) {
  const { activeColors: c } = useConfig();
  const labels = useLabels();

  return (
    <View style={[tileStyles.nameRow, style]}>
      <Text style={[tileStyles.name, { color: c.text, fontSize }]} numberOfLines={1}>
        {name}
      </Text>
      {isOn(pinned) ? (
        <Ionicons name="star" size={starSize} color={c.star} accessibilityLabel={labels.home_pinned} />
      ) : null}
    </View>
  );
}

interface TileCollectionProps {
  collection?: { name: string; color: string };
  reserveLine?: boolean;
}

export function TileCollection({ collection, reserveLine = false }: TileCollectionProps) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  if (!collection && !reserveLine) return null;

  const color = collection?.color ?? c.textSecondary;
  return (
    <View style={[tileStyles.collectionRow, !collection && tileStyles.collectionRowHidden]}>
      <Ionicons name={ICONS.collection} size={12} color={color} />
      <Text style={[tileStyles.collectionName, { color, fontSize: fs(12) }]} numberOfLines={1}>
        {collection?.name ?? NBSP}
      </Text>
    </View>
  );
}

const BADGE_SIZE = 40;

export function TileBadge({ icon, color }: { icon: string; color: string }) {
  return (
    <View style={tileStyles.badgeWrap}>
      <View style={[tileStyles.badge, { backgroundColor: withAlpha(color, ALPHA_BADGE) }]}>
        <Ionicons name={icon as IconName} size={22} color={color} />
      </View>
    </View>
  );
}

export const tileBadgeSize = BADGE_SIZE;


interface TileProgressProps {
  completed: number;
  total: number;
  fontSize: number;
}

export function TileProgress({ completed, total, fontSize }: TileProgressProps) {
  const { activeColors: c } = useConfig();
  const labels = useLabels();

  return (
    <Text style={[tileStyles.progress, { color: c.textSecondary, fontSize }]}>
      {labels.home_progress(completed, total)}
    </Text>
  );
}

export function TileIcon({ icon, color, size = 28 }: { icon: string; color: string; size?: number }) {
  return <Ionicons name={icon as IconName} size={size} color={color} />;
}

export const tileStyles = StyleSheet.create({
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  rowCheck: {
    position: 'absolute',
    top: -3,
    right: -3,
  },
  badgeWrap: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    position: 'relative',
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontWeight: '600',
    flexShrink: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'stretch',
  },
  collectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  collectionRowHidden: {
    opacity: 0,
  },
  collectionName: {
    fontWeight: '500',
  },
  progress: {
    fontWeight: '500',
  },
});

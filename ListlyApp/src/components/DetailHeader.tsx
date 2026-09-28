import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useLabels } from '../hooks/useLabels';
import { withAlpha } from '../utils/color';
import { formatMinor } from '../utils/numeric';
import { ALPHA_TINT, ALPHA_TRACK, HIT_SLOP } from './componentStyles';
import { ICONS } from '../constants/icons';
import type { IconName } from '../constants/types';

interface Props {
  icon: IconName;
  color: string;
  name: string;
  progressLabel: string;
  onEdit: () => void;
  editAccessibilityLabel: string;
  trailing?: ReactNode;
  progressPercent?: number;
  totals?: { all: number; done: number };
}

export default function DetailHeader({
  icon,
  color,
  name,
  progressLabel,
  onEdit,
  editAccessibilityLabel,
  trailing,
  progressPercent,
  totals,
}: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();

  return (
    <View style={styles.headerBlock}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: withAlpha(color, ALPHA_TINT) }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.name, { color, fontSize: fs(18) }]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: fs(13) }}>{progressLabel}</Text>
        </View>
        {trailing}
        <Pressable
          onPress={onEdit}
          style={styles.editButton}
          accessibilityRole="button"
          accessibilityLabel={editAccessibilityLabel}
          hitSlop={HIT_SLOP}
        >
          <Ionicons name={ICONS.edit} size={20} color={color} />
        </Pressable>
      </View>
      {progressPercent !== undefined ? (
        <View style={[styles.progressTrack, { backgroundColor: withAlpha(color, ALPHA_TRACK) }]}>
          <View style={[styles.progressFill, { backgroundColor: color, width: `${progressPercent}%` }]} />
        </View>
      ) : null}
      {totals ? (
        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: c.textSecondary, fontSize: fs(13) }]}>
              {labels.list_total_label}
            </Text>
            <Text
              style={[styles.totalValue, { color: c.text, fontSize: fs(14) }]}
              accessibilityLabel={`${labels.list_total_label}: ${formatMinor(totals.all)}`}
            >
              {formatMinor(totals.all)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: c.textSecondary, fontSize: fs(13) }]}>
              {labels.list_done_total_label}
            </Text>
            <Text
              style={[styles.totalValue, { color: c.text, fontSize: fs(14) }]}
              accessibilityLabel={`${labels.list_done_total_label}: ${formatMinor(totals.done)}`}
            >
              {formatMinor(totals.done)}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const ICON_BADGE_SIZE = 44;
const PROGRESS_BAR_HEIGHT = 6;

const styles = StyleSheet.create({
  headerBlock: {
    marginBottom: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: ICON_BADGE_SIZE,
    height: ICON_BADGE_SIZE,
    borderRadius: ICON_BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontWeight: '700',
  },
  editButton: {
    marginLeft: 'auto',
    padding: 6,
  },
  progressTrack: {
    height: PROGRESS_BAR_HEIGHT,
    borderRadius: PROGRESS_BAR_HEIGHT / 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: PROGRESS_BAR_HEIGHT,
    borderRadius: PROGRESS_BAR_HEIGHT / 2,
  },
  totalsBlock: {
    gap: 2,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontWeight: '500',
  },
  totalValue: {
    fontWeight: '700',
  },
});

import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useLabels } from '../hooks/useLabels';
import { withAlpha } from '../utils/color';
import { formatPercent2 } from '../utils/numeric';
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
  // Value-weighted progress for numeric lists (spec 034). Always present on a
  // numeric list (even 0.00 / 0.00 · 0.00 %), so the second bar never reflows;
  // absent only on standard lists.
  valueProgress?: { percent: number; doneText: string; totalText: string };
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
  valueProgress,
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
      {valueProgress ? (
        <View testID="value-bar-slot" style={styles.valueBarSlot}>
          <View
            style={styles.valueRow}
            accessibilityLabel={`${labels.list_value_progress_label}: ${valueProgress.doneText} / ${valueProgress.totalText}, ${formatPercent2(valueProgress.percent)} %`}
          >
            <Text style={[styles.valueNumbers, { color: c.textSecondary, fontSize: fs(12) }]}>
              {valueProgress.doneText} / {valueProgress.totalText}
            </Text>
            <Text style={[styles.valueNumbers, { color: c.textSecondary, fontSize: fs(12) }]}>
              {formatPercent2(valueProgress.percent)} %
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: withAlpha(color, ALPHA_TRACK) }]}>
            <View
              style={[styles.progressFill, { backgroundColor: color, width: `${valueProgress.percent}%` }]}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const ICON_BADGE_SIZE = 44;
const PROGRESS_BAR_HEIGHT = 6;
const VALUE_ROW_HEIGHT = 16;
// Caption row + gap + track, so the slot is exactly the value bar's height.
const VALUE_BAR_SLOT_HEIGHT = VALUE_ROW_HEIGHT + 4 + PROGRESS_BAR_HEIGHT;

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
  valueBarSlot: {
    minHeight: VALUE_BAR_SLOT_HEIGHT,
    gap: 4,
    justifyContent: 'flex-end',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueNumbers: {
    fontWeight: '500',
  },
});

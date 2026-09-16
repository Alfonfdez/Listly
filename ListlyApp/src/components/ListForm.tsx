import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { t } from '../i18n';
import { LIST_ICONS } from '../constants/listIcons';
import { DEBOUNCE_MS, MAX_LIST_NAME_LENGTH } from '../constants/types';
import type { IconName } from '../constants/types';
import type { ListNameError } from '../utils/validation';
import { validateListName } from '../utils/validation';
import { listRepository as listRepo } from '../database';
import { withAlpha } from '../utils/color';
import { useColorSelection } from '../hooks/useColorSelection';
import ColorGrid from './ColorGrid';
import ColorPickerModal from './ColorPickerModal';
import { BUTTON_BORDER_RADIUS } from './componentStyles';

interface Props {
  initialName: string;
  initialIcon: IconName;
  initialColor: string;
  heading: string;
  submitLabel: string;
  excludeId?: number;
  onSubmit: (data: { name: string; icon: IconName; color: string }) => Promise<void>;
}

export default function ListForm({
  initialName,
  initialIcon,
  initialColor,
  heading,
  submitLabel,
  excludeId,
  onSubmit,
}: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = t();

  const [name, setName] = useState(initialName);
  const [icon, setIcon] = useState<IconName>(initialIcon);
  const [pickerVisible, setPickerVisible] = useState(false);
  const { selectedColor, customColor, handleColorSelect } = useColorSelection(initialColor);
  const [error, setError] = useState<ListNameError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const requestSeq = useRef(0);

  useEffect(() => {
    const trimmed = name.trim();
    const seq = ++requestSeq.current;
    setError(validateListName(trimmed, false, MAX_LIST_NAME_LENGTH));
    if (trimmed.length === 0 || trimmed.length > MAX_LIST_NAME_LENGTH) return;

    const handle = setTimeout(() => {
      void listRepo.existsByName(trimmed, excludeId).then(exists => {
        if (requestSeq.current !== seq) return;
        setError(validateListName(trimmed, exists, MAX_LIST_NAME_LENGTH));
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [name, excludeId]);

  const trimmed = name.trim();
  const canSubmit = error === null && trimmed.length > 0 && !submitting;

  const submit = async () => {
    if (submitting) return;
    if (error !== null || trimmed.length === 0) return;
    setSubmitting(true);
    try {
      const exists = await listRepo.existsByName(trimmed, excludeId);
      if (exists) {
        setError('list_name_duplicate');
        return;
      }
      await onSubmit({ name: trimmed, icon: icon ?? initialIcon, color: selectedColor ?? initialColor });
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    borderWidth: 1,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: c.surface,
    borderColor: c.border,
    color: c.text,
    fontSize: fs(15),
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={[styles.heading, { color: c.text, fontSize: fs(16) }]}>{heading}</Text>

      <Text style={[styles.label, { color: c.textSecondary, fontSize: fs(13) }]}>
        {labels.list_name_label}
      </Text>
      <TextInput
        value={name}
        onChangeText={setName}
        maxLength={MAX_LIST_NAME_LENGTH}
        placeholder={labels.list_name_label}
        placeholderTextColor={c.textSecondary}
        style={inputStyle}
        accessibilityLabel={labels.list_name_label}
      />
      {error ? (
        <Text style={[styles.errorText, { color: c.red, fontSize: fs(12) }]}>{labels[error]}</Text>
      ) : null}

      <Text style={[styles.label, { color: c.textSecondary, fontSize: fs(13) }]}>
        {labels.list_icon_label}
      </Text>
      <View style={styles.grid}>
        {LIST_ICONS.map(option => {
          const selected = option === icon;
          return (
            <Pressable
              key={option}
              onPress={() => setIcon(option)}
              accessibilityRole="button"
              accessibilityLabel={option}
              accessibilityState={{ selected }}
              style={[
                styles.iconOption,
                {
                  borderColor: selected ? c.primary : 'transparent',
                  backgroundColor: selected ? withAlpha(c.primary, 15) : c.surface,
                },
              ]}
            >
              <Ionicons name={option} size={20} color={selected ? c.primary : c.text} />
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, { color: c.textSecondary, fontSize: fs(13) }]}>
        {labels.list_color_label}
      </Text>
      <ColorGrid
        selectedColor={selectedColor}
        customColor={customColor}
        onSelect={handleColorSelect}
        onOpenPicker={() => setPickerVisible(true)}
      />
      <ColorPickerModal
        visible={pickerVisible}
        selectedColor={selectedColor}
        onSelect={handleColorSelect}
        onClose={() => setPickerVisible(false)}
      />

      <Pressable
        style={({ pressed }) => [
          styles.createButton,
          { backgroundColor: c.primary },
          (!canSubmit || pressed) && styles.pressed,
          !canSubmit && styles.disabled,
        ]}
        disabled={!canSubmit}
        onPress={() => void submit()}
        accessibilityRole="button"
        accessibilityLabel={submitLabel}
        accessibilityState={{ disabled: !canSubmit }}
      >
        <Text style={[styles.createButtonText, { color: '#FFFFFF', fontSize: fs(15) }]}>
          {submitLabel}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  heading: {
    fontWeight: '700',
    marginBottom: 4,
  },
  label: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    marginTop: 28,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingVertical: 12,
    alignItems: 'center',
  },
  createButtonText: {
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
});
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useLabels } from '../hooks/useLabels';
import { LIST_ICONS } from '../constants/listIcons';
import { DEBOUNCE_MS, type IconName } from '../constants/types';
import type { Translations } from '../i18n/en';
import { useColorSelection } from '../hooks/useColorSelection';
import ColorGrid from './ColorGrid';
import ColorPickerModal from './ColorPickerModal';
import FormField from './FormField';
import IconGrid from './IconGrid';
import { BUTTON_BORDER_RADIUS, PRESSED_OPACITY, DISABLED_OPACITY } from './componentStyles';

type StringTranslationKey = {
  [K in keyof Translations]: Translations[K] extends string ? K : never;
}[keyof Translations];

interface Props<TError extends StringTranslationKey> {
  initialName: string;
  initialIcon: IconName;
  initialColor: string;
  submitLabel: string;
  nameLabel: string;
  iconLabel: string;
  colorLabel: string;
  maxNameLength: number;
  excludeId?: number;
  validate: (value: string, exists: boolean, maxLength: number) => TError | null;
  duplicateError: TError;
  existsByName: (name: string, excludeId?: number) => Promise<boolean>;
  deleteLabel?: string;
  onDelete?: () => void;
  middleLabel?: string;
  onMiddle?: () => void;
  onSubmit: (data: { name: string; icon: IconName; color: string }) => Promise<void>;
}

export default function EntityForm<TError extends StringTranslationKey>({
  initialName,
  initialIcon,
  initialColor,
  submitLabel,
  nameLabel,
  iconLabel,
  colorLabel,
  maxNameLength,
  excludeId,
  validate,
  duplicateError,
  existsByName,
  deleteLabel,
  onDelete,
  middleLabel,
  onMiddle,
  onSubmit,
}: Props<TError>) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();

  const [name, setName] = useState(initialName);
  const [icon, setIcon] = useState<IconName>(initialIcon);
  const [pickerVisible, setPickerVisible] = useState(false);
  const { selectedColor, customColor, handleColorSelect } = useColorSelection(initialColor);
  const [error, setError] = useState<TError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const requestSeq = useRef(0);

  useEffect(() => {
    const trimmed = name.trim();
    const seq = ++requestSeq.current;
    setError(validate(trimmed, false, maxNameLength));
    if (trimmed.length === 0 || trimmed.length > maxNameLength) return;

    const handle = setTimeout(() => {
      void existsByName(trimmed, excludeId).then(exists => {
        if (requestSeq.current !== seq) return;
        setError(validate(trimmed, exists, maxNameLength));
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [name, excludeId, validate, existsByName, maxNameLength]);

  const trimmed = name.trim();
  const canSubmit = error === null && trimmed.length > 0 && !submitting;

  const submit = async () => {
    if (submitting) return;
    if (error !== null || trimmed.length === 0) return;
    setSubmitting(true);
    try {
      const exists = await existsByName(trimmed, excludeId);
      if (exists) {
        setError(duplicateError);
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
      <FormField label={nameLabel} error={error ? labels[error] : null} style={styles.field}>
        <TextInput
          value={name}
          onChangeText={setName}
          maxLength={maxNameLength}
          placeholder={nameLabel}
          placeholderTextColor={c.textSecondary}
          style={inputStyle}
          accessibilityLabel={nameLabel}
        />
      </FormField>

      <FormField label={iconLabel} style={styles.field}>
        <IconGrid options={LIST_ICONS} selected={icon} onSelect={setIcon} />
      </FormField>

      <FormField label={colorLabel} style={styles.field}>
        <ColorGrid
          selectedColor={selectedColor}
          customColor={customColor}
          onSelect={handleColorSelect}
          onOpenPicker={() => setPickerVisible(true)}
        />
      </FormField>
      <ColorPickerModal
        visible={pickerVisible}
        selectedColor={selectedColor}
        onSelect={handleColorSelect}
        onClose={() => setPickerVisible(false)}
      />

      {deleteLabel && onDelete ? (
        <Pressable
          onPress={onDelete}
          style={({ pressed }) => [
            styles.deleteButton,
            { borderColor: c.red },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={deleteLabel}
        >
          <Text style={[styles.deleteButtonText, { color: c.red, fontSize: fs(15) }]}>
            {deleteLabel}
          </Text>
        </Pressable>
      ) : null}

      {middleLabel && onMiddle ? (
        <Pressable
          onPress={onMiddle}
          style={({ pressed }) => [
            styles.middleButton,
            { borderColor: c.primary, marginTop: deleteLabel && onDelete ? 16 : 28 },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={middleLabel}
        >
          <Text style={[styles.middleButtonText, { color: c.primary, fontSize: fs(15) }]}>
            {middleLabel}
          </Text>
        </Pressable>
      ) : null}

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
        <Text style={[styles.createButtonText, { color: c.background, fontSize: fs(15) }]}>
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
  field: {
    marginTop: 16,
  },
  createButton: {
    marginTop: 16,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteButton: {
    marginTop: 28,
    borderRadius: BUTTON_BORDER_RADIUS,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontWeight: '600',
  },
  middleButton: {
    borderRadius: BUTTON_BORDER_RADIUS,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  middleButtonText: {
    fontWeight: '600',
  },
  createButtonText: {
    fontWeight: '600',
  },
  pressed: {
    opacity: PRESSED_OPACITY,
  },
  disabled: {
    opacity: DISABLED_OPACITY,
  },
});

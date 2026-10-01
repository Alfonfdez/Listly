import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useLabels } from '../hooks/useLabels';
import { useItemDisplayFlags } from '../hooks/useItemDisplayFlags';
import { BUTTON_BORDER_RADIUS, PRESSED_OPACITY, DISABLED_OPACITY } from './componentStyles';
import { useItemDraft, type ItemDraftSeed } from '../hooks/useItemDraft';
import { ItemAmountField, ItemNameField, ItemNoteField, ItemQuantityField } from './ItemFields';
import ItemPhotosField from './ItemPhotosField';
import ModalShell from './ModalShell';
import FormField from './FormField';

interface Props {
  visible: boolean;
  title: string;
  initialName: string;
  initialNote: string;
  initialPhotos: string[];
  existingNames: ReadonlySet<string>;
  allowDelete: boolean;
  numeric?: boolean;
  photosAllowed?: boolean;
  initialAmountMinor?: number | null;
  initialQuantity?: number;
  onCancel: () => void;
  onSave: (name: string, note: string | null, photos: string[], amountMinor: number | null, quantity: number) => void;
  onDelete: () => void;
}

export default function ItemFormModal({
  visible,
  title,
  initialName,
  initialNote,
  initialPhotos,
  existingNames,
  allowDelete,
  numeric = false,
  photosAllowed = true,
  initialAmountMinor = null,
  initialQuantity = 0,
  onCancel,
  onSave,
  onDelete,
}: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();
  const flags = useItemDisplayFlags(numeric);
  const showPhotos = flags.editShowPhotos && photosAllowed;

  const draft = useItemDraft({ existingNames, numeric, validateOnChange: true });
  const { applySeed } = draft;
  const [confirmDelete, setConfirmDelete] = useState(false);

  const initialRef = useRef<ItemDraftSeed>({
    name: initialName,
    note: initialNote,
    photos: initialPhotos,
    amountMinor: initialAmountMinor,
    quantity: initialQuantity,
  });
  initialRef.current = {
    name: initialName,
    note: initialNote,
    photos: initialPhotos,
    amountMinor: initialAmountMinor,
    quantity: initialQuantity,
  };

  useEffect(() => {
    if (!visible) return;
    applySeed(initialRef.current);
    setConfirmDelete(false);
  }, [visible, applySeed]);

  const submit = () => {
    if (draft.validate()) return;
    const payload = draft.buildPayload();
    onSave(
      payload.name,
      payload.note,
      photosAllowed ? payload.photos : [],
      payload.amountMinor,
      payload.quantity
    );
  };

  const canSave = draft.error === null && draft.name.trim().length > 0;

  return (
    <ModalShell
      visible={visible}
      onClose={onCancel}
      maxWidth={400}
      padding={16}
      overlayPadding={24}
      maxHeight="90%"
      style={styles.content}
    >
      <Text style={[styles.title, { color: c.text, fontSize: fs(18) }]}>{title}</Text>

      <FormField label={labels.item_name_label} error={draft.error ? labels[draft.error] : null}>
        <ItemNameField
          value={draft.name}
          onChangeText={draft.onNameChange}
          placeholder={labels.item_name_label}
          accessibilityLabel={labels.item_name_label}
          style={[styles.input, { backgroundColor: c.background, borderColor: c.border }]}
        />
      </FormField>

      {numeric ? (
        <View style={styles.numericRow}>
          <FormField label={labels.item_amount_label}>
            <ItemAmountField
              value={draft.amount}
              onChangeText={draft.onAmountChange}
              onFocus={draft.onAmountFocus}
              onBlur={draft.onAmountBlur}
              style={[styles.input, styles.amountInput, { backgroundColor: c.background, borderColor: c.border }]}
            />
          </FormField>
          <FormField label={labels.item_quantity_label}>
            <ItemQuantityField value={draft.quantity} onChange={draft.setQuantity} />
          </FormField>
        </View>
      ) : null}

      {flags.editShowNotes ? (
        <FormField label={labels.item_note_label}>
          <ItemNoteField
            value={draft.note}
            onChangeText={draft.setNote}
            numberOfLines={3}
            style={[styles.input, styles.noteInput, { backgroundColor: c.background, borderColor: c.border }]}
          />
        </FormField>
      ) : null}

      {showPhotos ? (
        <View style={styles.photoSection}>
          <ItemPhotosField
            photos={draft.photos}
            onTakePhoto={draft.handleTakePhoto}
            onPickFromGallery={draft.handlePickFromGallery}
            onRemovePhoto={draft.handleRemovePhoto}
          />
        </View>
      ) : null}

      {confirmDelete ? (
        <View style={styles.confirmBlock}>
          <Text style={[styles.title, { color: c.text, fontSize: fs(15) }]}>{labels.item_confirm_delete}</Text>
          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [styles.button, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }, pressed && styles.pressed]}
              onPress={() => setConfirmDelete(false)}
              accessibilityRole="button"
              accessibilityLabel={labels.common_cancel}
            >
              <Text style={[styles.buttonText, { color: c.text, fontSize: fs(15) }]}>{labels.common_cancel}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.button, { backgroundColor: c.red }, pressed && styles.pressed]}
              onPress={onDelete}
              accessibilityRole="button"
              accessibilityLabel={labels.item_delete}
            >
              <Text style={[styles.buttonText, { color: c.background, fontSize: fs(15) }]}>{labels.item_delete}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.buttonRow}>
            {allowDelete ? (
              <Pressable
                style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
                onPress={() => setConfirmDelete(true)}
                accessibilityRole="button"
                accessibilityLabel={labels.item_delete}
              >
                <Text style={[styles.destructiveText, { color: c.red, fontSize: fs(15) }]}>{labels.item_delete}</Text>
              </Pressable>
            ) : (
              <View />
            )}
            <View style={styles.buttonRowRight}>
              <Pressable
                style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
                onPress={onCancel}
                accessibilityRole="button"
                accessibilityLabel={labels.common_cancel}
              >
                <Text style={[styles.buttonText, { color: c.textSecondary, fontSize: fs(15) }]}>{labels.common_cancel}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.button, { backgroundColor: c.primary }, (!canSave || pressed) && styles.pressed, !canSave && styles.disabled]}
                disabled={!canSave}
                onPress={submit}
                accessibilityRole="button"
                accessibilityLabel={labels.item_save}
              >
                <Text style={[styles.buttonText, { color: c.background, fontSize: fs(15) }]}>{labels.item_save}</Text>
              </Pressable>
            </View>
          </View>
        </>
      )}
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 8,
  },
  title: {
    fontWeight: '700',
  },
  input: {
    paddingVertical: 10,
  },
  noteInput: {
    minHeight: 72,
  },
  numericRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  amountInput: {
    minWidth: 100,
  },
  photoSection: {
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  buttonRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  button: {
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '600',
  },
  destructiveText: {
    fontWeight: '600',
  },
  pressed: {
    opacity: PRESSED_OPACITY,
  },
  disabled: {
    opacity: DISABLED_OPACITY,
  },
  confirmBlock: {
    marginTop: 12,
    gap: 12,
  },
});

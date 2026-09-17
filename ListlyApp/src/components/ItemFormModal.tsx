import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { t } from '../i18n';
import { BUTTON_BORDER_RADIUS, PRESSED_OPACITY, DISABLED_OPACITY } from './componentStyles';
import { validateItemName, type ItemNameError } from '../utils/validation';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '../constants/types';
import { useItemPhotos } from '../hooks/useItemPhotos';
import ModalShell from './ModalShell';
import PhotoSection from './PhotoSection';
import CharCounter from './CharCounter';
import FormField from './FormField';

interface Props {
  visible: boolean;
  title: string;
  initialName: string;
  initialNote: string;
  initialPhotos: string[];
  existingNames: ReadonlySet<string>;
  allowDelete: boolean;
  onCancel: () => void;
  onSave: (name: string, note: string | null, photos: string[]) => void;
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
  onCancel,
  onSave,
  onDelete,
}: Props) {
  const { activeColors: c, config } = useConfig();
  const fs = useFontSize();
  const labels = t();

  const [name, setName] = useState(initialName);
  const [note, setNote] = useState(initialNote);
  const [error, setError] = useState<ItemNameError | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { photos, setPhotos, handleTakePhoto, handlePickFromGallery, handleRemovePhoto } = useItemPhotos(initialPhotos);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setNote(initialNote);
      setPhotos(initialPhotos);
      setError(null);
      setConfirmDelete(false);
    }
  }, [visible, initialName, initialNote, initialPhotos, setPhotos]);

  const onNameChange = (value: string) => {
    setName(value);
    setError(validateItemName(value, existingNames));
  };

  const submit = () => {
    const err = validateItemName(name, existingNames);
    if (err) {
      setError(err);
      return;
    }
    onSave(name.trim(), note.trim() ? note.trim() : null, photos);
  };

  const canSave = error === null && name.trim().length > 0;

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

      <FormField
        label={labels.item_name_label}
        error={error ? labels[error] : null}
      >
        <TextInput
          value={name}
          onChangeText={onNameChange}
          maxLength={MAX_ITEM_NAME_LENGTH}
          placeholder={labels.item_name_label}
          placeholderTextColor={c.textSecondary}
          style={[
            styles.input,
            { backgroundColor: c.background, borderColor: c.border, color: c.text, fontSize: fs(15) },
          ]}
          accessibilityLabel={labels.item_name_label}
        />
        <CharCounter current={name.length} max={MAX_ITEM_NAME_LENGTH} />
      </FormField>

      {config.showNotes ? (
        <FormField label={labels.item_note_label}>
          <TextInput
            value={note}
            onChangeText={setNote}
            maxLength={MAX_ITEM_NOTE_LENGTH}
            placeholder={labels.item_note_label}
            placeholderTextColor={c.textSecondary}
            multiline
            numberOfLines={3}
            style={[
              styles.input,
              styles.noteInput,
              { backgroundColor: c.background, borderColor: c.border, color: c.text, fontSize: fs(15) },
            ]}
            accessibilityLabel={labels.item_note_label}
          />
          <CharCounter current={note.length} max={MAX_ITEM_NOTE_LENGTH} />
        </FormField>
      ) : null}

      {config.showPhotos ? (
        <View style={styles.photoSection}>
          <PhotoSection
            photos={photos}
            onTakePhoto={() => void handleTakePhoto()}
            onPickFromGallery={() => void handlePickFromGallery()}
            onRemovePhoto={uri => void handleRemovePhoto(uri)}
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
    borderWidth: 1,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noteInput: {
    minHeight: 72,
    textAlignVertical: 'top',
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

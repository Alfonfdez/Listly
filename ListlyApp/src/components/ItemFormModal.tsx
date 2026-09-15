import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { t } from '../i18n';
import { BUTTON_BORDER_RADIUS } from './componentStyles';
import { validateItemName, type ItemNameError } from '../utils/validation';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '../constants/types';
import { useItemPhotos } from '../hooks/useItemPhotos';
import PhotoSection from './PhotoSection';

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
  const { activeColors: c } = useConfig();
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: c.surface }]}>
          <Text style={[styles.title, { color: c.text, fontSize: fs(18) }]}>{title}</Text>

          <Text style={[styles.label, { color: c.textSecondary, fontSize: fs(13) }]}>
            {labels.item_name_label}
          </Text>
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
          {error ? (
            <Text style={[styles.errorText, { color: c.red, fontSize: fs(12) }]}>{labels[error]}</Text>
          ) : null}

          <Text style={[styles.label, { color: c.textSecondary, fontSize: fs(13) }]}>
            {labels.item_note_label}
          </Text>
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

          <View style={styles.photoSection}>
            <PhotoSection
              photos={photos}
              onTakePhoto={() => void handleTakePhoto()}
              onPickFromGallery={() => void handlePickFromGallery()}
              onRemovePhoto={uri => void handleRemovePhoto(uri)}
            />
          </View>

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
                  <Text style={[styles.buttonText, { color: '#FFFFFF', fontSize: fs(15) }]}>{labels.item_delete}</Text>
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
                    <Text style={[styles.buttonText, { color: '#FFFFFF', fontSize: fs(15) }]}>{labels.item_save}</Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  title: {
    fontWeight: '700',
  },
  label: {
    marginTop: 4,
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
  errorText: {
    marginTop: -2,
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
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
  confirmBlock: {
    marginTop: 12,
    gap: 12,
  },
});
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { itemRepository as itemRepo } from '../database';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useLabels } from '../hooks/useLabels';
import { useItemPhotos } from '../hooks/useItemPhotos';
import { validateItemName, type ItemNameError } from '../utils/validation';
import { serializeItemPhotos } from '../utils/itemPhotos';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '../constants/types';
import PhotoSection from './PhotoSection';
import CharCounter from './CharCounter';
import { BUTTON_BORDER_RADIUS, PRESSED_OPACITY } from './componentStyles';

interface Props {
  listId: number;
  existingNames: ReadonlySet<string>;
  position: number;
  onAdded: () => void | Promise<void>;
}

export default function AddItemBar({ listId, existingNames, position, onAdded }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();

  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [error, setError] = useState<ItemNameError | null>(null);
  const { photos, setPhotos, handleTakePhoto, handlePickFromGallery, handleRemovePhoto } = useItemPhotos();

  const submit = async () => {
    const err = validateItemName(name, existingNames);
    if (err) {
      setError(err);
      return;
    }
    try {
      await itemRepo.create({
        list_id: listId,
        name: name.trim(),
        note: note.trim() || null,
        pictures: serializeItemPhotos(photos),
        checked: 0,
        position,
      });
      setName('');
      setNote('');
      setPhotos([]);
      setNoteExpanded(false);
      setError(null);
    } catch (err) {
      console.error('Failed to add item:', err);
    }
    await onAdded();
  };

  return (
    <View style={styles.addRow}>
      {error ? (
        <Text style={[styles.errorText, { color: c.red, fontSize: fs(12) }]}>{labels[error]}</Text>
      ) : null}
      <View style={styles.inputRow}>
        <View style={styles.nameColumn}>
          <TextInput
            value={name}
            onChangeText={value => {
              setName(value);
              setError(null);
            }}
            maxLength={MAX_ITEM_NAME_LENGTH}
            placeholder={labels.item_add_placeholder}
            placeholderTextColor={c.textSecondary}
            returnKeyType="done"
            onSubmitEditing={() => void submit()}
            style={[
              styles.input,
              { backgroundColor: c.surface, borderColor: c.border, color: c.text, fontSize: fs(15) },
            ]}
            accessibilityLabel={labels.item_add_placeholder}
          />
          <CharCounter current={name.length} max={MAX_ITEM_NAME_LENGTH} />
        </View>
        <TouchableOpacity
          onPress={() => setNoteExpanded(prev => !prev)}
          style={[styles.noteToggle, { backgroundColor: c.surface, borderColor: c.border }]}
          accessibilityRole="button"
          accessibilityLabel={labels.item_add_note_toggle}
        >
          <Ionicons
            name="chevron-down"
            size={18}
            color={c.textSecondary}
            style={noteExpanded ? styles.chevronOpen : undefined}
          />
        </TouchableOpacity>
        <Pressable
          style={({ pressed }) => [styles.addButton, { backgroundColor: c.primary }, pressed && styles.pressed]}
          onPress={() => void submit()}
          accessibilityRole="button"
          accessibilityLabel={labels.item_add}
        >
          <Ionicons name="add" size={20} color={c.background} />
          <Text style={[styles.addButtonText, { color: c.background, fontSize: fs(15) }]}>{labels.item_add}</Text>
        </Pressable>
      </View>
      {noteExpanded ? (
        <>
          <TextInput
            value={note}
            onChangeText={setNote}
            maxLength={MAX_ITEM_NOTE_LENGTH}
            placeholder={labels.item_note_label}
            placeholderTextColor={c.textSecondary}
            multiline
            textAlignVertical="top"
            style={[
              styles.input,
              styles.noteInput,
              { backgroundColor: c.surface, borderColor: c.border, color: c.text, fontSize: fs(15) },
            ]}
            accessibilityLabel={labels.item_note_label}
          />
          <CharCounter current={note.length} max={MAX_ITEM_NOTE_LENGTH} />
        </>
      ) : null}
      {noteExpanded ? (
        <PhotoSection
          photos={photos}
          onTakePhoto={() => void handleTakePhoto()}
          onPickFromGallery={() => void handlePickFromGallery()}
          onRemovePhoto={uri => void handleRemovePhoto(uri)}
        />
      ) : null}
    </View>
  );
}

const ADD_ROW_HEIGHT = 40;

const styles = StyleSheet.create({
  addRow: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  nameColumn: {
    flex: 1,
  },
  input: {
    height: ADD_ROW_HEIGHT,
    borderWidth: 1,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingHorizontal: 12,
    textAlignVertical: 'center',
  },
  noteToggle: {
    height: ADD_ROW_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingHorizontal: 10,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  noteInput: {
    minHeight: 64,
    paddingTop: 10,
  },
  addButton: {
    height: ADD_ROW_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingHorizontal: 14,
  },
  addButtonText: {
    fontWeight: '600',
  },
  errorText: {
    paddingHorizontal: 4,
  },
  pressed: {
    opacity: PRESSED_OPACITY,
  },
});

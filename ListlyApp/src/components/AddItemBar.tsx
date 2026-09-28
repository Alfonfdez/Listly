import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { itemRepository as itemRepo } from '../database';
import { logError, ERROR_SCOPE } from '../utils/errors';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useLabels } from '../hooks/useLabels';
import { useItemPhotos } from '../hooks/useItemPhotos';
import { validateItemName, type ItemNameError } from '../utils/validation';
import { serializeItemPhotos } from '../utils/itemPhotos';
import { clampQuantity, formatMinor, lineTotalMinor, parseAmountInput } from '../utils/numeric';
import { DEFAULT_QUANTITY, MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '../constants/types';
import PhotoSection from './PhotoSection';
import CharCounter from './CharCounter';
import QuantityStepper from './QuantityStepper';
import { BUTTON_BORDER_RADIUS, PRESSED_OPACITY } from './componentStyles';

interface Props {
  listId: number;
  existingNames: ReadonlySet<string>;
  position: number;
  numeric?: boolean;
  onAdded: () => void | Promise<void>;
}

export default function AddItemBar({ listId, existingNames, position, numeric = false, onAdded }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();

  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState(DEFAULT_QUANTITY);
  const [error, setError] = useState<ItemNameError | null>(null);
  const { photos, setPhotos, handleTakePhoto, handlePickFromGallery, handleRemovePhoto } = useItemPhotos();

  const amountMinor = parseAmountInput(amount);

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
        amount_minor: numeric ? amountMinor : null,
        quantity: numeric ? clampQuantity(quantity) : 0,
      });
      setName('');
      setNote('');
      setPhotos([]);
      setNoteExpanded(false);
      setAmount('');
      setQuantity(DEFAULT_QUANTITY);
      setError(null);
    } catch (err) {
      logError(ERROR_SCOPE.addItem, err);
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
      {numeric ? (
        <View style={styles.numericRow}>
          <TextInput
            value={amount}
            onChangeText={text => setAmount(text)}
            keyboardType="decimal-pad"
            placeholder={labels.item_amount_label}
            placeholderTextColor={c.textSecondary}
            style={[
              styles.input,
              styles.amountInput,
              { backgroundColor: c.surface, borderColor: c.border, color: c.text, fontSize: fs(15) },
            ]}
            accessibilityLabel={labels.item_amount_label}
          />
          <QuantityStepper
            value={quantity}
            onChange={setQuantity}
            label={labels.item_quantity_label}
            decrementLabel={`${labels.item_quantity_label} -`}
            incrementLabel={`${labels.item_quantity_label} +`}
          />
          <Text
            style={[styles.lineTotal, { color: c.text, fontSize: fs(15) }]}
            accessibilityLabel={`${labels.item_line_total_label}: ${formatMinor(lineTotalMinor(amountMinor, quantity))}`}
          >
            {formatMinor(lineTotalMinor(amountMinor, quantity))}
          </Text>
        </View>
      ) : null}
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
  numericRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  amountInput: {
    flex: 1,
  },
  lineTotal: {
    fontWeight: '700',
    minWidth: 56,
    textAlign: 'right',
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

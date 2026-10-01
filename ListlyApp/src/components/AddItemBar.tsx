import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { itemRepo } from '../database';
import { logError, ERROR_SCOPE } from '../utils/errors';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useLabels } from '../hooks/useLabels';
import { useItemDraft } from '../hooks/useItemDraft';
import { useItemDisplayFlags } from '../hooks/useItemDisplayFlags';
import { serializeItemPhotos } from '../utils/itemPhotos';
import { ItemAmountField, ItemLineTotal, ItemNameField, ItemNoteField, ItemQuantityField } from './ItemFields';
import ItemPhotosField from './ItemPhotosField';
import { BUTTON_BORDER_RADIUS, PRESSED_OPACITY } from './componentStyles';

interface Props {
  listId: number;
  existingNames: ReadonlySet<string>;
  position: number;
  numeric?: boolean;
  photosAllowed?: boolean;
  onAdded: () => void | Promise<void>;
  onSubmitOverride?: (data: {
    name: string;
    note: string | null;
    pictures: string | null;
    amount_minor: number | null;
    quantity: number;
  }) => Promise<void>;
}

export default function AddItemBar({
  listId,
  existingNames,
  position,
  numeric = false,
  photosAllowed = true,
  onAdded,
  onSubmitOverride,
}: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();
  const flags = useItemDisplayFlags(numeric);
  const showPhotos = flags.showPhotos && photosAllowed;

  const draft = useItemDraft({ existingNames, numeric });
  const [noteExpanded, setNoteExpanded] = useState(false);
  const canAddDetails = flags.showNotes || showPhotos;

  useEffect(() => {
    if (!canAddDetails) setNoteExpanded(false);
  }, [canAddDetails]);

  const submit = async () => {
    if (draft.validate()) return;
    const payload = draft.buildPayload();
    try {
      const data = {
        name: payload.name,
        note: payload.note,
        pictures: photosAllowed ? serializeItemPhotos(payload.photos) : null,
        amount_minor: payload.amountMinor,
        quantity: payload.quantity,
      };
      if (onSubmitOverride) {
        await onSubmitOverride(data);
      } else {
        await itemRepo.create({ list_id: listId, checked: 0, position, ...data });
      }
      draft.reset();
      setNoteExpanded(false);
    } catch (err) {
      logError(ERROR_SCOPE.addItem, err);
    }
    await onAdded();
  };

  return (
    <View style={styles.addRow}>
      {draft.error ? (
        <Text style={[styles.errorText, { color: c.red, fontSize: fs(12) }]}>{labels[draft.error]}</Text>
      ) : null}
      <View style={styles.inputRow}>
        <View style={styles.nameColumn}>
          <ItemNameField
            value={draft.name}
            onChangeText={draft.onNameChange}
            placeholder={labels.item_add_placeholder}
            accessibilityLabel={labels.item_add_placeholder}
            returnKeyType="done"
            onSubmitEditing={() => void submit()}
            style={[styles.input, { backgroundColor: c.surface, borderColor: c.border }]}
          />
        </View>
        {canAddDetails ? (
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
        ) : null}
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
          <ItemAmountField
            value={draft.amount}
            onChangeText={draft.onAmountChange}
            onFocus={draft.onAmountFocus}
            onBlur={draft.onAmountBlur}
            style={[styles.input, styles.amountInput, { backgroundColor: c.surface, borderColor: c.border }]}
          />
          <ItemQuantityField value={draft.quantity} onChange={draft.setQuantity} />
          <ItemLineTotal
            amountMinor={draft.amountMinor}
            quantity={draft.quantity}
            fontSize={fs(15)}
            style={styles.lineTotal}
          />
        </View>
      ) : null}
      {noteExpanded && canAddDetails ? (
        <>
          {flags.showNotes ? (
            <ItemNoteField
              value={draft.note}
              onChangeText={draft.setNote}
              style={[styles.input, styles.noteInput, { backgroundColor: c.surface, borderColor: c.border }]}
            />
          ) : null}
          {showPhotos ? (
            <ItemPhotosField
              photos={draft.photos}
              onTakePhoto={draft.handleTakePhoto}
              onPickFromGallery={draft.handlePickFromGallery}
              onRemovePhoto={draft.handleRemovePhoto}
            />
          ) : null}
        </>
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

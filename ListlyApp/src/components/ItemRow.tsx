import { memo, useState } from 'react';
import { Image, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { t } from '../i18n';
import { BUTTON_BORDER_RADIUS } from './componentStyles';
import type { Item } from '../database/types';
import { MAX_ITEM_PICTURES } from '../constants/types';
import { parseItemPhotos } from '../utils/itemPhotos';
import SortablePressable from './SortablePressable';
import NoteViewer from './NoteViewer';
import PhotoViewer from './PhotoViewer';

interface Props {
  item: Item;
  selectMode: boolean;
  selected: boolean;
  onToggle: () => void;
  onEdit: () => void;
}

function ItemRowInner({ item, selectMode, selected, onToggle, onEdit }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = t();
  const isDone = item.checked === 1;
  const photos = parseItemPhotos(item.pictures);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [noteViewerVisible, setNoteViewerVisible] = useState(false);

  const checkbox = selectMode ? (
    <View style={[styles.check, selected ? { backgroundColor: c.primary } : { borderColor: c.border }]}>
      {selected ? <Ionicons name="checkmark" size={12} color={c.background} /> : null}
    </View>
  ) : (
    <Ionicons
      name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
      size={24}
      color={isDone ? c.green : c.border}
      style={styles.checkbox}
    />
  );

  return (
    <SortablePressable
      style={[
        styles.row,
        { backgroundColor: c.surface },
        selectMode && selected && { backgroundColor: c.primary + '15' },
      ]}
      onPress={onToggle}
      activeOpacity={0.7}
      accessibilityRole={selectMode ? 'checkbox' : 'checkbox'}
      accessibilityState={selectMode ? { checked: selected } : { checked: isDone }}
      accessibilityLabel={item.name}
    >
      {checkbox}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text
            style={[
              styles.name,
              {
                color: isDone ? c.textSecondary : c.text,
                fontSize: fs(16),
                textDecorationLine: isDone && !selectMode ? 'line-through' : 'none',
              },
            ]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {item.note ? (
            <Ionicons name="document-text-outline" size={16} color={c.textSecondary} style={styles.noteIcon} />
          ) : null}
          {!selectMode ? (
            <SortablePressable
              style={styles.editButton}
              onPress={onEdit}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={labels.item_edit_title}
              hitSlop={8}
            >
              <Ionicons name="pencil-outline" size={18} color={c.textSecondary} />
            </SortablePressable>
          ) : null}
        </View>
        {item.note && !selectMode ? (
          <SortablePressable
            onPress={() => setNoteViewerVisible(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={labels.item_note_preview}
            hitSlop={4}
          >
            <Text
              style={[styles.notePreview, { color: c.textSecondary, fontSize: fs(13) }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.note}
            </Text>
          </SortablePressable>
        ) : null}
        {photos.length > 0 && !selectMode ? (
          <View style={styles.thumbRow}>
            {photos.slice(0, MAX_ITEM_PICTURES).map((uri, index) => (
              <SortablePressable
                key={`${uri}-${index}`}
                style={styles.thumb}
                onPress={() => setViewerIndex(index)}
                activeOpacity={0.7}
                accessibilityRole="imagebutton"
                accessibilityLabel={labels.item_photos_title}
                hitSlop={8}
              >
                <Image source={{ uri }} style={styles.thumbImage} />
              </SortablePressable>
            ))}
          </View>
        ) : null}
      </View>
      <PhotoViewer
        photos={photos}
        visible={viewerIndex !== null}
        selectedIndex={viewerIndex ?? 0}
        onClose={() => setViewerIndex(null)}
      />
      <NoteViewer
        note={item.note ?? ''}
        visible={noteViewerVisible}
        onClose={() => setNoteViewerVisible(false)}
      />
    </SortablePressable>
  );
}

export default memo(ItemRowInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: BUTTON_BORDER_RADIUS,
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.7,
  },
  checkbox: {
    marginRight: 2,
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flex: 1,
    fontWeight: '500',
  },
  noteIcon: {},
  notePreview: {
    marginTop: 4,
    lineHeight: 18,
  },
  editButton: {
    padding: 4,
  },
  thumbRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  thumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
});
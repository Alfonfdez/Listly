import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { t } from '../i18n';
import { MAX_ITEM_PICTURES } from '../constants/types';
import { isNative } from '../utils/platform';
import ConfirmModal from './ConfirmModal';
import ModalShell from './ModalShell';
import { BUTTON_BORDER_RADIUS, CARD_BORDER_RADIUS } from './componentStyles';

interface Props {
  photos: string[];
  onTakePhoto: () => void;
  onPickFromGallery: () => void;
  onRemovePhoto: (uri: string) => void;
}

export default function PhotoSection({ photos, onTakePhoto, onPickFromGallery, onRemovePhoto }: Props) {
  const [sourceModalVisible, setSourceModalVisible] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = t();

  const handleSourceOption = (action: () => void) => {
    setSourceModalVisible(false);
    action();
  };

  const handleConfirmDelete = () => {
    if (photoToDelete) {
      onRemovePhoto(photoToDelete);
    }
    setPhotoToDelete(null);
  };

  const canAddMore = photos.length < MAX_ITEM_PICTURES;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: c.text, fontSize: fs(15) }]}>{labels.item_photos_title}</Text>
      <View style={styles.photoRow}>
        {photos.map((uri, index) => (
          <View key={`${uri}-${index}`} style={styles.photoWrapper}>
            <View style={[styles.photoButton, { backgroundColor: c.surface }]}>
              <Image source={{ uri }} style={styles.photoThumbnail} />
            </View>
            <Pressable
              style={[styles.removeButton, { backgroundColor: c.red }]}
              onPress={() => setPhotoToDelete(uri)}
              accessibilityRole="button"
              accessibilityLabel={labels.item_photos_remove}
            >
              <Ionicons name="close" size={14} color="#FFFFFF" />
            </Pressable>
          </View>
        ))}
        {canAddMore && (
          <Pressable
            style={({ pressed }) => [
              styles.photoButton,
              styles.addButton,
              { backgroundColor: c.surface, borderColor: c.border },
              pressed && styles.pressed,
            ]}
            onPress={() => setSourceModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={labels.item_photos_add}
          >
            <Ionicons name="add" size={28} color={c.textSecondary} />
          </Pressable>
        )}
      </View>

      <ModalShell
        visible={sourceModalVisible}
        onClose={() => setSourceModalVisible(false)}
        backgroundColor={c.background}
      >
        <Text style={[styles.modalTitle, { color: c.text, fontSize: fs(18) }]}>{labels.item_photos_add}</Text>
        {isNative && (
          <Pressable
            style={({ pressed }) => [styles.modalOption, { backgroundColor: c.surface }, pressed && styles.pressed]}
            onPress={() => handleSourceOption(onTakePhoto)}
            accessibilityRole="button"
          >
            <Ionicons name="camera-outline" size={24} color={c.primary} />
            <Text style={[styles.modalOptionText, { color: c.text, fontSize: fs(15) }]}>
              {labels.item_photos_take}
            </Text>
          </Pressable>
        )}
        <Pressable
          style={({ pressed }) => [styles.modalOption, { backgroundColor: c.surface }, pressed && styles.pressed]}
          onPress={() => handleSourceOption(onPickFromGallery)}
          accessibilityRole="button"
        >
          <Ionicons name="images-outline" size={24} color={c.primary} />
          <Text style={[styles.modalOptionText, { color: c.text, fontSize: fs(15) }]}>
            {labels.item_photos_gallery}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.modalCancelButton,
            { backgroundColor: c.background, borderColor: c.border, borderWidth: 1 },
            pressed && styles.pressed,
          ]}
          onPress={() => setSourceModalVisible(false)}
          accessibilityRole="button"
          accessibilityLabel={labels.common_cancel}
        >
          <Text style={[styles.modalCancelText, { color: c.text, fontSize: fs(14) }]}>{labels.common_cancel}</Text>
        </Pressable>
      </ModalShell>

      <ConfirmModal
        visible={photoToDelete !== null}
        title={labels.item_photos_remove_confirm}
        message={labels.item_photos_remove_message}
        cancelLabel={labels.common_cancel}
        confirmLabel={labels.item_photos_remove}
        onCancel={() => setPhotoToDelete(null)}
        onConfirm={handleConfirmDelete}
        destructive
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontWeight: '600',
    marginBottom: 10,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoWrapper: {
    position: 'relative',
  },
  photoButton: {
    width: 80,
    height: 80,
    borderRadius: CARD_BORDER_RADIUS,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  addButton: {
    borderStyle: 'dashed',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: BUTTON_BORDER_RADIUS,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  modalTitle: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BUTTON_BORDER_RADIUS,
    marginBottom: 8,
    gap: 12,
  },
  modalOptionText: {
    fontWeight: '500',
  },
  modalCancelButton: {
    padding: 12,
    borderRadius: BUTTON_BORDER_RADIUS,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  modalCancelText: {
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});
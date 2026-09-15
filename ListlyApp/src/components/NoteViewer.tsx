import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { t } from '../i18n';

interface Props {
  note: string;
  visible: boolean;
  onClose: () => void;
}

export default function NoteViewer({ note, visible, onClose }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = t();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={styles.closeButton}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={labels.common_close}
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </Pressable>
        <View style={[styles.card, { backgroundColor: c.surface }]}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={[styles.noteText, { color: c.text, fontSize: fs(15) }]}>{note}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 48,
    right: 24,
    zIndex: 1,
    padding: 8,
  },
  card: {
    width: '88%',
    maxHeight: '75%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 20,
  },
  noteText: {
    lineHeight: 22,
  },
});

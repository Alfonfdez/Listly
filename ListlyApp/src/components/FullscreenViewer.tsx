import { type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLabels } from '../hooks/useLabels';
import { WHITE } from '../constants/themes';
import { VIEWER_BG } from './componentStyles';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function FullscreenViewer({ visible, onClose, children }: Props) {
  const labels = useLabels();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop: tapping anywhere outside the content closes the viewer. It is
            a sibling behind the content, so taps on the photo/note do not bubble
            to it. The X stays for accessibility and explicit closing. */}
        <Pressable
          testID="viewer-backdrop"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessible={false}
        />
        {children}
        <Pressable
          style={styles.closeButton}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={labels.common_close}
        >
          <Ionicons name="close" size={28} color={WHITE} />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: VIEWER_BG,
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
});

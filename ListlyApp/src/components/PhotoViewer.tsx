import { Image, StyleSheet } from 'react-native';
import FullscreenViewer from './FullscreenViewer';

interface Props {
  photos: string[];
  visible: boolean;
  selectedIndex: number;
  onClose: () => void;
}

export default function PhotoViewer({ photos, visible, selectedIndex, onClose }: Props) {
  return (
    <FullscreenViewer visible={visible} onClose={onClose}>
      {photos.length > 0 && (
        <Image source={{ uri: photos[selectedIndex] ?? photos[0] }} resizeMode="contain" style={styles.image} />
      )}
    </FullscreenViewer>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '90%',
    height: '80%',
  },
});

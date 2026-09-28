import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import FullscreenViewer from './FullscreenViewer';
import { CARD_BORDER_RADIUS } from './componentStyles';

interface Props {
  note: string;
  visible: boolean;
  onClose: () => void;
}

export default function NoteViewer({ note, visible, onClose }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  return (
    <FullscreenViewer visible={visible} onClose={onClose}>
      <View style={[styles.card, { backgroundColor: c.surface }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={{ color: c.text, fontSize: fs(15), lineHeight: fs(22) }}>{note}</Text>
        </ScrollView>
      </View>
    </FullscreenViewer>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '88%',
    maxHeight: '75%',
    borderRadius: CARD_BORDER_RADIUS,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 20,
  },
});

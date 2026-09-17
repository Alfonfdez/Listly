import { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ColorPicker, { Panel1, HueSlider, OpacitySlider, Preview } from 'reanimated-color-picker';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useResetOnOpen } from '../hooks/useResetOnOpen';
import { useLabels } from '../hooks/useLabels';
import { CARD_BORDER_RADIUS } from './componentStyles';
import ModalShell from './ModalShell';
import ModalFooter from './ModalFooter';

interface Props {
  visible: boolean;
  selectedColor: string | null;
  onSelect: (color: string) => void;
  onClose: () => void;
}

export default function ColorPickerModal({ visible, selectedColor, onSelect, onClose }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();
  const [tempColor, setTempColor] = useState(selectedColor ?? c.primary);

  const resetOnOpen = useCallback(() => {
    setTempColor(selectedColor ?? c.primary);
  }, [selectedColor, c.primary]);
  useResetOnOpen(visible, resetOnOpen);

  const handleConfirm = () => {
    onSelect(tempColor);
    onClose();
  };

  const handleChange = ({ hex }: { hex: string }) => {
    setTempColor(hex);
  };

  return (
    <ModalShell visible={visible} onClose={onClose} padding={20} overlayPadding={0}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Text style={[styles.title, { color: c.text, fontSize: fs(16) }]}>
          {labels.color_picker_title}
        </Text>
      </View>

      <View style={styles.pickerContainer}>
        <ColorPicker
          value={tempColor}
          onChangeJS={handleChange}
          style={styles.picker}
          boundedThumb
        >
          <Panel1 style={styles.panel} />
          <HueSlider style={styles.slider} />
          <OpacitySlider style={styles.slider} />
          <Preview hideInitialColor />
        </ColorPicker>
      </View>

      <ModalFooter
        cancelLabel={labels.color_picker_cancel}
        confirmLabel={labels.color_picker_ok}
        onCancel={onClose}
        onConfirm={handleConfirm}
        borderTop
      />
    </ModalShell>
  );
}

const SLIDER_HEIGHT = 30;

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    paddingBottom: 12,
    marginBottom: 16,
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
  },
  pickerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  picker: {
    width: '100%',
    padding: 0,
  },
  panel: {
    width: '100%',
    height: 200,
    borderRadius: CARD_BORDER_RADIUS,
    marginBottom: 12,
  },
  slider: {
    width: '100%',
    height: SLIDER_HEIGHT,
    borderRadius: SLIDER_HEIGHT / 2,
    marginBottom: 12,
  },
});
import { type ReactNode } from 'react';
import { Modal, View, StyleSheet, useWindowDimensions, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { useConfig } from '../context/ConfigContext';
import { isWeb } from '../utils/platform';
import { OVERLAY_BG, MODAL_BORDER_RADIUS, MODAL_SHADOW_COLOR } from './componentStyles';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
  padding?: number;
  overlayPadding?: number;
  maxHeight?: DimensionValue;
  backgroundColor?: string;
  shadow?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function ModalShell({
  visible,
  onClose,
  children,
  maxWidth = 360,
  padding = 24,
  overlayPadding = 32,
  maxHeight = '70%',
  backgroundColor,
  shadow = false,
  style,
}: Props) {
  const { activeColors: c } = useConfig();
  const { height: windowHeight } = useWindowDimensions();
  const boundedMaxHeight =
    typeof maxHeight === 'number'
      ? maxHeight
      : Math.round(windowHeight * (parseFloat(String(maxHeight)) / 100));
  const shadowStyle = isWeb
    ? { boxShadow: `0 8px 32px ${MODAL_SHADOW_COLOR}` }
    : { elevation: 10 };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { padding: overlayPadding }]}>
        <View
          style={[
            styles.modal,
            { backgroundColor: backgroundColor ?? c.surface, maxWidth, padding, maxHeight: boundedMaxHeight },
            shadow && shadowStyle,
            style,
          ]}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: OVERLAY_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '100%',
    borderRadius: MODAL_BORDER_RADIUS,
  },
});
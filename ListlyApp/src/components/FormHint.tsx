import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';

const HINT_FONT_SIZE = 12;
const HINT_LINE_HEIGHT = 1.4;
/** Lines of room always kept, so the buttons around the band never move. */
const HINT_LINES = 2;
const HINT_MARGIN = 8;

interface Props {
  /** The "why you can't save" message, or null/empty for a blank band. */
  message?: string | null;
  style?: StyleProp<ViewStyle>;
}

/**
 * Reserved band for a form's blocking hint (usually right above the submit
 * button). It keeps its two lines even when empty so nothing shifts when the
 * message appears or disappears, and announces changes to screen readers.
 */
export default function FormHint({ message, style }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  return (
    <View
      style={[
        styles.slot,
        { minHeight: Math.round(fs(HINT_FONT_SIZE) * HINT_LINE_HEIGHT * HINT_LINES) },
        style,
      ]}
    >
      {message ? (
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={[styles.text, { color: c.red, fontSize: fs(HINT_FONT_SIZE) }]}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: HINT_MARGIN,
    marginBottom: HINT_MARGIN,
  },
  text: {
    textAlign: 'center',
    fontWeight: '500',
  },
});

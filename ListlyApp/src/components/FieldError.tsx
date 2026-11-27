import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';

interface Props {
  /** The validation message; nothing renders when null/empty. */
  message?: string | null;
  /** Layout only (margin/alignment); colour and size stay the component's. */
  style?: StyleProp<TextStyle>;
}

/**
 * The single renderer for an inline field error: red, 12px and announced to
 * assistive technology. Callers only pass layout overrides.
 */
export default function FieldError({ message, style }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  if (!message) return null;

  return (
    <Text
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.text, { color: c.red, fontSize: fs(12) }, style]}
    >
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontWeight: '400',
  },
});

import { StyleSheet, Text } from 'react-native';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';

const COUNTER_FONT_WEIGHT = '500';
const AT_MAX_FONT_WEIGHT = '700';

interface Props {
  current: number;
  max: number;
  fontSize?: number;
}

/**
 * The one place a character/limit counter is styled. It is right-aligned and
 * muted by default, and turns red + bold once the value reaches its limit: the
 * only moment the field stops accepting input, so it reads as "you can't type
 * more" rather than "this is invalid".
 */
export default function CharCounter({ current, max, fontSize = 11 }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const atMax = current >= max;
  return (
    <Text
      style={[
        styles.counter,
        {
          color: atMax ? c.red : c.textSecondary,
          fontWeight: atMax ? AT_MAX_FONT_WEIGHT : COUNTER_FONT_WEIGHT,
          fontSize: fs(fontSize),
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${current}/${max}`}
    >
      {current}/{max}
    </Text>
  );
}

const styles = StyleSheet.create({
  counter: {
    textAlign: 'right',
    marginTop: 2,
  },
});

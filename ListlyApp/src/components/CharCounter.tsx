import { StyleSheet, Text } from 'react-native';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';

interface Props {
  current: number;
  max: number;
}

export default function CharCounter({ current, max }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const atMax = current >= max;
  return (
    <Text
      style={[styles.counter, { color: atMax ? c.red : c.textSecondary, fontSize: fs(11) }]}
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
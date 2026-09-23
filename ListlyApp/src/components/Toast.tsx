import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { MODAL_BORDER_RADIUS } from './componentStyles';

interface Props {
  message: string | null;
}

export default function Toast({ message }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: message ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [message, opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.container, { opacity, backgroundColor: c.surface, borderColor: c.border }]}
    >
      <Text style={[styles.text, { color: c.text, fontSize: fs(14) }]} numberOfLines={2}>
        {message ?? ''}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 96,
    alignSelf: 'center',
    maxWidth: '90%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: MODAL_BORDER_RADIUS,
    borderWidth: 1,
  },
  text: {
    fontWeight: '500',
  },
});

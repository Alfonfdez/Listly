import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { ViewProps } from 'react-native';
import Sortable from 'react-native-sortables';

interface Props extends ViewProps {
  onPress: () => void;
  onLongPress?: () => void;
  activeOpacity?: number;
  children?: ReactNode;
}

// Upper bound for the pressed-opacity feedback. A gesture that gets stolen by
// the sortable drag (or otherwise cancelled) may never deliver `onTouchesUp`,
// which previously left the tile stuck at the pressed opacity (looking
// "selected"). This timer always clears it.
const PRESSED_MAX_MS = 600;

export default function SortablePressable({ onPress, onLongPress, style, activeOpacity = 0.2, children, ...viewProps }: Props) {
  const [pressed, setPressed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPressed = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPressed(false);
  }, []);

  const handleTouchesDown = useCallback(() => {
    setPressed(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setPressed(false), PRESSED_MAX_MS);
  }, []);

  const handleTap = useCallback(() => {
    clearPressed();
    onPress();
  }, [clearPressed, onPress]);

  const handleLongPress = useCallback(() => {
    clearPressed();
    onLongPress?.();
  }, [clearPressed, onLongPress]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return (
    <Sortable.Touchable
      onTap={handleTap}
      onLongPress={onLongPress ? handleLongPress : undefined}
      onTouchesDown={handleTouchesDown}
      onTouchesUp={clearPressed}
      {...viewProps}
      style={[style, pressed && { opacity: activeOpacity }]}
    >
      {children}
    </Sortable.Touchable>
  );
}

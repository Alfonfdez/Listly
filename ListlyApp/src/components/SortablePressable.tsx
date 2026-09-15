import { useState, type ReactNode } from 'react';
import type { ViewProps } from 'react-native';
import Sortable from 'react-native-sortables';

interface Props extends ViewProps {
  onPress: () => void;
  onLongPress?: () => void;
  activeOpacity?: number;
  children?: ReactNode;
}

export default function SortablePressable({ onPress, onLongPress, style, activeOpacity = 0.2, children, ...viewProps }: Props) {
  const [pressed, setPressed] = useState(false);

  return (
    <Sortable.Touchable
      onTap={onPress}
      onLongPress={onLongPress}
      onTouchesDown={() => setPressed(true)}
      onTouchesUp={() => setPressed(false)}
      {...viewProps}
      style={[style, pressed && { opacity: activeOpacity }]}
    >
      {children}
    </Sortable.Touchable>
  );
}
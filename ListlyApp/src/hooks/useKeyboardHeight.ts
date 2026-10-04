import { useEffect, useState } from 'react';
import { Keyboard, type KeyboardEvent } from 'react-native';
import { isAndroidPlatform } from '../utils/platform';

export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!isAndroidPlatform()) return undefined;

    const onShow = (event: KeyboardEvent) => setHeight(event.endCoordinates.height);
    const onHide = () => setHeight(0);

    const showSub = Keyboard.addListener('keyboardDidShow', onShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
}

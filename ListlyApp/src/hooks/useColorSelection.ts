import { useState, useCallback } from 'react';
import { QUICK_COLORS } from '../constants/listColors';

export function useColorSelection(initialColor?: string | null) {
  const [selectedColor, setSelectedColor] = useState<string | null>(
    initialColor ?? null
  );
  const [customColor, setCustomColor] = useState<string | null>(
    initialColor && !QUICK_COLORS.includes(initialColor) ? initialColor : null
  );

  const handleColorSelect = useCallback((color: string) => {
    setSelectedColor(color);
    if (!QUICK_COLORS.includes(color)) {
      setCustomColor(color);
    }
  }, []);

  return { selectedColor, customColor, setSelectedColor, setCustomColor, handleColorSelect };
}
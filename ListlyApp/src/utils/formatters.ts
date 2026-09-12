import { TEXT_SIZES, type TextSize } from '../constants/types';

const FACTORS: Record<TextSize, number> = {
  [TEXT_SIZES.small]: 0.85,
  [TEXT_SIZES.medium]: 1.0,
  [TEXT_SIZES.large]: 1.15,
};

export function scaleFontSize(size: number, textSize: TextSize): number {
  return Math.round(size * FACTORS[textSize]);
}
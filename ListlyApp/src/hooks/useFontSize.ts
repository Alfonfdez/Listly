import { useConfig } from '../context/ConfigContext';
import { scaleFontSize } from '../utils/formatters';

export function useFontSize() {
  const { config } = useConfig();
  return (size: number) => scaleFontSize(size, config.textSize);
}

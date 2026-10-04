import { useEffect } from 'react';

export function useResetOnOpen(visible: boolean, reset: () => void): void {
  useEffect(() => {
    if (visible) {
      reset();
    }
  }, [visible, reset]);
}
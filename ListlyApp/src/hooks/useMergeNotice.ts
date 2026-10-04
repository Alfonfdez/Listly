import { useEffect, useState } from 'react';
import { COPY_FEEDBACK_MS, MERGE_NOTICE } from '../constants/types';

// Shows the transient "Merged into <target>" notice when a list screen is
// reached right after a merge (via the `notice` route param).
export function useMergeNotice(notice: string | undefined): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (notice !== MERGE_NOTICE) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), COPY_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  return visible;
}

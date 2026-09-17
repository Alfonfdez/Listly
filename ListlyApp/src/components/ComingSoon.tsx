import { useLabels } from '../hooks/useLabels';
import ScreenShell from './ScreenShell';
import EmptyState from './EmptyState';

export default function ComingSoon() {
  const labels = useLabels();
  return (
    <ScreenShell>
      <EmptyState icon="construct-outline" message={labels.coming_soon} />
    </ScreenShell>
  );
}
import { t } from '../i18n';
import ScreenShell from './ScreenShell';
import EmptyState from './EmptyState';

export default function ComingSoon() {
  return (
    <ScreenShell>
      <EmptyState icon="construct-outline" message={t().coming_soon} />
    </ScreenShell>
  );
}
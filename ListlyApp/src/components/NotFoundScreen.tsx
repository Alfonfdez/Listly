import { StyleSheet } from 'react-native';
import { useLabels } from '../hooks/useLabels';
import { ICONS } from '../constants/icons';
import ScreenShell from './ScreenShell';
import EmptyState from './EmptyState';

export default function NotFoundScreen() {
  const labels = useLabels();

  return (
    <ScreenShell style={styles.center}>
      <EmptyState icon={ICONS.notFound} message={labels.home_empty} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

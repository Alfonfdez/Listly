import { StyleSheet, Text } from 'react-native';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import ModalShell from './ModalShell';
import ModalFooter from './ModalFooter';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  closeLabel: string;
  onClose: () => void;
}

export default function InfoModal({ visible, title, message, closeLabel, onClose }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  return (
    <ModalShell visible={visible} onClose={onClose} maxWidth={380} padding={20}>
      <Text style={[styles.title, { color: c.text, fontSize: fs(18) }]}>{title}</Text>
      <Text style={[styles.message, { color: c.textSecondary, fontSize: fs(14) }]}>{message}</Text>
      <ModalFooter confirmLabel={closeLabel} onConfirm={onClose} />
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
});

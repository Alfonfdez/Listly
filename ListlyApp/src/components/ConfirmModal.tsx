import { type ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import ModalShell from './ModalShell';
import ModalFooter from './ModalFooter';

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  destructive?: boolean;
  confirmDisabled?: boolean;
  children?: ReactNode;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  destructive = false,
  confirmDisabled = false,
  children,
}: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  return (
    <ModalShell visible={visible} onClose={onCancel} maxWidth={380} padding={20}>
      <Text style={[styles.title, { color: c.text, fontSize: fs(18) }]}>{title}</Text>
      {message ? (
        <Text style={[styles.message, { color: c.textSecondary, fontSize: fs(14) }]}>{message}</Text>
      ) : null}
      {children}
      <ModalFooter
        cancelLabel={cancelLabel}
        confirmLabel={confirmLabel}
        onCancel={onCancel}
        onConfirm={onConfirm}
        destructive={destructive}
        confirmDisabled={confirmDisabled}
      />
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
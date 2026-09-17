import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useConfig } from '../../context/ConfigContext';
import { useFontSize } from '../../hooks/useFontSize';
import { BUTTON_BORDER_RADIUS } from '../componentStyles';
import ConfirmModal from '../ConfirmModal';

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  hint: string;
  confirmationText: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmWithTextModal({
  visible,
  title,
  message,
  hint,
  confirmationText,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (visible) setTyped('');
  }, [visible]);

  const matches = typed.trim() === confirmationText;

  if (!visible) return null;

  return (
    <ConfirmModal
      visible={visible}
      title={title}
      message={message}
      cancelLabel={cancelLabel}
      confirmLabel={confirmLabel}
      destructive
      confirmDisabled={!matches}
      onCancel={onCancel}
      onConfirm={() => {
        if (matches) onConfirm();
      }}
    >
      <View style={styles.field}>
        <Text style={[styles.hint, { color: c.textSecondary, fontSize: fs(14) }]}>{hint}</Text>
        <TextInput
          value={typed}
          onChangeText={setTyped}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder={confirmationText}
          placeholderTextColor={c.textSecondary}
          style={[
            styles.input,
            { backgroundColor: c.background, borderColor: c.border, color: c.text, fontSize: fs(15) },
          ]}
          accessibilityLabel={hint}
        />
      </View>
    </ConfirmModal>
  );
}

const styles = StyleSheet.create({
  field: {
    marginTop: 12,
    gap: 8,
  },
  hint: {
    fontWeight: '500',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: 'center',
  },
});

import { useCallback, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useLabels } from '../hooks/useLabels';
import { useResetOnOpen } from '../hooks/useResetOnOpen';
import { isWrongPassphrase } from '../utils/vaultCrypto';
import { MIN_PASSPHRASE_LENGTH } from '../constants/types';
import { BUTTON_BORDER_RADIUS } from './componentStyles';
import ModalShell from './ModalShell';
import ModalFooter from './ModalFooter';
import FormField from './FormField';

interface Props {
  visible: boolean;
  hasPhotos: boolean;
  mode?: 'lock' | 'change';
  onCancel: () => void;
  onConfirm: (passphrase: string, currentPassphrase: string) => void | Promise<void>;
}

export default function LockListModal({ visible, hasPhotos, mode = 'lock', onCancel, onConfirm }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();

  const [passphrase, setPassphrase] = useState('');
  const [current, setCurrent] = useState('');
  const [confirmValue, setConfirmValue] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useResetOnOpen(
    visible,
    useCallback(() => {
      setPassphrase('');
      setCurrent('');
      setConfirmValue('');
      setAcknowledged(false);
      setError(null);
      setBusy(false);
    }, [])
  );

  const submit = async () => {
    if (mode === 'change' && current.length === 0) {
      setError(labels.vault_wrong_current);
      return;
    }
    if (passphrase.length < MIN_PASSPHRASE_LENGTH) {
      setError(labels.vault_passphrase_too_short);
      return;
    }
    if (passphrase !== confirmValue) {
      setError(labels.vault_passphrase_mismatch);
      return;
    }
    if (!acknowledged) {
      setError(labels.vault_warning_required);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onConfirm(passphrase, current);
    } catch (err) {
      setError(
        mode === 'change' && isWrongPassphrase(err)
          ? labels.vault_wrong_current
          : labels.error_generic
      );
      setBusy(false);
    }
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: c.background, borderColor: c.border, color: c.text, fontSize: fs(15) },
  ];

  return (
    <ModalShell visible={visible} onClose={onCancel} maxWidth={380} padding={20}>
      <Text style={[styles.title, { color: c.text, fontSize: fs(18) }]}>
        {mode === 'change' ? labels.list_change_passphrase_title : labels.list_lock_title}
      </Text>
      {hasPhotos ? (
        <Text style={[styles.message, { color: c.red, fontSize: fs(14) }]}>
          {labels.vault_photos_not_allowed}
        </Text>
      ) : (
        <>
          <Text style={[styles.message, { color: c.textSecondary, fontSize: fs(13) }]}>
            {mode === 'change' ? labels.list_change_passphrase_title : labels.list_lock_message}
          </Text>
          {mode === 'change' ? (
            <FormField label={labels.vault_current_passphrase_label} style={styles.field}>
              <TextInput
                style={inputStyle}
                value={current}
                onChangeText={setCurrent}
                secureTextEntry
                autoCapitalize="none"
                accessibilityLabel={labels.vault_current_passphrase_label}
              />
            </FormField>
          ) : null}
          <FormField label={labels.vault_passphrase_label} style={styles.field}>
            <TextInput
              style={inputStyle}
              value={passphrase}
              onChangeText={setPassphrase}
              placeholder={labels.vault_passphrase_hint}
              placeholderTextColor={c.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              accessibilityLabel={labels.vault_passphrase_label}
            />
          </FormField>
          <FormField label={labels.vault_passphrase_confirm} style={styles.field}>
            <TextInput
              style={inputStyle}
              value={confirmValue}
              onChangeText={setConfirmValue}
              secureTextEntry
              autoCapitalize="none"
              accessibilityLabel={labels.vault_passphrase_confirm}
            />
          </FormField>
          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setAcknowledged(prev => !prev)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acknowledged }}
            accessibilityLabel={labels.vault_unrecoverable_warning}
          >
            <Ionicons
              name={acknowledged ? 'checkbox' : 'square-outline'}
              size={20}
              color={acknowledged ? c.primary : c.textSecondary}
            />
            <Text style={[styles.checkText, { color: c.text, fontSize: fs(13) }]}>
              {labels.vault_unrecoverable_warning}
            </Text>
          </TouchableOpacity>
          {error ? <Text style={[styles.error, { color: c.red, fontSize: fs(12) }]}>{error}</Text> : null}
        </>
      )}
      <ModalFooter
        cancelLabel={labels.common_cancel}
        confirmLabel={hasPhotos ? undefined : mode === 'change' ? labels.list_change_passphrase_confirm : labels.list_lock_confirm}
        onCancel={onCancel}
        onConfirm={() => void submit()}
        confirmDisabled={busy || hasPhotos}
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
  field: {
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  checkText: {
    flex: 1,
    fontWeight: '500',
  },
  error: {
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
});

import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { useLabels } from '../hooks/useLabels';
import { BUTTON_BORDER_RADIUS, PRESSED_OPACITY } from './componentStyles';
import { ICONS } from '../constants/icons';

interface Props {
  onUnlock: (passphrase: string) => Promise<void>;
  onRemoveLock: (passphrase: string) => Promise<void>;
  wrongPassphrase: boolean;
}

export default function VaultUnlockView({ onUnlock, onRemoveLock, wrongPassphrase }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = useLabels();

  const [passphrase, setPassphrase] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (action: (passphrase: string) => Promise<void>) => {
    if (!passphrase) return;
    setBusy(true);
    try {
      await action(passphrase);
    } catch {
      // Failures are logged by the caller; wrong passphrases are surfaced through the prop.
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={[styles.badge, { backgroundColor: c.surface }]}>
        <Ionicons name="lock-closed" size={40} color={c.primary} />
      </View>
      <Text style={[styles.title, { color: c.text, fontSize: fs(18) }]}>{labels.list_unlock_title}</Text>
      <Text style={[styles.hint, { color: c.textSecondary, fontSize: fs(13) }]}>{labels.list_unlock_hint}</Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: c.background, borderColor: wrongPassphrase ? c.red : c.border, color: c.text, fontSize: fs(15) },
        ]}
        value={passphrase}
        onChangeText={setPassphrase}
        placeholder={labels.vault_passphrase_label}
        placeholderTextColor={c.textSecondary}
        secureTextEntry
        autoCapitalize="none"
        accessibilityLabel={labels.vault_passphrase_label}
      />
      {wrongPassphrase ? (
        <Text style={[styles.error, { color: c.red, fontSize: fs(12) }]}>{labels.vault_wrong_passphrase}</Text>
      ) : null}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: c.primary }]}
        onPress={() => void run(onUnlock)}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={labels.list_unlock_action}
      >
        <Ionicons name="lock-open-outline" size={18} color={c.background} />
        <Text style={[styles.buttonText, { color: c.background, fontSize: fs(15) }]}>
          {labels.list_unlock_action}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.removeLink}
        onPress={() => void run(onRemoveLock)}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={labels.list_remove_lock}
      >
        <Ionicons name={ICONS.removeLock} size={16} color={c.textSecondary} />
        <Text style={[styles.removeText, { color: c.textSecondary, fontSize: fs(13) }]}>
          {labels.list_remove_lock}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
  },
  hint: {
    textAlign: 'center',
    fontWeight: '500',
  },
  input: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  error: {
    fontWeight: '600',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    paddingVertical: 12,
    borderRadius: BUTTON_BORDER_RADIUS,
    marginTop: 4,
  },
  buttonText: {
    fontWeight: '600',
  },
  removeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    opacity: PRESSED_OPACITY,
  },
  removeText: {
    fontWeight: '500',
  },
});

import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { t } from '../i18n';
import { LIST_ICONS } from '../constants/listIcons';
import { LIST_COLORS } from '../constants/listColors';
import { DEBOUNCE_MS, MAX_LIST_NAME_LENGTH } from '../constants/types';
import type { IconName, NavigationProp } from '../constants/types';
import type { ListNameError } from '../utils/validation';
import { validateListName } from '../utils/validation';
import { listRepository as listRepo } from '../database';
import { withAlpha } from '../utils/color';
import ScreenShell from '../components/ScreenShell';
import { BUTTON_BORDER_RADIUS } from '../components/componentStyles';

export default function CreateListScreen() {
  const navigation = useNavigation<NavigationProp<'CreateList'>>();
  const { refresh } = useApp();
  const { activeColors: c } = useConfig();
  const fs = useFontSize();
  const labels = t();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState<IconName>(LIST_ICONS[0]);
  const [color, setColor] = useState<string>(LIST_COLORS[0]);
  const [error, setError] = useState<ListNameError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const requestSeq = useRef(0);

  useEffect(() => {
    const trimmed = name.trim();
    const seq = ++requestSeq.current;
    setError(validateListName(trimmed, false, MAX_LIST_NAME_LENGTH));
    if (trimmed.length === 0 || trimmed.length > MAX_LIST_NAME_LENGTH) return;

    const handle = setTimeout(() => {
      void listRepo.existsByName(trimmed).then(exists => {
        if (requestSeq.current !== seq) return;
        setError(validateListName(trimmed, exists, MAX_LIST_NAME_LENGTH));
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [name]);

  const trimmed = name.trim();
  const canCreate = error === null && trimmed.length > 0 && !submitting;

  const submit = async () => {
    if (submitting) return;
    if (error !== null || trimmed.length === 0) return;
    setSubmitting(true);
    try {
      const exists = await listRepo.existsByName(trimmed);
      if (exists) {
        setError('list_name_duplicate');
        return;
      }
      await listRepo.create({ name: trimmed, color, icon });
      await refresh();
      navigation.goBack();
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    borderWidth: 1,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: c.surface,
    borderColor: c.border,
    color: c.text,
    fontSize: fs(15),
  };

  return (
    <ScreenShell>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={[styles.heading, { color: c.text, fontSize: fs(16) }]}>{labels.create_list_title}</Text>

        <Text style={[styles.label, { color: c.textSecondary, fontSize: fs(13) }]}>
          {labels.list_name_label}
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          maxLength={MAX_LIST_NAME_LENGTH}
          placeholder={labels.list_name_label}
          placeholderTextColor={c.textSecondary}
          style={inputStyle}
          accessibilityLabel={labels.list_name_label}
        />
        {error ? (
          <Text style={[styles.errorText, { color: c.red, fontSize: fs(12) }]}>{labels[error]}</Text>
        ) : null}

        <Text style={[styles.label, { color: c.textSecondary, fontSize: fs(13) }]}>
          {labels.list_icon_label}
        </Text>
        <View style={styles.grid}>
          {LIST_ICONS.map(option => {
            const selected = option === icon;
            return (
              <Pressable
                key={option}
                onPress={() => setIcon(option)}
                accessibilityRole="button"
                accessibilityLabel={option}
                accessibilityState={{ selected }}
                style={[
                  styles.iconOption,
                  {
                    borderColor: selected ? c.primary : 'transparent',
                    backgroundColor: selected ? withAlpha(c.primary, 15) : c.surface,
                  },
                ]}
              >
                <Ionicons name={option} size={20} color={selected ? c.primary : c.text} />
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, { color: c.textSecondary, fontSize: fs(13) }]}>
          {labels.list_color_label}
        </Text>
        <View style={styles.grid}>
          {LIST_COLORS.map(option => {
            const selected = option === color;
            return (
              <Pressable
                key={option}
                onPress={() => setColor(option)}
                accessibilityRole="button"
                accessibilityLabel={option}
                accessibilityState={{ selected }}
                style={[
                  styles.colorRing,
                  {
                    borderColor: selected ? c.primary : 'transparent',
                    backgroundColor: c.background,
                  },
                ]}
              >
                <View style={[styles.colorSwatch, { backgroundColor: option }]} />
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.createButton,
            { backgroundColor: c.primary },
            (!canCreate || pressed) && styles.pressed,
            !canCreate && styles.disabled,
          ]}
          disabled={!canCreate}
          onPress={() => void submit()}
          accessibilityRole="button"
          accessibilityLabel={labels.list_create}
          accessibilityState={{ disabled: !canCreate }}
        >
          <Text style={[styles.createButtonText, { color: '#FFFFFF', fontSize: fs(15) }]}>
            {labels.list_create}
          </Text>
        </Pressable>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  heading: {
    fontWeight: '700',
    marginBottom: 4,
  },
  label: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorRing: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatch: {
    width: 30,
    height: 30,
    borderRadius: 999,
  },
  createButton: {
    marginTop: 28,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingVertical: 12,
    alignItems: 'center',
  },
  createButtonText: {
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
});
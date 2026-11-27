import { type ReactNode } from 'react';
import { Text, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { SECTION_TITLE_FONT_SIZE, textStyles } from './textStyles';
import FieldError from './FieldError';

interface Props {
  label: string;
  /** Right side of the label row (a char counter, usually). */
  right?: ReactNode;
  error?: string | null;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

export default function FormField({ label, right, error, style, children }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  return (
    <View style={style}>
      <View style={styles.header}>
        <Text style={[textStyles.sectionTitle, styles.label, { color: c.text, fontSize: fs(SECTION_TITLE_FONT_SIZE) }]}>
          {label}
        </Text>
        {right ?? null}
      </View>
      {children}
      <FieldError message={error} style={styles.error} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  label: {
    flexShrink: 1,
    marginBottom: 0,
  },
  error: {
    marginTop: 4,
  },
});

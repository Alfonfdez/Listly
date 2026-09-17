import { type ReactNode } from 'react';
import { Text, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { SECTION_TITLE_FONT_SIZE, textStyles } from './textStyles';

interface Props {
  label: string;
  error?: string | null;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

export default function FormField({ label, error, style, children }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  return (
    <View style={style}>
      <Text style={[textStyles.sectionTitle, { color: c.text, fontSize: fs(SECTION_TITLE_FONT_SIZE) }]}>
        {label}
      </Text>
      {children}
      {error ? (
        <Text style={[styles.error, { color: c.red, fontSize: fs(12) }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  error: {
    marginTop: 4,
  },
});

import { View, Text } from 'react-native';
import { useConfig } from '../../context/ConfigContext';
import { useFontSize } from '../../hooks/useFontSize';
import { settingsStyles } from './settingsStyles';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  card?: boolean;
  children: ReactNode;
}

export default function SettingsSection({ title, card = true, children }: Props) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  return (
    <View>
      <Text style={[settingsStyles.sectionTitle, { color: c.textSecondary, fontSize: fs(12) }]}>
        {title}
      </Text>
      {card ? (
        <View style={[settingsStyles.card, { backgroundColor: c.surface }]}>{children}</View>
      ) : (
        children
      )}
    </View>
  );
}

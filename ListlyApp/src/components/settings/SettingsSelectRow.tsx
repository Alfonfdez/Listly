import { Text, View } from 'react-native';
import { useConfig } from '../../context/ConfigContext';
import { useFontSize } from '../../hooks/useFontSize';
import { SECTION_TITLE_FONT_SIZE, textStyles } from '../textStyles';
import SelectorInline, { type Option } from './SelectorInline';

interface Props<T extends string> {
  label: string;
  options: Option<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

export default function SettingsSelectRow<T extends string>({ label, options, selected, onSelect }: Props<T>) {
  const { activeColors: c } = useConfig();
  const fs = useFontSize();

  return (
    <View>
      <Text style={[textStyles.sectionTitle, { color: c.text, fontSize: fs(SECTION_TITLE_FONT_SIZE) }]}>{label}</Text>
      <SelectorInline options={options} selected={selected} onSelect={onSelect} />
    </View>
  );
}

import { Text } from 'react-native';
import { LANGUAGES, type LanguageId } from '../../constants/languages';

const FLAG_EMOJI: Record<LanguageId, string> = {
  [LANGUAGES.en]: '\u{1F1EC}\u{1F1E7}',
  [LANGUAGES.es]: '\u{1F1EA}\u{1F1F8}',
};

interface Props {
  code: LanguageId;
  size?: number;
}

export default function FlagIcon({ code, size = 16 }: Props) {
  return <Text style={{ fontSize: size }}>{FLAG_EMOJI[code]}</Text>;
}

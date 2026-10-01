import { Text, View } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { flagColors } from '../../constants/flagColors';
import { LANGUAGES, type LanguageId } from '../../constants/languages';

interface Props {
  code: LanguageId;
  size?: number;
}

// Catalan, Galician and Basque have no emoji flag, so they are always drawn as
// SVG (on native and web alike), mirroring Finly's Regional screen.
function SenyeraFlag({ size }: { size: number }) {
  return (
    <View style={{ width: size, height: size * 0.75, borderRadius: 2, overflow: 'hidden' }}>
      <View style={{ flex: 1, backgroundColor: flagColors.senyeraYellow }} />
      <View style={{ height: 1, backgroundColor: flagColors.senyeraRed }} />
      <View style={{ flex: 1, backgroundColor: flagColors.senyeraYellow }} />
      <View style={{ height: 1, backgroundColor: flagColors.senyeraRed }} />
      <View style={{ flex: 1, backgroundColor: flagColors.senyeraYellow }} />
      <View style={{ height: 1, backgroundColor: flagColors.senyeraRed }} />
      <View style={{ flex: 1, backgroundColor: flagColors.senyeraYellow }} />
    </View>
  );
}

function GalicianFlag({ size }: { size: number }) {
  const w = size;
  const h = size * 0.75;
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Rect width={w} height={h} fill={flagColors.galicianWhite} />
      <Line x1={0} y1={0} x2={w} y2={h} stroke={flagColors.galicianBlue} strokeWidth={h * 0.28} />
    </Svg>
  );
}

function BasqueFlag({ size }: { size: number }) {
  const w = size;
  const h = size * 0.75;
  const band = w * 0.086;
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Rect width={w} height={h} fill={flagColors.basqueRed} />
      <Line x1={0} y1={0} x2={w} y2={h} stroke={flagColors.basqueGreen} strokeWidth={band} strokeLinecap="square" />
      <Line x1={w} y1={0} x2={0} y2={h} stroke={flagColors.basqueGreen} strokeWidth={band} strokeLinecap="square" />
      <Line x1={w / 2} y1={0} x2={w / 2} y2={h} stroke={flagColors.basqueWhite} strokeWidth={band} strokeLinecap="square" />
      <Line x1={0} y1={h / 2} x2={w} y2={h / 2} stroke={flagColors.basqueWhite} strokeWidth={band} strokeLinecap="square" />
    </Svg>
  );
}

const FLAG_EMOJI: Partial<Record<LanguageId, string>> = {
  [LANGUAGES.en]: '\u{1F1EC}\u{1F1E7}',
  [LANGUAGES.es]: '\u{1F1EA}\u{1F1F8}',
  [LANGUAGES.fr]: '\u{1F1EB}\u{1F1F7}',
  [LANGUAGES.de]: '\u{1F1E9}\u{1F1EA}',
  [LANGUAGES.pt]: '\u{1F1F5}\u{1F1F9}',
  [LANGUAGES.it]: '\u{1F1EE}\u{1F1F9}',
};

export default function FlagIcon({ code, size = 16 }: Props) {
  if (code === LANGUAGES.ca) return <SenyeraFlag size={size} />;
  if (code === LANGUAGES.gl) return <GalicianFlag size={size} />;
  if (code === LANGUAGES.eu) return <BasqueFlag size={size} />;
  return <Text style={{ fontSize: size }}>{FLAG_EMOJI[code] ?? ''}</Text>;
}

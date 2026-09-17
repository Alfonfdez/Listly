import { View } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { flagColors } from '../../constants/flagColors';
import { LANGUAGES, type LanguageId } from '../../constants/languages';

interface Props {
  code: LanguageId;
  size?: number;
}

function UKFlag({ size }: { size: number }) {
  const w = size;
  const h = size * 0.75;
  const sw = h * 0.15;
  const dw = h * 0.075;
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Rect width={w} height={h} fill={flagColors.ukBlue} />
      <Line x1={0} y1={0} x2={w} y2={h} stroke="#fff" strokeWidth={dw * 2.5} />
      <Line x1={w} y1={0} x2={0} y2={h} stroke="#fff" strokeWidth={dw * 2.5} />
      <Line x1={0} y1={0} x2={w} y2={h} stroke={flagColors.ukRed} strokeWidth={dw} />
      <Line x1={w} y1={0} x2={0} y2={h} stroke={flagColors.ukRed} strokeWidth={dw} />
      <Rect x={0} y={h / 2 - sw / 2} width={w} height={sw} fill="#fff" />
      <Rect x={w / 2 - sw / 2} y={0} width={sw} height={h} fill="#fff" />
      <Rect x={0} y={h / 2 - sw / 3} width={w} height={sw * 0.66} fill={flagColors.ukRed} />
      <Rect x={w / 2 - sw / 3} y={0} width={sw * 0.66} height={h} fill={flagColors.ukRed} />
    </Svg>
  );
}

function SpainFlag({ size }: { size: number }) {
  const h = size * 0.75;
  return (
    <View style={{ width: size, height: h, borderRadius: 2, overflow: 'hidden' }}>
      <View style={{ flex: 1, backgroundColor: flagColors.spainRed }} />
      <View style={{ flex: 2, backgroundColor: flagColors.spainYellow }} />
      <View style={{ flex: 1, backgroundColor: flagColors.spainRed }} />
    </View>
  );
}

export default function FlagIcon({ code, size = 16 }: Props) {
  if (code === LANGUAGES.es) return <SpainFlag size={size} />;
  return <UKFlag size={size} />;
}

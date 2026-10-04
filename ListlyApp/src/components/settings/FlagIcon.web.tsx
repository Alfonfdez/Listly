import { View } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { flagColors } from '../../constants/flagColors';
import { WHITE } from '../../constants/themes';
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
      <Line x1={0} y1={0} x2={w} y2={h} stroke={WHITE} strokeWidth={dw * 2.5} />
      <Line x1={w} y1={0} x2={0} y2={h} stroke={WHITE} strokeWidth={dw * 2.5} />
      <Line x1={0} y1={0} x2={w} y2={h} stroke={flagColors.ukRed} strokeWidth={dw} />
      <Line x1={w} y1={0} x2={0} y2={h} stroke={flagColors.ukRed} strokeWidth={dw} />
      <Rect x={0} y={h / 2 - sw / 2} width={w} height={sw} fill={WHITE} />
      <Rect x={w / 2 - sw / 2} y={0} width={sw} height={h} fill={WHITE} />
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

function VerticalTricolor({ size, colors }: { size: number; colors: string[] }) {
  return (
    <View style={{ width: size, height: size * 0.75, borderRadius: 2, overflow: 'hidden', flexDirection: 'row' }}>
      {colors.map((color, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: color }} />
      ))}
    </View>
  );
}

function HorizontalTricolor({ size, colors }: { size: number; colors: string[] }) {
  return (
    <View style={{ width: size, height: size * 0.75, borderRadius: 2, overflow: 'hidden' }}>
      {colors.map((color, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: color }} />
      ))}
    </View>
  );
}

export default function FlagIcon({ code, size = 16 }: Props) {
  switch (code) {
    case LANGUAGES.es:
      return <SpainFlag size={size} />;
    case LANGUAGES.ca:
      return <SenyeraFlag size={size} />;
    case LANGUAGES.gl:
      return <GalicianFlag size={size} />;
    case LANGUAGES.eu:
      return <BasqueFlag size={size} />;
    case LANGUAGES.fr:
      return <VerticalTricolor size={size} colors={['#0055A4', WHITE, '#EF4135']} />;
    case LANGUAGES.de:
      return <HorizontalTricolor size={size} colors={['#000000', '#DD0000', '#FFCE00']} />;
    case LANGUAGES.pt:
      return <VerticalTricolor size={size} colors={['#046A38', '#DA291C']} />;
    case LANGUAGES.it:
      return <VerticalTricolor size={size} colors={['#009246', WHITE, '#CE2B37']} />;
    case LANGUAGES.en:
    default:
      return <UKFlag size={size} />;
  }
}

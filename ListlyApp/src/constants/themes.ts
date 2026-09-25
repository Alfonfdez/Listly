export const WHITE = '#FFFFFF';
export const BLACK = '#000000';
export const TRANSPARENT = 'transparent';

export interface ColorPalette {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primary: string;
  accent: string;
  green: string;
  red: string;
  star: string;
  border: string;
}

export const darkColors: ColorPalette = {
  background: '#0F172A',
  surface: '#1E293B',
  text: '#E2E8F0',
  textSecondary: '#94A3B8',
  primary: '#22D3EE',
  accent: '#A78BFA',
  green: '#34D399',
  red: '#F87171',
  star: '#F9A825',
  border: '#334155',
};

export const lightColors: ColorPalette = {
  background: WHITE,
  surface: '#F1F5F9',
  text: '#1E293B',
  textSecondary: '#64748B',
  primary: '#0891B2',
  accent: '#7C3AED',
  green: '#059669',
  red: '#DC2626',
  star: '#F59E0B',
  border: '#E2E8F0',
};
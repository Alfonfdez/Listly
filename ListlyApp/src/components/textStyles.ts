import { StyleSheet } from 'react-native';

export const SECTION_TITLE_FONT_SIZE = 15;
export const SECTION_SUBTITLE_FONT_SIZE = 13;

export const SECTION_TITLE_STYLE = { fontWeight: '600', marginBottom: 10 } as const;
export const SECTION_SUBTITLE_STYLE = { fontWeight: '400', marginBottom: 8 } as const;

export const textStyles = StyleSheet.create({
  sectionTitle: SECTION_TITLE_STYLE,
  sectionSubtitle: SECTION_SUBTITLE_STYLE,
});

import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export const THEMES = {
  dark: 'dark',
  light: 'light',
  system: 'system',
} as const;

export type Theme = keyof typeof THEMES;

export const TEXT_SIZES = {
  small: 'small',
  medium: 'medium',
  large: 'large',
} as const;

export type TextSize = keyof typeof TEXT_SIZES;

export const LIST_LAYOUTS = {
  grid: 'grid',
  list: 'list',
} as const;

export type ListLayout = keyof typeof LIST_LAYOUTS;

export const FACTORY_RESET_CONFIRMATION = 'DELETE';

export const DEBOUNCE_MS = 300;
export const COPY_FEEDBACK_MS = 1500;
export const PHOTO_QUALITY = 0.7;

export const MAX_LIST_NAME_LENGTH = 100;
export const MAX_COLLECTION_NAME_LENGTH = 100;
export const MAX_ITEM_NAME_LENGTH = 200;
export const MAX_ITEM_NOTE_LENGTH = 2000;
export const MAX_ITEM_PICTURES = 3;

export type RootStackParamList = {
  Home: undefined;
  Lists: undefined;
  Collections: undefined;
  ListDetail: { listId: number };
  CreateList: { collectionId?: number } | undefined;
  EditList: { listId: number };
  CollectionDetail: { collectionId: number };
  CreateCollection: undefined;
  EditCollection: { collectionId: number };
  Settings: undefined;
  SettingsAppearance: undefined;
  SettingsRegional: undefined;
  SettingsPersonalization: undefined;
  SettingsData: undefined;
};

export type NavigationProp<RouteName extends keyof RootStackParamList> =
  NativeStackNavigationProp<RootStackParamList, RouteName>;
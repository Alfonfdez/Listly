import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isNative = Platform.OS !== 'web';
export const isAndroid = Platform.OS === 'android';
export const isAndroidPlatform = (): boolean => Platform.OS === 'android';

export const ShareResult = {
  SAVED: 'saved',
  DISMISSED: 'dismissed',
} as const;

export type ShareResultValue = (typeof ShareResult)[keyof typeof ShareResult];

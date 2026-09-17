import { vi } from 'vitest';
import type { ReactNode } from 'react';
import type { Config } from '../../src/database/types';
import type { ColorPalette } from '../../src/constants/themes';
import { darkColors } from '../../src/constants/themes';

const configTemplate: Config = {
  theme: 'system',
  language: 'en',
  textSize: 'medium',
  homeLayout: 'grid',
  listsLayout: 'list',
  showNotes: true,
  showPhotos: true,
  editShowNotes: true,
  editShowPhotos: true,
};

interface ConfigStubState {
  config: Config;
  activeColors: ColorPalette;
  updateConfig: ReturnType<typeof vi.fn>;
  reload: ReturnType<typeof vi.fn>;
  loading: boolean;
  reset: () => void;
}

interface GlobalWithConfigStub {
  __listlyConfigStub__?: ConfigStubState;
}

function createStub(): ConfigStubState {
  const state: ConfigStubState = {
    config: { ...configTemplate },
    activeColors: { ...darkColors },
    updateConfig: vi.fn(async () => {}),
    reload: vi.fn(async () => {}),
    loading: false,
    reset: () => {
      state.config = { ...configTemplate };
      state.activeColors = { ...darkColors };
      state.updateConfig.mockClear();
      state.reload.mockClear();
    },
  };
  return state;
}

const g = globalThis as GlobalWithConfigStub;
g.__listlyConfigStub__ = createStub();

vi.mock('../../src/context/ConfigContext', () => ({
  useConfig: () => (globalThis as GlobalWithConfigStub).__listlyConfigStub__,
  ConfigProvider: ({ children }: { children: ReactNode }) => children,
}));

function currentStub(): ConfigStubState {
  const stub = (globalThis as GlobalWithConfigStub).__listlyConfigStub__;
  if (!stub) throw new Error('configStub setup not loaded: register tests/helpers/configStub.ts in setupFiles');
  return stub;
}

export function getConfigStub(): ConfigStubState {
  return currentStub();
}

export function setConfig(partial: Partial<Config>): void {
  const stub = currentStub();
  stub.config = { ...stub.config, ...partial };
}

export function setColors(partial: Partial<ColorPalette>): void {
  const stub = currentStub();
  stub.activeColors = { ...stub.activeColors, ...partial };
}

export function resetStub(): void {
  currentStub().reset();
}
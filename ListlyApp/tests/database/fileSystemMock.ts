import { vi } from 'vitest';

const { MockFile } = vi.hoisted(() => {
  class MockFile {
    uri: string;
    constructor(uri: string) {
      this.uri = uri;
    }
    get exists(): boolean {
      return false;
    }
    delete(): void {}
    async copy(): Promise<void> {}
  }
  return { MockFile };
});

vi.mock('expo-file-system', () => ({
  File: MockFile,
  Paths: { document: { uri: 'file:///' } },
}));
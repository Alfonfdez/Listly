import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { reactNative } from 'vitest-native';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [reactNative()],
  resolve: {
    alias: {
      '@expo/vector-icons': path.resolve(dirname, 'tests/mocks/expo-vector-icons.tsx'),
      'react-native-sortables': path.resolve(dirname, 'tests/mocks/react-native-sortables.tsx'),
    },
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/helpers/configStub.ts', './tests/database/fileSystemMock.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
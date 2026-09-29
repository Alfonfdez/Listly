import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { reactNative } from 'vitest-native';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [reactNative()],
  resolve: {
    mainFields: ['module', 'jsnext:main', 'jsnext', 'main'],
    alias: {
      '@expo/vector-icons': path.resolve(dirname, 'tests/mocks/expo-vector-icons.tsx'),
      'react-native-sortables': path.resolve(dirname, 'tests/mocks/react-native-sortables.tsx'),
      'test-renderer': path.resolve(dirname, 'node_modules/test-renderer/dist/index.cjs'),
    },
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/helpers/configStub.ts', './tests/database/fileSystemMock.ts', './tests/database/quickCryptoMock.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
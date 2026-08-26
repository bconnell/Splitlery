import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({ resolve: { alias: { 'react-native': path.resolve(__dirname, 'tests/react-native-shim.tsx'), '@react-native-async-storage/async-storage': path.resolve(__dirname, 'tests/storage-shim.ts') } }, test: { environment: 'node', globals: true } });

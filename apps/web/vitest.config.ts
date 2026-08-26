import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';
import type { PluginOption } from 'vite';

export default defineConfig({ plugins: [vue() as unknown as PluginOption], test: { environment: 'jsdom', globals: true } });

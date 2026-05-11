/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/HVE-Detective/',
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}'],
  },
});

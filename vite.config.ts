import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

export default defineConfig({
  base: './',
  server: { port: 5173, open: false },
  build: { chunkSizeWarningLimit: 2000 },
  /** game version stamped into telemetry records */
  define: { __APP_VERSION__: JSON.stringify(version) },
});

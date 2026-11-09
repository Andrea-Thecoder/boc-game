import { defineConfig } from 'vitest/config';

/** Unit tests: pure logic only, run in Node (Phaser must never be imported here). */
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});

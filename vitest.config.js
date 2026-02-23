import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/unit/**/*.test.js'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'integration',
          include: ['test/integration/**/*.test.js'],
          environment: 'jsdom',
          setupFiles: ['test/integration/setup.js'],
        },
      },
      {
        test: {
          name: 'performance',
          include: ['test/performance/**/*.test.js'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'monitoring',
          include: ['test/monitoring/**/*.test.js'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'accessibility',
          include: [
            'src/accessibility/**/*.test.js',
            'test/accessibility/**/*.test.js',
          ],
          environment: 'jsdom',
        },
      },
    ],
  },
});

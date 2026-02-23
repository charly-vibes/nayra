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
          exclude: ['test/performance/memory-leaks.test.js'],
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
          name: 'memory',
          include: ['test/performance/memory-leaks.test.js'],
          environment: 'node',
          pool: 'forks',
          poolOptions: {
            forks: {
              execArgv: ['--expose-gc'],
            },
          },
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

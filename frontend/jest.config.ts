import type { Config } from 'jest';
import path from 'path';

const config: Config = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // Test environment (jsdom for React components)
  testEnvironment: 'jsdom',
  
  // Root directory for tests
  roots: ['<rootDir>/src'],
  
  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  
  // Module name mapping (matches Vite path aliases)
  moduleNameMapper: {
    // Path alias support
    '^@/(.*)$': '<rootDir>/src/$1',
    
    // Vite-specific package aliases (strip version numbers)
    '^@radix-ui/react-slot@[^/]+$': '@radix-ui/react-slot',
    '^@radix-ui/react-tooltip@[^/]+$': '@radix-ui/react-tooltip',
    '^@radix-ui/react-toggle@[^/]+$': '@radix-ui/react-toggle',
    '^@radix-ui/react-toggle-group@[^/]+$': '@radix-ui/react-toggle-group',
    '^@radix-ui/react-tabs@[^/]+$': '@radix-ui/react-tabs',
    '^@radix-ui/react-switch@[^/]+$': '@radix-ui/react-switch',
    '^@radix-ui/react-slider@[^/]+$': '@radix-ui/react-slider',
    '^@radix-ui/react-separator@[^/]+$': '@radix-ui/react-separator',
    '^@radix-ui/react-select@[^/]+$': '@radix-ui/react-select',
    '^@radix-ui/react-scroll-area@[^/]+$': '@radix-ui/react-scroll-area',
    '^@radix-ui/react-radio-group@[^/]+$': '@radix-ui/react-radio-group',
    '^@radix-ui/react-progress@[^/]+$': '@radix-ui/react-progress',
    '^@radix-ui/react-popover@[^/]+$': '@radix-ui/react-popover',
    '^@radix-ui/react-navigation-menu@[^/]+$': '@radix-ui/react-navigation-menu',
    '^@radix-ui/react-menubar@[^/]+$': '@radix-ui/react-menubar',
    '^@radix-ui/react-label@[^/]+$': '@radix-ui/react-label',
    '^@radix-ui/react-hover-card@[^/]+$': '@radix-ui/react-hover-card',
    '^@radix-ui/react-dropdown-menu@[^/]+$': '@radix-ui/react-dropdown-menu',
    '^@radix-ui/react-dialog@[^/]+$': '@radix-ui/react-dialog',
    '^@radix-ui/react-context-menu@[^/]+$': '@radix-ui/react-context-menu',
    '^@radix-ui/react-collapsible@[^/]+$': '@radix-ui/react-collapsible',
    '^@radix-ui/react-checkbox@[^/]+$': '@radix-ui/react-checkbox',
    '^@radix-ui/react-avatar@[^/]+$': '@radix-ui/react-avatar',
    '^@radix-ui/react-aspect-ratio@[^/]+$': '@radix-ui/react-aspect-ratio',
    '^@radix-ui/react-alert-dialog@[^/]+$': '@radix-ui/react-alert-dialog',
    '^@radix-ui/react-accordion@[^/]+$': '@radix-ui/react-accordion',
    '^class-variance-authority@[^/]+$': 'class-variance-authority',
    '^cmdk@[^/]+$': 'cmdk',
    '^embla-carousel-react@[^/]+$': 'embla-carousel-react',
    '^input-otp@[^/]+$': 'input-otp',
    '^lucide-react@[^/]+$': 'lucide-react',
    '^next-themes@[^/]+$': 'next-themes',
    '^react-day-picker@[^/]+$': 'react-day-picker',
    '^react-hook-form@[^/]+$': 'react-hook-form',
    '^react-resizable-panels@[^/]+$': 'react-resizable-panels',
    '^recharts@[^/]+$': 'recharts',
    '^sonner@[^/]+$': 'sonner',
    '^vaul@[^/]+$': 'vaul',
    
    // CSS/SCSS modules
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    
    // Static assets (images, fonts, etc.)
    '\\.(jpg|jpeg|png|gif|webp|svg|eot|otf|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/__mocks__/fileMock.ts',
  },
  
  // File extensions to test
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)',
    '**/*.(test|spec).(ts|tsx|js|jsx)',
  ],
  
  // Transform files with ts-jest
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          moduleResolution: 'node',
          resolveJsonModule: true,
          isolatedModules: true,
          strict: false,
        },
      },
    ],
  },
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
  ],
  
  // Coverage thresholds (adjust as needed)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  
  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/build/', '/dist/'],
  
  // Module paths to ignore
  modulePathIgnorePatterns: ['<rootDir>/build/', '<rootDir>/dist/'],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Max workers for parallel execution
  maxWorkers: '50%',
};

export default config;

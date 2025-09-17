module.exports = {
  preset: 'react-native',
  displayName: 'Comprehensive Test Suite',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/__tests__/e2e/**/*.test.{ts,tsx}',
    '<rootDir>/src/__tests__/performance/**/*.test.{ts,tsx}',
    '<rootDir>/backend/src/__tests__/security/**/*.test.{ts,tsx}',
    '<rootDir>/backend/src/__tests__/load/**/*.test.{ts,tsx}',
    '<rootDir>/backend/src/__tests__/monitoring/**/*.test.{ts,tsx}',
    '<rootDir>/backend/src/__tests__/integration/**/*.test.{ts,tsx}',
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Transform patterns
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-vector-icons|react-native-share|react-native-image-picker|zustand|@google-cloud)/)',
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/jest.comprehensive.setup.js',
  ],
  
  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@backend/(.*)$': '<rootDir>/backend/src/$1',
  },
  
  // Test environment
  testEnvironment: 'node',
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'backend/src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!backend/src/**/*.d.ts',
    '!src/__tests__/**',
    '!backend/src/__tests__/**',
    '!**/node_modules/**',
  ],
  
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary',
  ],
  
  coverageDirectory: '<rootDir>/coverage/comprehensive',
  
  // Test timeout for long-running tests
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Fail fast on first test failure (optional)
  bail: false,
  
  // Maximum worker processes
  maxWorkers: '50%',
  
  // Global setup and teardown
  globalSetup: '<rootDir>/jest.global.setup.js',
  globalTeardown: '<rootDir>/jest.global.teardown.js',
  
  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/comprehensive/html-report',
        filename: 'comprehensive-test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'AI Sticker Generation - Comprehensive Test Report',
      },
    ],
  ],
  
  // Test result processor
  testResultsProcessor: '<rootDir>/scripts/test-results-processor.js',
};
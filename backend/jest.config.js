module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/services'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'services/**/src/**/*.ts',
    '!services/**/src/**/*.dto.ts',
    '!services/**/src/**/*.interface.ts',
    '!services/**/src/**/*.module.ts',
    '!services/**/src/**/main.ts',
    '!services/**/src/**/*.spec.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@shared/database$': '<rootDir>/shared/database/src/index.ts',
    '^@shared/(.*)$': '<rootDir>/shared/$1/src',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};

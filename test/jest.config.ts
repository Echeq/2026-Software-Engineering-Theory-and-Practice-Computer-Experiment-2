import type { Config } from 'jest';

const config: Config = {
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }] },
  testEnvironment: 'node',
  rootDir: '../backend',
  roots: ['<rootDir>/../test'],
  testMatch: ['**/*.test.ts'],
};

export default config;

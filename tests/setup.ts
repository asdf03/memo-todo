// Jest setup file
import 'jest-environment-jsdom';

// Mock console methods for cleaner test output
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
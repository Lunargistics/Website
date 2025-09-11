import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { server } from './tests/mocks/server';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

process.env.NEXT_PUBLIC_IPFS_BUILD = 'false';
process.env.NEXT_PUBLIC_PROVIDER_URL = 'http://127.0.0.1:8545';
process.env.NEXT_PUBLIC_NETWORK_NAME = 'localhost';
process.env.NEXT_PUBLIC_CHAIN_ID = '31337';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
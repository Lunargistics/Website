import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "util";

// Polyfills for Node.js environment
(global as any).TextEncoder = TextEncoder as any;
(global as any).TextDecoder = TextDecoder as any;

// Add Response and Request polyfills for Node.js compatibility
const { Response, Request, Headers } = require('undici');
(global as any).Response = Response;
(global as any).Request = Request;
(global as any).Headers = Headers;

// JSDOM doesn't implement scrollIntoView
Object.defineProperty((global as any).Element.prototype, "scrollIntoView", {
  writable: true,
  value: jest.fn(),
});

process.env.NEXT_PUBLIC_IPFS_BUILD = "false";
process.env.NEXT_PUBLIC_PROVIDER_URL = "http://127.0.0.1:8545";
process.env.NEXT_PUBLIC_NETWORK_NAME = "localhost";
process.env.NEXT_PUBLIC_CHAIN_ID = "31337";
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.NEXTAUTH_SECRET = "test-secret-key-for-testing";
process.env.MONGODB_URI = "mongodb://localhost:27017/test";

Object.defineProperty(window, "matchMedia", {
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

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: jest.fn(),
});

(global as any).IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
// Critical polyfills for MSW and Jest environment - order matters!
// ALL polyfills must be set up BEFORE requiring undici
// FIRST: Set up TextEncoder/TextDecoder before any imports that might need them
import { TextDecoder, TextEncoder } from "util";
// SECOND: Set up streams before any imports that might need them
import * as streams from "web-streams-polyfill/dist/ponyfill.js";

(global as any).TextEncoder = TextEncoder as any;
(global as any).TextDecoder = TextDecoder as any;

// Set up streams polyfills BEFORE importing undici
if (streams) {
  if (!(global as any).ReadableStream && (streams as any).ReadableStream) {
    (global as any).ReadableStream = (streams as any).ReadableStream;
  }
  if (!(global as any).WritableStream && (streams as any).WritableStream) {
    (global as any).WritableStream = (streams as any).WritableStream;
  }
  if (!(global as any).TransformStream && (streams as any).TransformStream) {
    (global as any).TransformStream = (streams as any).TransformStream;
  }
}

// THIRD: Set up MessageChannel/MessagePort before undici import
if (typeof (global as any).MessageChannel === "undefined") {
  class MessagePort {
    onmessage: ((this: MessagePort, ev: MessageEvent) => any) | null = null;
    onmessageerror: ((this: MessagePort, ev: MessageEvent) => any) | null = null;

    postMessage(_message: any, _transfer?: any) {
      // No-op for testing
    }

    addEventListener(_type: string, _listener: any, _options?: any) {
      // No-op for testing
    }

    removeEventListener(_type: string, _listener: any, _options?: any) {
      // No-op for testing
    }

    start() {
      // No-op for testing
    }

    close() {
      // No-op for testing
    }
  }

  class MessageChannel {
    port1: MessagePort;
    port2: MessagePort;

    constructor() {
      this.port1 = new MessagePort();
      this.port2 = new MessagePort();
    }
  }

  (global as any).MessageChannel = MessageChannel;
  (global as any).MessagePort = MessagePort;
}

// FOURTH: Set up AbortController and AbortSignal before undici import
if (typeof (global as any).AbortController === "undefined") {
  class AbortSignal {
    aborted: boolean = false;
    onabort: ((this: AbortSignal, ev: Event) => any) | null = null;

    addEventListener(_type: string, _listener: any, _options?: any) {
      // No-op for testing
    }

    removeEventListener(_type: string, _listener: any, _options?: any) {
      // No-op for testing
    }

    dispatchEvent(_event: Event): boolean {
      return true;
    }

    static abort(_reason?: any): AbortSignal {
      const signal = new AbortSignal();
      signal.aborted = true;
      return signal;
    }

    static timeout(milliseconds: number): AbortSignal {
      const signal = new AbortSignal();
      setTimeout(() => {
        signal.aborted = true;
      }, milliseconds);
      return signal;
    }
  }

  class AbortController {
    signal: AbortSignal;

    constructor() {
      this.signal = new AbortSignal();
    }

    abort(_reason?: any) {
      this.signal.aborted = true;
    }
  }

  (global as any).AbortController = AbortController;
  (global as any).AbortSignal = AbortSignal;
}

// URL and URLSearchParams polyfills (usually available in Node.js but just in case)
if (typeof (global as any).URL === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { URL, URLSearchParams } = require("url");
  (global as any).URL = URL;
  (global as any).URLSearchParams = URLSearchParams;
}

// FINALLY: Set up fetch polyfills - this should work now that all dependencies are in place
if (typeof global.Response === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Response, Request, Headers, FormData } = require("undici");
  (global as any).Response = Response;
  (global as any).Request = Request;
  (global as any).Headers = Headers;
  (global as any).FormData = FormData;
}

// Set fetch globally for MSW interceptors
if (typeof global.fetch === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { fetch } = require("undici");
  (global as any).fetch = fetch;
}

// Minimal BroadcastChannel polyfill for msw in JSDOM
if (typeof (global as any).BroadcastChannel === "undefined") {
  class BroadcastChannel {
    name: string;
    onmessage: ((this: BroadcastChannel, ev: MessageEvent) => any) | null = null;
    onmessageerror: ((this: BroadcastChannel, ev: MessageEvent) => any) | null = null;

    constructor(name: string) {
      this.name = name;
    }

    postMessage(_msg: any) {
      // No-op for testing
    }

    addEventListener(_type: string, _listener: any, _options?: any) {
      // No-op for testing
    }

    removeEventListener(_type: string, _listener: any, _options?: any) {
      // No-op for testing
    }

    close() {
      // No-op for testing
    }
  }
  (global as any).BroadcastChannel = BroadcastChannel as any;
}

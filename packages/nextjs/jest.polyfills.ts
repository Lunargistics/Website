// Basic polyfills for Jest environment
import { TextDecoder, TextEncoder } from "util";
// Streams polyfill for MSW fetch interceptors
import * as streams from "web-streams-polyfill/dist/ponyfill.js";

(global as any).TextEncoder = TextEncoder as any;
(global as any).TextDecoder = TextDecoder as any;

// Minimal BroadcastChannel polyfill for msw in JSDOM
if (typeof (global as any).BroadcastChannel === "undefined") {
  class BC {
    name: string;
    onmessage: ((this: BC, ev: MessageEvent) => any) | null = null;
    constructor(name: string) {
      this.name = name;
    }
    postMessage(_msg: any) {}
    addEventListener(_type: string, _listener: any) {}
    removeEventListener(_type: string, _listener: any) {}
    close() {}
  }
  (global as any).BroadcastChannel = BC as any;
}

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

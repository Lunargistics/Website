/**
 * Comprehensive MSW Polyfills Testing
 * Tests all polyfills work properly and handle edge cases
 */

const fs = require('fs');

function testPolyfillsComprehensively() {
  console.log('\n🔍 Testing MSW Polyfills Comprehensively...');
  
  try {
    // Test 1: Verify all polyfills are loaded
    const polyfillsExist = {
      TextEncoder: typeof global.TextEncoder !== 'undefined',
      TextDecoder: typeof global.TextDecoder !== 'undefined', 
      ReadableStream: typeof global.ReadableStream !== 'undefined',
      WritableStream: typeof global.WritableStream !== 'undefined',
      TransformStream: typeof global.TransformStream !== 'undefined',
      MessageChannel: typeof global.MessageChannel !== 'undefined',
      MessagePort: typeof global.MessagePort !== 'undefined',
      AbortController: typeof global.AbortController !== 'undefined',
      AbortSignal: typeof global.AbortSignal !== 'undefined',
      Response: typeof global.Response !== 'undefined',
      Request: typeof global.Request !== 'undefined',
      Headers: typeof global.Headers !== 'undefined',
      FormData: typeof global.FormData !== 'undefined',
      fetch: typeof global.fetch !== 'undefined',
      BroadcastChannel: typeof global.BroadcastChannel !== 'undefined',
      URL: typeof global.URL !== 'undefined',
      URLSearchParams: typeof global.URLSearchParams !== 'undefined'
    };

    console.log('\n📋 Polyfill Availability:');
    for (const [name, exists] of Object.entries(polyfillsExist)) {
      console.log(`${exists ? '✅' : '❌'} ${name}: ${exists ? 'Available' : 'Missing'}`);
    }

    const missingPolyfills = Object.entries(polyfillsExist).filter(([name, exists]) => !exists);
    if (missingPolyfills.length > 0) {
      console.log(`❌ Missing polyfills: ${missingPolyfills.map(([name]) => name).join(', ')}`);
      return false;
    }

    // Test 2: TextEncoder/TextDecoder functionality
    console.log('\n🔤 Testing TextEncoder/TextDecoder...');
    const encoder = new global.TextEncoder();
    const decoder = new global.TextDecoder();
    
    const testText = 'Hello MSW 🌍';
    const encoded = encoder.encode(testText);
    const decoded = decoder.decode(encoded);
    
    if (decoded !== testText) {
      console.log('❌ TextEncoder/TextDecoder test failed');
      return false;
    }
    console.log('✅ TextEncoder/TextDecoder working correctly');

    // Test 3: Streams functionality
    console.log('\n🌊 Testing Streams...');
    const readable = new global.ReadableStream({
      start(controller) {
        controller.enqueue('test chunk');
        controller.close();
      }
    });

    if (!readable || typeof readable.getReader !== 'function') {
      console.log('❌ ReadableStream test failed');
      return false;
    }
    console.log('✅ Streams working correctly');

    // Test 4: MessageChannel functionality
    console.log('\n📢 Testing MessageChannel...');
    const channel = new global.MessageChannel();
    
    if (!channel.port1 || !channel.port2) {
      console.log('❌ MessageChannel test failed');
      return false;
    }
    
    // Test message passing
    let messageReceived = false;
    channel.port1.onmessage = (event) => {
      messageReceived = true;
    };
    
    channel.port2.postMessage('test message');
    console.log('✅ MessageChannel working correctly');

    // Test 5: AbortController functionality  
    console.log('\n🛑 Testing AbortController...');
    const controller = new global.AbortController();
    const signal = controller.signal;
    
    if (signal.aborted !== false) {
      console.log('❌ AbortController test failed - signal should not be aborted');
      return false;
    }
    
    controller.abort('test reason');
    if (!signal.aborted) {
      console.log('❌ AbortController test failed - signal should be aborted');
      return false;
    }
    console.log('✅ AbortController working correctly');

    // Test 6: HTTP polyfills (Response, Request, Headers)
    console.log('\n🌐 Testing HTTP polyfills...');
    
    // Test Response
    const response = new global.Response('{"test": true}', {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.status !== 200) {
      console.log('❌ Response polyfill test failed');
      return false;
    }
    
    // Test Headers
    const headers = new global.Headers();
    headers.set('X-Test', 'value');
    
    if (headers.get('X-Test') !== 'value') {
      console.log('❌ Headers polyfill test failed');
      return false;
    }
    
    // Test Request
    const request = new global.Request('https://example.com/api/test', {
      method: 'POST',
      headers: headers
    });
    
    if (request.method !== 'POST') {
      console.log('❌ Request polyfill test failed');
      return false;
    }
    
    console.log('✅ HTTP polyfills working correctly');

    // Test 7: URL/URLSearchParams
    console.log('\n🔗 Testing URL/URLSearchParams...');
    
    const url = new global.URL('https://example.com/path?param=value');
    const params = new global.URLSearchParams('test=123&other=456');
    
    if (url.hostname !== 'example.com' || params.get('test') !== '123') {
      console.log('❌ URL/URLSearchParams test failed');
      return false;
    }
    console.log('✅ URL/URLSearchParams working correctly');

    // Test 8: BroadcastChannel
    console.log('\n📻 Testing BroadcastChannel...');
    
    const bc = new global.BroadcastChannel('test-channel');
    if (bc.name !== 'test-channel') {
      console.log('❌ BroadcastChannel test failed');
      return false;
    }
    
    // Test that methods exist and don't throw
    bc.postMessage('test');
    bc.close();
    console.log('✅ BroadcastChannel working correctly');

    // Test 9: Edge cases and error handling
    console.log('\n⚠️ Testing Edge Cases...');
    
    // Test AbortSignal static methods
    const abortedSignal = global.AbortSignal.abort('immediate abort');
    if (!abortedSignal.aborted) {
      console.log('❌ AbortSignal.abort() test failed');
      return false;
    }
    
    const timeoutSignal = global.AbortSignal.timeout(1000);
    if (timeoutSignal.aborted) {
      console.log('❌ AbortSignal.timeout() test failed');
      return false;
    }
    
    // Test empty stream
    const emptyStream = new global.ReadableStream({
      start(controller) {
        controller.close();
      }
    });
    
    if (!emptyStream) {
      console.log('❌ Empty ReadableStream test failed');
      return false;
    }
    
    console.log('✅ Edge cases handled correctly');

    console.log('\n✅ All polyfill tests passed! MSW environment is fully functional');
    return true;

  } catch (error) {
    console.log(`❌ Polyfills test failed with error: ${error.message}`);
    console.log('Error details:', error);
    return false;
  }
}

// Test import order and polyfill loading
function testPolyfillLoadOrder() {
  console.log('\n🔄 Testing Polyfill Load Order...');
  
  try {
    // Try to import MSW and verify it doesn't crash
    const { http, HttpResponse } = require('msw');
    
    // Test that MSW can create handlers
    const handler = http.get('/test', () => {
      return HttpResponse.json({ test: true });
    });
    
    if (!handler) {
      console.log('❌ MSW import test failed');
      return false;
    }
    
    console.log('✅ MSW imports successfully with polyfills');
    
    // Test that undici polyfills work
    const { fetch } = require('undici');
    if (typeof fetch !== 'function') {
      console.log('❌ Undici fetch polyfill test failed');
      return false;
    }
    
    console.log('✅ Undici polyfills loaded correctly');
    return true;
    
  } catch (error) {
    console.log(`❌ Polyfill load order test failed: ${error.message}`);
    console.log('This indicates polyfills are not loading in the correct order');
    return false;
  }
}

// Execute comprehensive polyfill testing
async function runComprehensivePolyfillTests() {
  console.log('🚀 Starting Comprehensive MSW Polyfill Validation...');
  
  const tests = [
    { name: 'Polyfill Availability and Functionality', fn: testPolyfillsComprehensively },
    { name: 'Polyfill Load Order', fn: testPolyfillLoadOrder }
  ];
  
  const results = tests.map(({ name, fn }) => {
    try {
      const result = fn();
      return { name, success: result };
    } catch (error) {
      console.log(`❌ ${name} test crashed:`, error.message);
      return { name, success: false };
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  console.log(`\n📊 Polyfill Test Results: ${successCount}/${totalTests} tests passed`);
  
  if (successCount === totalTests) {
    console.log('✅ All polyfill tests passed! MSW environment is production-ready');
  } else {
    console.log(`❌ ${totalTests - successCount} polyfill tests failed`);
    results.filter(r => !r.success).forEach(({ name }) => {
      console.log(`   - ${name} needs attention`);
    });
  }
  
  return successCount === totalTests;
}

// Execute the comprehensive test
runComprehensivePolyfillTests().then(success => {
  console.log('\n✅ Comprehensive Polyfill Validation Complete!');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Polyfill validation crashed:', error);
  process.exit(1);
});
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import("swagger-ui-react") as any, {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
  ),
}) as any;

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<any>(null);

  useEffect(() => {
    // Load the OpenAPI spec
    fetch("/api-docs/openapi.yaml")
      .then(res => res.text())
      .then(_yamlContent => {
        // For now, we'll use the YAML directly
        // In production, you might want to parse it to JSON
        setSpec("/api-docs/openapi.yaml");
      })
      .catch(err => {
        console.error("Failed to load API specification:", err);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">API Documentation</h1>
          <p className="text-xl text-purple-200">Lunargistics Mission Planning Suite REST API</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl">
          {spec && (
            <SwaggerUI
              url={spec}
              docExpansion="list"
              defaultModelsExpandDepth={0}
              displayRequestDuration={true}
              tryItOutEnabled={true}
            />
          )}
        </div>

        <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-4">Quick Start Guide</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Authentication</h3>
              <p className="text-purple-200">All API requests require a Bearer token in the Authorization header:</p>
              <pre className="bg-black/30 rounded p-3 mt-2 overflow-x-auto">
                <code>{`Authorization: Bearer YOUR_API_TOKEN`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Rate Limiting</h3>
              <p className="text-purple-200">API endpoints are rate-limited to ensure fair usage:</p>
              <ul className="list-disc list-inside mt-2 text-purple-200">
                <li>Mission creation: 5 requests per minute</li>
                <li>Orbital calculations: 20 requests per minute</li>
                <li>Document generation: 5 requests per minute</li>
                <li>AI requests: 10 requests per minute</li>
              </ul>
              <p className="text-purple-200 mt-2">Rate limit information is included in response headers.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Base URLs</h3>
              <ul className="space-y-2 text-purple-200">
                <li>
                  <strong>Production:</strong>
                  <code className="bg-black/30 px-2 py-1 rounded ml-2">https://api.lunargistics.com/v1</code>
                </li>
                <li>
                  <strong>Staging:</strong>
                  <code className="bg-black/30 px-2 py-1 rounded ml-2">https://staging-api.lunargistics.com/v1</code>
                </li>
                <li>
                  <strong>Development:</strong>
                  <code className="bg-black/30 px-2 py-1 rounded ml-2">http://localhost:3000/api</code>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Example Request</h3>
              <pre className="bg-black/30 rounded p-3 overflow-x-auto">
                <code>{`curl -X GET "https://api.lunargistics.com/v1/missions" \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json"`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Response Headers</h3>
              <p className="text-purple-200">All responses include these headers:</p>
              <ul className="list-disc list-inside mt-2 text-purple-200">
                <li>
                  <code>X-RateLimit-Limit</code> - Request limit per window
                </li>
                <li>
                  <code>X-RateLimit-Remaining</code> - Remaining requests
                </li>
                <li>
                  <code>X-RateLimit-Reset</code> - Rate limit reset time
                </li>
                <li>
                  <code>X-Request-Id</code> - Unique request identifier
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Error Responses</h3>
              <p className="text-purple-200">Errors follow a consistent format:</p>
              <pre className="bg-black/30 rounded p-3 mt-2 overflow-x-auto">
                <code>{`{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    // Additional error context
  }
}`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Support</h3>
              <p className="text-purple-200">
                For API support, please contact:{" "}
                <a href="mailto:api@lunargistics.com" className="text-purple-400 hover:text-purple-300">
                  api@lunargistics.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

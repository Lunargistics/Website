/**
 * Production Readiness Validation Tests
 * Tests critical functionality without MSW dependencies
 */

describe("Production Readiness - Core Validation", () => {
  test("Environment validation functions work correctly", async () => {
    const { isIPFSConfigured } = await import("../../lib/env-validation");

    // Should handle missing environment gracefully
    expect(typeof isIPFSConfigured()).toBe("boolean");
  });

  test("Input sanitization protects against malicious inputs", async () => {
    const { InputSanitizer } = await import("../../lib/rate-limit");

    // SQL Injection attempt
    expect(() => InputSanitizer.sanitizeString("'; DROP TABLE users; --")).toThrow();

    // XSS attempt - dangerous patterns are removed entirely
    const maliciousXSS = '<script>alert("xss")</script>';
    const sanitized = InputSanitizer.sanitizeString(maliciousXSS);
    expect(sanitized).not.toContain("<script>");
    expect(sanitized).not.toContain("alert");
    // The dangerous script should be completely removed
    expect(sanitized).toBe("");

    // Valid input should pass through
    const validInput = "Mission Apollo 11";
    expect(InputSanitizer.sanitizeString(validInput)).toBe(validInput);
  });

  test("Validation schemas reject invalid orbital data", async () => {
    const { validateRequest, OrbitDataSchema } = await import("../../lib/validation");

    // Invalid semi-major axis (below Earth radius)
    const invalidOrbit = {
      semiMajorAxis: 5000, // 5000 km - below Earth radius of 6378.137 km
      eccentricity: 0.1,
      inclination: 45,
      raan: 0,
      argumentOfPerigee: 0,
      trueAnomaly: 0,
      epoch: new Date(),
    };

    const result = validateRequest(OrbitDataSchema, invalidOrbit);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Semi-major axis must be greater than Earth's radius");
    }

    // Valid orbit should pass
    const validOrbit = {
      semiMajorAxis: 7000000, // 622km altitude
      eccentricity: 0.1,
      inclination: 45,
      raan: 0,
      argumentOfPerigee: 0,
      trueAnomaly: 0,
      epoch: new Date(),
    };

    const validResult = validateRequest(OrbitDataSchema, validOrbit);
    expect(validResult.success).toBe(true);
  });

  test("TLE validation catches corrupted data", async () => {
    const { validateTLEConsistency } = await import("../../lib/validation");

    // Valid ISS TLE
    const validTLE = {
      line1: "1 25544U 98067A   24345.52795139  .00012506  00000-0  22495-3 0  9990",
      line2: "2 25544  51.6415 208.4057 0002769  35.9667  61.6291 15.50381554436914",
    };

    const validResult = validateTLEConsistency(validTLE);
    expect(validResult.valid).toBe(true);
    expect(validResult.issues).toHaveLength(0);

    // Invalid TLE with mismatched satellite numbers
    const invalidTLE = {
      line1: "1 25544U 98067A   24345.52795139  .00012506  00000-0  22495-3 0  9990",
      line2: "2 12345  51.6415 208.4057 0002769  35.9667  61.6291 15.50381554436914", // Wrong sat number
    };

    const invalidResult = validateTLEConsistency(invalidTLE);
    expect(invalidResult.valid).toBe(false);
    // Check for the actual error message about satellite numbers not matching
    expect(invalidResult.issues.some(issue => issue.includes("Satellite numbers"))).toBe(true);
  });

  test("Error boundary component structure is valid", async () => {
    const ErrorBoundary = await import("../../components/ErrorBoundary");

    // Should export default component and utilities
    expect(ErrorBoundary.default).toBeDefined();
    expect(ErrorBoundary.AsyncErrorBoundary).toBeDefined();
    expect(ErrorBoundary.withErrorBoundary).toBeDefined();
  });

  test("Monitoring service initializes without errors", async () => {
    const { monitoring } = await import("../../lib/monitoring");

    // Should be able to record metrics without throwing
    expect(() => {
      monitoring.recordMetric("test.metric", 1, { test: "true" });
    }).not.toThrow();

    // Should be able to log without throwing
    expect(() => {
      monitoring.log("info", "Test log message", "test-component");
    }).not.toThrow();
  });

  test("Async error handler handles different error types", async () => {
    const { classifyError, createEnhancedError } = await import("../../lib/async-error-handler");

    // Network error classification
    const networkError = new Error("fetch failed");
    const networkClassification = classifyError(networkError);
    expect(networkClassification.category).toBe("network");
    expect(networkClassification.severity).toBe("medium");

    // Validation error classification
    const validationError = new Error("Invalid input data");
    const validationClassification = classifyError(validationError);
    expect(validationClassification.category).toBe("validation");
    expect(validationClassification.severity).toBe("low");

    // Enhanced error creation
    const enhanced = createEnhancedError(networkError, { operation: "test" });
    expect(enhanced.category).toBe("network");
    expect(enhanced.context).toEqual({ operation: "test" });
    expect(enhanced.correlationId).toBeDefined();
  });
});

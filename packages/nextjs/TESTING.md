# Testing Documentation

## Overview

This project implements a comprehensive testing strategy with unit tests, integration tests, and end-to-end (E2E) tests to ensure code quality and maintain 80% code coverage.

## Testing Stack

- **Jest**: Unit and integration testing framework
- **React Testing Library**: Component testing utilities
- **Playwright**: E2E testing framework
- **MSW (Mock Service Worker)**: API mocking for tests
- **MongoDB Memory Server**: In-memory MongoDB for integration tests
- **Supertest**: HTTP assertion library for API testing

## Test Structure

```
packages/nextjs/
├── __tests__/
│   ├── unit/           # Unit tests for components and utilities
│   └── integration/    # Integration tests for API routes
├── e2e/                # End-to-end tests with Playwright
├── tests/
│   ├── mocks/          # MSW handlers and server setup
│   └── utils/          # Test utilities and helpers
├── jest.config.ts      # Jest configuration
├── jest.setup.ts       # Jest setup file
└── playwright.config.ts # Playwright configuration
```

## Running Tests

### All Tests

```bash
yarn test
```

### Unit Tests Only

```bash
yarn test:unit
```

### Integration Tests Only

```bash
yarn test:integration
```

### E2E Tests

```bash
yarn test:e2e
```

### E2E Tests with UI Mode

```bash
yarn test:e2e:ui
```

### Watch Mode (for development)

```bash
yarn test:watch
```

### Coverage Report

```bash
yarn test:coverage
```

### CI Mode

```bash
yarn test:ci
```

## Writing Tests

### Unit Tests

Unit tests focus on testing individual components and functions in isolation.

```typescript
// Example: Component test
import { render, screen, fireEvent } from '@/tests/utils/test-utils';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    render(<MyComponent />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Updated Text')).toBeInTheDocument();
  });
});
```

### Integration Tests

Integration tests verify that different parts of the application work together correctly.

```typescript
// Example: API route test
import { setupTestDatabase, teardownTestDatabase } from "@/tests/utils/db-test-utils";
import request from "supertest";

describe("API: /api/missions", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it("creates a new mission", async () => {
    const response = await request("http://localhost:3000")
      .post("/api/missions")
      .send({
        name: "Test Mission",
        type: "lunar",
      })
      .expect(201);

    expect(response.body).toHaveProperty("id");
    expect(response.body.name).toBe("Test Mission");
  });
});
```

### E2E Tests

E2E tests simulate real user interactions with the application.

```typescript
// Example: E2E test
import { expect, test } from "@playwright/test";

test("complete user journey", async ({ page }) => {
  await page.goto("/");

  // Login
  await page.click("text=Sign In");
  await page.fill('input[name="email"]', "user@example.com");
  await page.fill('input[name="password"]', "password");
  await page.click('button[type="submit"]');

  // Navigate to dashboard
  await expect(page).toHaveURL("/dashboard");
  await expect(page.locator("h1")).toContainText("Dashboard");

  // Perform action
  await page.click("text=Create Mission");
  // ... continue test
});
```

## Mocking

### API Mocking with MSW

MSW intercepts network requests during tests and returns mocked responses.

```typescript
// tests/mocks/handlers.ts
import { HttpResponse, http } from "msw";

export const handlers = [
  http.get("/api/data", () => {
    return HttpResponse.json({
      data: "mocked response",
    });
  }),
];
```

### Database Mocking

MongoDB Memory Server provides an in-memory MongoDB instance for integration tests.

```typescript
import { clearTestDatabase, setupTestDatabase } from "@/tests/utils/db-test-utils";

beforeEach(async () => {
  await clearTestDatabase();
});
```

## Test Coverage

The project maintains a minimum of 80% code coverage across:

- Statements
- Branches
- Functions
- Lines

Coverage reports are generated in the `coverage/` directory and can be viewed by opening `coverage/lcov-report/index.html` in a browser.

### Coverage Thresholds

Configure coverage thresholds in `jest.config.ts`:

```typescript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```

## CI/CD Integration

Tests run automatically on:

- Push to `main` or `develop` branches
- Pull requests

The CI pipeline includes:

1. Linting
2. Type checking
3. Unit and integration tests
4. E2E tests (multiple browsers)
5. Coverage reporting

### GitHub Actions Workflow

The test workflow is defined in `.github/workflows/test.yml` and includes:

- Matrix testing across Node.js versions
- Parallel browser testing for E2E
- Coverage upload to Codecov
- PR comments with coverage reports

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Use Test Utilities**: Leverage the custom render function in `test-utils.tsx`
3. **Mock External Dependencies**: Use MSW for API calls and MongoDB Memory Server for database
4. **Descriptive Test Names**: Use clear, descriptive names that explain what is being tested
5. **Arrange-Act-Assert Pattern**: Structure tests with clear setup, action, and verification phases
6. **Test User Behavior**: Focus on testing what users do, not implementation details
7. **Avoid Testing Implementation**: Don't test internal state or private methods
8. **Use Data Generators**: Use faker.js for generating test data
9. **Clean Up After Tests**: Always clean up resources in `afterEach` or `afterAll` hooks
10. **Parallel Testing**: Run tests in parallel when possible for faster execution

## Debugging Tests

### Jest Tests

```bash
# Run tests in debug mode
node --inspect-brk ./node_modules/.bin/jest --runInBand

# Run specific test file
yarn test path/to/test.spec.ts

# Run tests matching pattern
yarn test --testNamePattern="should create user"
```

### Playwright Tests

```bash
# Debug mode with browser
yarn playwright test --debug

# Headed mode (see browser)
yarn playwright test --headed

# Slow motion
yarn playwright test --headed --slow-mo=1000
```

## Performance Testing

For performance-critical components, consider adding performance tests:

```typescript
import { measureRender } from '@/tests/utils/performance';

test('renders within performance budget', async () => {
  const renderTime = await measureRender(<LargeComponent />);
  expect(renderTime).toBeLessThan(100); // ms
});
```

## Accessibility Testing

Include accessibility tests for components:

```typescript
import { axe } from 'jest-axe';

test('has no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Errors**: Ensure MongoDB Memory Server is properly installed
2. **Playwright Browser Issues**: Run `yarn playwright:install` to install browsers
3. **Module Resolution**: Check `moduleNameMapper` in jest.config.ts
4. **Async Test Timeouts**: Increase timeout for slow tests: `jest.setTimeout(10000)`
5. **Coverage Not Met**: Review uncovered lines in coverage report

### Getting Help

- Check test output for detailed error messages
- Review test logs in CI/CD pipeline
- Use `--verbose` flag for more detailed output
- Consult team documentation or ask for help in team channels

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [MSW Documentation](https://mswjs.io/docs/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

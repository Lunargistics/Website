import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display login form", async ({ page }) => {
    await page.click("text=Sign In");

    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should register a new user", async ({ page }) => {
    const email = faker.internet.email();
    const username = faker.internet.username();
    const password = "SecurePassword123!";

    await page.click("text=Sign Up");

    await page.fill('input[name="email"]', email);
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Registration successful")).toBeVisible();
    await expect(page.locator("text=Please check your email")).toBeVisible();
  });

  test("should login with valid credentials", async ({ page }) => {
    await page.click("text=Sign In");

    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "TestPassword123!");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Dashboard")).toBeVisible();
    await expect(page.locator("text=Welcome back")).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.click("text=Sign In");

    await page.fill('input[name="email"]', "invalid@example.com");
    await page.fill('input[name="password"]', "WrongPassword");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Invalid credentials")).toBeVisible();
  });

  test("should logout successfully", async ({ page }) => {
    await page.click("text=Sign In");

    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "TestPassword123!");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Dashboard")).toBeVisible();

    await page.click('button[aria-label="User menu"]');
    await page.click("text=Logout");

    await expect(page.locator("text=Sign In")).toBeVisible();
  });

  test("should handle password reset flow", async ({ page }) => {
    await page.click("text=Sign In");
    await page.click("text=Forgot password?");

    await expect(page.locator('h1:text("Reset Password")')).toBeVisible();

    await page.fill('input[name="email"]', "test@example.com");
    await page.click('button:text("Send Reset Email")');

    await expect(page.locator("text=Password reset email sent")).toBeVisible();
  });
});

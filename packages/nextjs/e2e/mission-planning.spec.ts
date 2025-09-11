import { expect, test } from "@playwright/test";

test.describe("Mission Planning Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    await page.click("text=Sign In");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "TestPassword123!");
    await page.click('button[type="submit"]');

    await page.waitForURL("**/dashboard");
  });

  test("should display mission planning dashboard", async ({ page }) => {
    await page.click("text=Mission Planning");

    await expect(page.locator('h1:text("Mission Planning Dashboard")')).toBeVisible();
    await expect(page.locator("text=Orbital Mechanics")).toBeVisible();
    await expect(page.locator("text=Launch Windows")).toBeVisible();
    await expect(page.locator("text=Mission Phases")).toBeVisible();
  });

  test("should create a new mission", async ({ page }) => {
    await page.click("text=Mission Planning");
    await page.click('button:text("New Mission")');

    await page.fill('input[name="missionName"]', "Lunar Base Alpha");
    await page.selectOption('select[name="missionType"]', "lunar");
    await page.fill('input[name="launchDate"]', "2025-12-01");
    await page.fill('textarea[name="objectives"]', "Establish permanent lunar base");

    await page.click('button:text("Create Mission")');

    await expect(page.locator("text=Mission created successfully")).toBeVisible();
    await expect(page.locator("text=Lunar Base Alpha")).toBeVisible();
  });

  test("should calculate orbital trajectory", async ({ page }) => {
    await page.click("text=Mission Planning");
    await page.click('tab:text("Trajectory")');

    await page.fill('input[name="altitude"]', "400");
    await page.fill('input[name="inclination"]', "51.6");
    await page.fill('input[name="eccentricity"]', "0.0001");

    await page.click('button:text("Calculate")');

    await expect(page.locator("text=Orbital Period")).toBeVisible();
    await expect(page.locator("text=Delta-V Required")).toBeVisible();
  });

  test("should display launch window analysis", async ({ page }) => {
    await page.click("text=Mission Planning");
    await page.click('tab:text("Launch Windows")');

    await page.selectOption('select[name="targetBody"]', "mars");
    await page.fill('input[name="startDate"]', "2025-06-01");
    await page.fill('input[name="endDate"]', "2025-12-31");

    await page.click('button:text("Analyze")');

    await expect(page.locator("text=Optimal Launch Windows")).toBeVisible();
    await expect(page.locator("canvas#launch-window-chart")).toBeVisible();
  });

  test("should simulate mission phases", async ({ page }) => {
    await page.click("text=Mission Planning");
    await page.click('tab:text("Simulation")');

    await page.click('button:text("Start Simulation")');

    await expect(page.locator("text=Phase 1: Launch")).toBeVisible();
    await page.waitForTimeout(2000);

    await expect(page.locator("text=Phase 2: Orbit Insertion")).toBeVisible();
    await page.waitForTimeout(2000);

    await expect(page.locator("text=Phase 3: Trans-Lunar Injection")).toBeVisible();
  });

  test("should export mission data", async ({ page }) => {
    await page.click("text=Mission Planning");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click('button:text("Export Mission Data")'),
    ]);

    expect(download.suggestedFilename()).toContain("mission-data");
    expect(download.suggestedFilename()).toContain(".json");
  });
});

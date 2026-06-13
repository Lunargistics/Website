/**
 * Black-box auth API integration tests.
 *
 * These are true end-to-end tests: they drive the real HTTP endpoints via
 * supertest and seed/inspect data through Mongoose. They therefore require a
 * running Next.js server (API_BASE_URL) wired to the SAME database the tests
 * seed. That infrastructure is not part of the default jsdom unit run, so the
 * suite is gated behind RUN_INTEGRATION_TESTS to keep the unit run green and
 * honest (it does not pretend these pass when no server is up). Heavy modules
 * (mongoose/supertest) are imported lazily so the file never loads — and never
 * crashes the unit run on Mongoose's ESM — when the suite is skipped.
 *
 * To run: start the app + DB, then
 *   RUN_INTEGRATION_TESTS=1 API_BASE_URL=http://localhost:3000 yarn jest __tests__/integration
 */
const RUN_INTEGRATION = process.env.RUN_INTEGRATION_TESTS === "1" || process.env.RUN_INTEGRATION_TESTS === "true";
const describeIntegration = RUN_INTEGRATION ? describe : describe.skip;

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

// Lazily-bound modules — only loaded when the gated suite actually runs.
let User: any;
let setupTestDatabase: () => Promise<void>;
let teardownTestDatabase: () => Promise<void>;
let clearTestDatabase: () => Promise<void>;
// Typed loosely since both are bound lazily (dynamic import) inside the gated suite.
let bcrypt: typeof import("bcryptjs").default;
let request: any;

describeIntegration("Authentication API Integration Tests", () => {
  beforeAll(async () => {
    User = ((await import("../../../models/User")) as any).default;
    ({ setupTestDatabase, teardownTestDatabase, clearTestDatabase } = await import(
      "../../../tests/utils/db-test-utils"
    ));
    bcrypt = (await import("bcryptjs")).default;
    request = ((await import("supertest")) as any).default;
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        email: "newuser@example.com",
        username: "newuser",
        password: "SecurePassword123!",
      };

      const response = await request(API_BASE_URL).post("/api/auth/register").send(userData).expect(201);

      expect(response.body).toHaveProperty("message", "User registered successfully");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.username).toBe(userData.username);

      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect((user as any)?.username).toBe(userData.username);
    });

    it("should reject registration with existing email", async () => {
      const existingUser = await User.create({
        email: "existing@example.com",
        username: "existinguser",
        password: await bcrypt.hash("password123", 10),
        emailVerified: false,
      });

      const response = await request(API_BASE_URL)
        .post("/api/auth/register")
        .send({
          email: existingUser.email,
          username: "newusername",
          password: "SecurePassword123!",
        })
        .expect(400);

      expect(response.body).toHaveProperty("error", "User already exists");
    });

    it("should reject registration with weak password", async () => {
      const response = await request(API_BASE_URL)
        .post("/api/auth/register")
        .send({
          email: "test@example.com",
          username: "testuser",
          password: "123",
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Password");
    });

    it("should reject registration with invalid email", async () => {
      const response = await request(API_BASE_URL)
        .post("/api/auth/register")
        .send({
          email: "invalid-email",
          username: "testuser",
          password: "SecurePassword123!",
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await User.create({
        email: "testuser@example.com",
        username: "testuser",
        password: await bcrypt.hash("TestPassword123!", 10),
        emailVerified: true,
      });
    });

    it("should login successfully with correct credentials", async () => {
      const response = await request(API_BASE_URL)
        .post("/api/auth/login")
        .send({
          email: "testuser@example.com",
          password: "TestPassword123!",
        })
        .expect(200);

      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.email).toBe("testuser@example.com");
    });

    it("should reject login with incorrect password", async () => {
      const response = await request(API_BASE_URL)
        .post("/api/auth/login")
        .send({
          email: "testuser@example.com",
          password: "WrongPassword",
        })
        .expect(401);

      expect(response.body).toHaveProperty("error", "Invalid credentials");
    });

    it("should reject login with non-existent email", async () => {
      const response = await request(API_BASE_URL)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "TestPassword123!",
        })
        .expect(401);

      expect(response.body).toHaveProperty("error", "Invalid credentials");
    });

    it("should reject login for unverified email", async () => {
      await User.create({
        email: "unverified@example.com",
        username: "unverified",
        password: await bcrypt.hash("TestPassword123!", 10),
        emailVerified: false,
      });

      const response = await request(API_BASE_URL)
        .post("/api/auth/login")
        .send({
          email: "unverified@example.com",
          password: "TestPassword123!",
        })
        .expect(401);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("verify");
    });
  });

  describe("POST /api/auth/forgot-password", () => {
    it("should send password reset email for existing user", async () => {
      await User.create({
        email: "resetuser@example.com",
        username: "resetuser",
        password: await bcrypt.hash("OldPassword123!", 10),
        emailVerified: true,
      });

      const response = await request(API_BASE_URL)
        .post("/api/auth/forgot-password")
        .send({
          email: "resetuser@example.com",
        })
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("reset");

      const user = await User.findOne({ email: "resetuser@example.com" });
      expect((user as any)?.resetPasswordToken).toBeTruthy();
      expect((user as any)?.resetPasswordExpires).toBeTruthy();
    });

    it("should handle non-existent email gracefully", async () => {
      const response = await request(API_BASE_URL)
        .post("/api/auth/forgot-password")
        .send({
          email: "nonexistent@example.com",
        })
        .expect(200);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("POST /api/auth/reset-password", () => {
    it("should reset password with valid token", async () => {
      const resetToken = "valid-reset-token";
      const hashedToken = await bcrypt.hash(resetToken, 10);

      await User.create({
        email: "resetuser@example.com",
        username: "resetuser",
        password: await bcrypt.hash("OldPassword123!", 10),
        emailVerified: true,
        resetPasswordToken: hashedToken,
        resetPasswordExpires: new Date(Date.now() + 3600000),
      });

      const response = await request(API_BASE_URL)
        .post("/api/auth/reset-password")
        .send({
          token: resetToken,
          newPassword: "NewSecurePassword123!",
        })
        .expect(200);

      expect(response.body).toHaveProperty("message", "Password reset successful");

      const user = await User.findOne({ email: "resetuser@example.com" });
      const isNewPasswordValid = await bcrypt.compare("NewSecurePassword123!", user?.password || "");
      expect(isNewPasswordValid).toBe(true);
      expect((user as any)?.resetPasswordToken).toBeUndefined();
      expect((user as any)?.resetPasswordExpires).toBeUndefined();
    });

    it("should reject expired reset token", async () => {
      const resetToken = "expired-token";
      const hashedToken = await bcrypt.hash(resetToken, 10);

      await User.create({
        email: "expireduser@example.com",
        username: "expireduser",
        password: await bcrypt.hash("OldPassword123!", 10),
        emailVerified: true,
        resetPasswordToken: hashedToken,
        resetPasswordExpires: new Date(Date.now() - 3600000),
      });

      const response = await request(API_BASE_URL)
        .post("/api/auth/reset-password")
        .send({
          token: resetToken,
          newPassword: "NewSecurePassword123!",
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("expired");
    });
  });
});

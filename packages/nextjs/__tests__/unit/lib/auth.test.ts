import { authOptions } from "../../../lib/auth";
import { loginRateLimiter } from "../../../lib/rateLimiter";
import User from "../../../models/User";
jest.mock("../../../lib/database/mongodb", () => ({
  connectDB: jest.fn(),
}));

jest.mock("../../../models/User", () => ({
  default: {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock("../../../lib/rateLimiter", () => ({
  loginRateLimiter: {
    check: jest.fn(),
  },
}));

describe("Auth Configuration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Credentials Provider", () => {
    const credentialsProvider = authOptions.providers.find(provider => provider.id === "credentials") as any;

    it("should reject login with missing credentials", async () => {
      const authorize = credentialsProvider?.options?.authorize;

      await expect(authorize?.({}, {} as any)).rejects.toThrow("Invalid credentials");

      await expect(authorize?.({ email: "test@example.com" }, {} as any)).rejects.toThrow("Invalid credentials");

      await expect(authorize?.({ password: "password" }, {} as any)).rejects.toThrow("Invalid credentials");
    });

    it("should reject login when rate limited", async () => {
      const authorize = credentialsProvider?.options?.authorize;

      (loginRateLimiter.check as any).mockReturnValue({
        allowed: false,
        resetTime: Date.now() + 3600000,
      });

      await expect(
        authorize?.({ email: "test@example.com", password: "password" }, {
          headers: { get: () => "127.0.0.1" },
        } as any),
      ).rejects.toThrow(/Too many login attempts/);
    });

    it("should reject login with invalid email", async () => {
      const authorize = credentialsProvider?.options?.authorize;

      (loginRateLimiter.check as any).mockReturnValue({ allowed: true });
      (User.findOne as any).mockResolvedValue(null);

      await expect(authorize?.({ email: "invalid@example.com", password: "password" }, {} as any)).rejects.toThrow(
        "Invalid email or password",
      );
    });

    it("should reject login with invalid password", async () => {
      const authorize = credentialsProvider?.options?.authorize;

      (loginRateLimiter.check as any).mockReturnValue({ allowed: true });
      (User.findOne as any).mockReturnValue({
        select: jest.fn().mockResolvedValue({
          comparePassword: jest.fn().mockResolvedValue(false),
        }),
      });

      await expect(authorize?.({ email: "test@example.com", password: "wrongpassword" }, {} as any)).rejects.toThrow(
        "Invalid email or password",
      );
    });

    it("should reject login for unverified email", async () => {
      const authorize = credentialsProvider?.options?.authorize;

      (loginRateLimiter.check as any).mockReturnValue({ allowed: true });
      (User.findOne as any).mockReturnValue({
        select: jest.fn().mockResolvedValue({
          comparePassword: jest.fn().mockResolvedValue(true),
          emailVerified: false,
        }),
      });

      await expect(authorize?.({ email: "test@example.com", password: "password" }, {} as any)).rejects.toThrow(
        "Please verify your email",
      );
    });

    it("should successfully authenticate valid user", async () => {
      const authorize = credentialsProvider?.options?.authorize;

      const mockUser = {
        _id: "123",
        email: "test@example.com",
        username: "testuser",
        emailVerified: true,
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      (loginRateLimiter.check as any).mockReturnValue({ allowed: true });
      (User.findOne as any).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await authorize?.({ email: "test@example.com", password: "password" }, {} as any);

      expect(result).toEqual({
        id: "123",
        email: "test@example.com",
        username: "testuser",
      });
    });
  });

  describe("Session Callbacks", () => {
    it("should include user id in session", async () => {
      const session = {
        user: { email: "test@example.com" },
      };
      const token = {
        sub: "123",
        email: "test@example.com",
        username: "testuser",
      };

      const result = await authOptions.callbacks?.session?.({ session, token } as any) as any;

      expect(result?.user?.id).toBe("123");
      expect(result?.user?.username).toBe("testuser");
    });
  });

  describe("JWT Callbacks", () => {
    it("should include user data in JWT token", async () => {
      const user = {
        id: "123",
        email: "test@example.com",
        username: "testuser",
      };
      const token = {};

      const result = await authOptions.callbacks?.jwt?.({ token, user } as any);

      expect(result?.id).toBe("123");
      expect(result?.username).toBe("testuser");
    });
  });
});

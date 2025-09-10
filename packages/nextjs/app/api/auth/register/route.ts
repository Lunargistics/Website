/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { AuthErrorHandler, handleAuthError } from "~~/lib/errorHandler";
import dbConnect from "~~/lib/mongodb";
import { getClientIP, registerRateLimiter } from "~~/lib/rateLimiter";
import User from "~~/models/User";

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 12) {
    return { valid: false, message: "Password must be at least 12 characters long" };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter" };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }

  // Safe special characters that won't cause scripting issues
  if (!/[!@#$%^&*()_+=\[\]{};':",.<>?/|\-]/.test(password)) {
    return { valid: false, message: "Password must contain at least one special character" };
  }

  return { valid: true };
}

export async function POST(request: Request) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimit = registerRateLimiter.check(clientIP);

    if (!rateLimit.allowed) {
      const resetDate = new Date(rateLimit.resetTime);
      return NextResponse.json(
        {
          error: `Too many registration attempts. Please try again after ${resetDate.toLocaleTimeString()}.`,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
            "X-RateLimit-Reset": rateLimit.resetTime.toString(),
            "Retry-After": Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          },
        },
      );
    }

    console.log("Registration endpoint called");
    const { email, password, name } = await request.json();
    console.log("Registration attempt for email:", email);

    if (!email || !password) {
      return AuthErrorHandler.createResponse(
        AuthErrorHandler.createError("VALIDATION_ERROR", "Email and password are required"),
      );
    }

    if (!validateEmail(email)) {
      return AuthErrorHandler.createResponse(AuthErrorHandler.createError("INVALID_EMAIL"));
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return AuthErrorHandler.createResponse(AuthErrorHandler.createError("WEAK_PASSWORD", passwordValidation.message));
    }

    console.log("Connecting to MongoDB...");
    await dbConnect();
    console.log("Connected to MongoDB");

    // Check if email already exists (case-insensitive)
    const existingUser = await User.findOne({
      emailLower: email.toLowerCase(),
    });

    if (existingUser) {
      return AuthErrorHandler.createResponse(AuthErrorHandler.createError("EMAIL_EXISTS"));
    }

    // Create user with email verification token
    const user = new User({
      email,
      emailLower: email.toLowerCase(),
      password,
      name: name || email.split("@")[0],
      emailVerified: false,
    });

    // Generate email verification token
    const verificationToken = user.createEmailVerificationToken();
    await user.save();

    // In production, send verification email here
    // For now, we'll log the token
    console.log("Verification token:", verificationToken);
    console.log("Verification URL:", `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`);

    return AuthErrorHandler.createSuccessResponse(
      {
        verificationUrl: `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        },
      },
      "Account created successfully. Please check your email to verify your account.",
      201,
    );
  } catch (error: any) {
    console.error("Registration error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    const authError = handleAuthError(error);
    return AuthErrorHandler.createResponse(authError);
  }
}

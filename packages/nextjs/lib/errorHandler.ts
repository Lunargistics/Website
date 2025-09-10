import { NextResponse } from "next/server";

export interface AuthError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}

export class AuthErrorHandler {
  static createError(code: string, customMessage?: string, details?: any): AuthError {
    const errors: Record<string, AuthError> = {
      // Registration errors
      EMAIL_EXISTS: {
        code: "EMAIL_EXISTS",
        message: customMessage || "An account with this email already exists",
        statusCode: 400,
      },
      INVALID_EMAIL: {
        code: "INVALID_EMAIL",
        message: customMessage || "Please provide a valid email address",
        statusCode: 400,
      },
      WEAK_PASSWORD: {
        code: "WEAK_PASSWORD",
        message: customMessage || "Password does not meet security requirements",
        statusCode: 400,
      },
      REGISTRATION_FAILED: {
        code: "REGISTRATION_FAILED",
        message: customMessage || "Failed to create account. Please try again.",
        statusCode: 500,
      },

      // Login errors
      INVALID_CREDENTIALS: {
        code: "INVALID_CREDENTIALS",
        message: customMessage || "Invalid email or password",
        statusCode: 401,
      },
      EMAIL_NOT_VERIFIED: {
        code: "EMAIL_NOT_VERIFIED",
        message:
          customMessage || "Please verify your email before signing in. Check your email for a verification link.",
        statusCode: 403,
      },
      ACCOUNT_LOCKED: {
        code: "ACCOUNT_LOCKED",
        message: customMessage || "Account is temporarily locked due to too many failed attempts",
        statusCode: 423,
      },
      LOGIN_FAILED: {
        code: "LOGIN_FAILED",
        message: customMessage || "Login failed. Please try again.",
        statusCode: 500,
      },

      // Email verification errors
      INVALID_TOKEN: {
        code: "INVALID_TOKEN",
        message: customMessage || "Invalid or expired verification token",
        statusCode: 400,
      },
      VERIFICATION_FAILED: {
        code: "VERIFICATION_FAILED",
        message: customMessage || "Failed to verify email. Please try again.",
        statusCode: 500,
      },

      // Password reset errors
      RESET_TOKEN_EXPIRED: {
        code: "RESET_TOKEN_EXPIRED",
        message: customMessage || "Password reset token has expired",
        statusCode: 400,
      },
      RESET_TOKEN_INVALID: {
        code: "RESET_TOKEN_INVALID",
        message: customMessage || "Invalid password reset token",
        statusCode: 400,
      },
      RESET_FAILED: {
        code: "RESET_FAILED",
        message: customMessage || "Failed to reset password. Please try again.",
        statusCode: 500,
      },

      // Rate limiting errors
      RATE_LIMIT_EXCEEDED: {
        code: "RATE_LIMIT_EXCEEDED",
        message: customMessage || "Too many requests. Please try again later.",
        statusCode: 429,
      },

      // General errors
      VALIDATION_ERROR: {
        code: "VALIDATION_ERROR",
        message: customMessage || "Invalid input data",
        statusCode: 400,
      },
      DATABASE_ERROR: {
        code: "DATABASE_ERROR",
        message: customMessage || "Database error occurred",
        statusCode: 500,
      },
      NETWORK_ERROR: {
        code: "NETWORK_ERROR",
        message: customMessage || "Network error occurred",
        statusCode: 500,
      },
      UNKNOWN_ERROR: {
        code: "UNKNOWN_ERROR",
        message: customMessage || "An unexpected error occurred",
        statusCode: 500,
      },
    };

    const error = errors[code] || errors.UNKNOWN_ERROR;
    return { ...error, details };
  }

  static handleDatabaseError(error: any): AuthError {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return this.createError("VALIDATION_ERROR", messages.join(", "));
    }

    if (error.name === "MongoError" || error.name === "MongoServerError") {
      return this.createError("DATABASE_ERROR", "Database operation failed");
    }

    return this.createError("UNKNOWN_ERROR", "An unexpected error occurred");
  }

  static createResponse(error: AuthError, headers?: Record<string, string>) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error.details && { details: error.details }),
      },
      {
        status: error.statusCode,
        headers,
      },
    );
  }

  static createSuccessResponse(data: any, message?: string, statusCode: number = 200) {
    return NextResponse.json(
      {
        success: true,
        message,
        ...data,
      },
      { status: statusCode },
    );
  }
}

// Helper functions for common error scenarios
export function handleAuthError(error: any): AuthError {
  // Handle specific error types
  if (error.message?.includes("Invalid email or password")) {
    return AuthErrorHandler.createError("INVALID_CREDENTIALS");
  }

  if (error.message?.includes("verify your email")) {
    return AuthErrorHandler.createError("EMAIL_NOT_VERIFIED");
  }

  if (error.message?.includes("Too many")) {
    return AuthErrorHandler.createError("RATE_LIMIT_EXCEEDED", error.message);
  }

  if (error.name === "ValidationError" || error.name === "CastError") {
    return AuthErrorHandler.createError("VALIDATION_ERROR", "Invalid input data");
  }

  if (error.name === "MongoError" || error.name === "MongoServerError") {
    return AuthErrorHandler.createError("DATABASE_ERROR");
  }

  // Default to unknown error
  return AuthErrorHandler.createError("UNKNOWN_ERROR", error.message || "An unexpected error occurred");
}

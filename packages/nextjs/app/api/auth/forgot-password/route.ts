import { NextResponse } from "next/server";
import dbConnect from "~~/lib/mongodb";
import { prisma } from "~~/lib/prisma";
import { getClientIP, resetRateLimiter } from "~~/lib/rateLimiter";

export async function POST(request: Request) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimit = resetRateLimiter.check(clientIP);

    if (!rateLimit.allowed) {
      const resetDate = new Date(rateLimit.resetTime);
      return NextResponse.json(
        {
          error: `Too many password reset requests. Please try again after ${resetDate.toLocaleTimeString()}.`,
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

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await dbConnect();

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    // Always return success message to prevent email enumeration
    if (!user) {
      return NextResponse.json(
        { message: "If an account exists with this email, you will receive password reset instructions." },
        { status: 200 },
      );
    }

    // TODO: Implement password reset token generation
    // Generate reset token
    // const resetToken = user.createPasswordResetToken();
    // await user.save({ validateBeforeSave: false });

    // Temporary: Generate a simple token
    const resetToken = Math.random().toString(36).substring(2, 15);

    // In production, send email here
    // For now, log the reset URL
    const resetURL = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
    console.log("Password reset URL:", resetURL);
    console.log("Reset token expires in 30 minutes");

    // TODO: Send email with reset link
    // await sendPasswordResetEmail(user.email, resetURL);

    return NextResponse.json(
      { message: "If an account exists with this email, you will receive password reset instructions." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "An error occurred. Please try again later." }, { status: 500 });
  }
}

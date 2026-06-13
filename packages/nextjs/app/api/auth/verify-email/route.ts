import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "~~/lib/mongodb";
import { prisma } from "~~/lib/prisma";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 });
    }

    await dbConnect();

    // Hash the token to compare with stored version
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid verification token
    const existingUser = await prisma.user.findFirst({
      where: {
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { gt: new Date() },
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 });
    }

    // Update user as verified and clear verification token
    const user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    return NextResponse.json(
      {
        message: "Email verified successfully!",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "An error occurred while verifying your email. Please try again." },
      { status: 500 },
    );
  }
}

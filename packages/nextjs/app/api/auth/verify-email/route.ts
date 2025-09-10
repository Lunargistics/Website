import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "~~/lib/mongodb";
import User from "~~/models/User";

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
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 });
    }

    // Update user as verified and clear verification token
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return NextResponse.json(
      {
        message: "Email verified successfully!",
        user: {
          id: (user as any)._id.toString(),
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

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "~~/lib/auth";
import dbConnect from "~~/lib/mongodb";
import User from "~~/models/User";

// GET current user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id)
      .select("-password")
      .populate("followers", "username name avatar")
      .populate("following", "username name avatar");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT update profile
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, bio, avatar, walletAddress } = await request.json();

    await dbConnect();

    // Check if wallet address is already taken by another user
    if (walletAddress) {
      const existingWallet = await User.findOne({
        walletAddress,
        _id: { $ne: session.user.id },
      });

      if (existingWallet) {
        return NextResponse.json({ error: "Wallet address already connected to another account" }, { status: 400 });
      }
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
        ...(walletAddress !== undefined && { walletAddress }),
      },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error: any) {
    console.error("Profile update error:", error);

    if (error.code === 11000 && error.keyPattern?.walletAddress) {
      return NextResponse.json({ error: "Wallet address already connected to another account" }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

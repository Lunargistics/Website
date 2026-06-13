import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "~~/lib/auth";
import dbConnect from "~~/lib/mongodb";
import { prisma } from "~~/lib/prisma";

// Projection used when "populating" follower/following user ids.
const FOLLOW_SELECT = { id: true, username: true, name: true, avatar: true } as const;

// GET current user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      omit: { password: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Replace follower/following id arrays with the populated user shape.
    const [followers, following] = await Promise.all([
      prisma.user.findMany({ where: { id: { in: user.followers } }, select: FOLLOW_SELECT }),
      prisma.user.findMany({ where: { id: { in: user.following } }, select: FOLLOW_SELECT }),
    ]);

    return NextResponse.json({ user: { ...user, followers, following } as any });
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
      const existingWallet = await prisma.user.findFirst({
        where: {
          walletAddress,
          id: { not: session.user.id },
        },
      });

      if (existingWallet) {
        return NextResponse.json({ error: "Wallet address already connected to another account" }, { status: 400 });
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
        ...(walletAddress !== undefined && { walletAddress }),
      },
      omit: { password: true },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error: any) {
    console.error("Profile update error:", error);

    // Prisma unique-constraint violation on walletAddress (P2002).
    if (error?.code === "P2002" && (error?.meta?.target as string[] | undefined)?.includes("walletAddress")) {
      return NextResponse.json({ error: "Wallet address already connected to another account" }, { status: 400 });
    }

    // Record not found (e.g. stale session id) — preserve the 404 behavior.
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

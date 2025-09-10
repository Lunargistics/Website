import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "~~/lib/auth";
import dbConnect from "~~/lib/mongodb";
import User from "~~/models/User";

// POST follow user
export async function POST(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Find target user
    const targetUser = await User.findOne({
      usernameLower: username.toLowerCase(),
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if ((targetUser as any)._id.toString() === session.user.id) {
      return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
    }

    // Add to following list of current user
    const currentUser = await User.findById(session.user.id);

    if (!currentUser) {
      return NextResponse.json({ error: "Current user not found" }, { status: 404 });
    }

    // Check if already following
    const isFollowing = currentUser.following.includes((targetUser as any)._id);

    if (isFollowing) {
      return NextResponse.json({ error: "Already following this user" }, { status: 400 });
    }

    // Update both users
    currentUser.following.push((targetUser as any)._id);
    targetUser.followers.push((currentUser as any)._id);

    await currentUser.save();
    await targetUser.save();

    return NextResponse.json({
      message: "Successfully followed user",
      followingCount: currentUser.followingCount,
      targetFollowerCount: targetUser.followerCount,
    });
  } catch (error) {
    console.error("Follow error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE unfollow user
export async function DELETE(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Find target user
    const targetUser = await User.findOne({
      usernameLower: username.toLowerCase(),
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove from following list of current user
    const currentUser = await User.findById(session.user.id);

    if (!currentUser) {
      return NextResponse.json({ error: "Current user not found" }, { status: 404 });
    }

    // Check if following
    const followingIndex = currentUser.following.indexOf((targetUser as any)._id);

    if (followingIndex === -1) {
      return NextResponse.json({ error: "Not following this user" }, { status: 400 });
    }

    // Update both users
    currentUser.following.splice(followingIndex, 1);
    const followerIndex = targetUser.followers.indexOf((currentUser as any)._id);
    if (followerIndex > -1) {
      targetUser.followers.splice(followerIndex, 1);
    }

    await currentUser.save();
    await targetUser.save();

    return NextResponse.json({
      message: "Successfully unfollowed user",
      followingCount: currentUser.followingCount,
      targetFollowerCount: targetUser.followerCount,
    });
  } catch (error) {
    console.error("Unfollow error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

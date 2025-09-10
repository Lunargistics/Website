import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "~~/lib/auth";
import dbConnect from "~~/lib/mongodb";
import Post from "~~/models/Post";

// POST like/unlike post
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const userIdString = session.user.id.toString();
    const likeIndex = post.likes.findIndex((id: any) => id.toString() === userIdString);

    if (likeIndex === -1) {
      // Like the post
      post.likes.push(session.user.id as any);
    } else {
      // Unlike the post
      post.likes.splice(likeIndex, 1);
    }

    await post.save();

    return NextResponse.json({
      message: likeIndex === -1 ? "Post liked" : "Post unliked",
      liked: likeIndex === -1,
      likeCount: post.likeCount,
    });
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

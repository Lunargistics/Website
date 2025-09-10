import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "~~/lib/auth";
import dbConnect from "~~/lib/mongodb";
import Post from "~~/models/Post";

// POST share post
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await request.json();

    await dbConnect();

    const originalPost = await Post.findById(id).populate("author", "username name avatar");

    if (!originalPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Add user to shares if not already shared
    const userIdString = session.user.id.toString();
    const hasShared = originalPost.shares.some((id: any) => id.toString() === userIdString);

    if (!hasShared) {
      originalPost.shares.push(session.user.id as any);
      await originalPost.save();
    }

    // Create a new post with share content
    const shareContent = content
      ? `${content}\n\n---\nShared from @${(originalPost.author as any).username}:\n${originalPost.content}`
      : `Shared from @${(originalPost.author as any).username}:\n${originalPost.content}`;

    const sharedPost = await Post.create({
      author: session.user.id as any,
      content: shareContent,
      images: originalPost.images,
      tags: [...(originalPost.tags || []), "shared"],
      likes: [],
      shares: [],
      comments: [],
    });

    await sharedPost.populate("author", "username name avatar");

    return NextResponse.json(
      {
        message: "Post shared successfully",
        post: sharedPost,
        shareCount: originalPost.shareCount,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Share error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

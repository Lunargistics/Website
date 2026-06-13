import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "~~/lib/auth";
import dbConnect from "~~/lib/mongodb";
import { prisma } from "~~/lib/prisma";

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

    const originalPost = await prisma.post.findUnique({ where: { id } });

    if (!originalPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Resolve the original author's username (was previously .populate("author"))
    const originalAuthor = await prisma.user.findUnique({
      where: { id: originalPost.author },
      select: { username: true },
    });

    // Add user to shares if not already shared
    const userIdString = session.user.id.toString();
    const hasShared = originalPost.shares.some(shareId => shareId === userIdString);

    let shareCount = originalPost.shareCount;
    if (!hasShared) {
      const newShares = [...originalPost.shares, userIdString];
      const updated = await prisma.post.update({
        where: { id },
        data: { shares: newShares, shareCount: newShares.length },
      });
      shareCount = updated.shareCount;
    }

    // Create a new post with share content
    const shareContent = content
      ? `${content}\n\n---\nShared from @${originalAuthor?.username}:\n${originalPost.content}`
      : `Shared from @${originalAuthor?.username}:\n${originalPost.content}`;

    const rawSharedPost = await prisma.post.create({
      data: {
        author: session.user.id as string,
        content: shareContent,
        images: originalPost.images,
        tags: [...(originalPost.tags || []), "shared"],
        likes: [],
        likeCount: 0,
        shares: [],
        shareCount: 0,
        comments: [] as unknown as Prisma.InputJsonValue,
        commentCount: 0,
      },
    });

    // Populate author info on the shared post
    const sharedAuthor = await prisma.user.findUnique({
      where: { id: rawSharedPost.author },
      select: { id: true, username: true, name: true, avatar: true },
    });

    const sharedPost = {
      ...rawSharedPost,
      author: sharedAuthor ?? rawSharedPost.author,
    };

    return NextResponse.json(
      {
        message: "Post shared successfully",
        post: sharedPost,
        shareCount,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Share error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "~~/lib/auth";
import dbConnect from "~~/lib/mongodb";
import { prisma } from "~~/lib/prisma";

// POST like/unlike post
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const userIdString = session.user.id.toString();

    const result = await prisma.$transaction(async tx => {
      const post = await tx.post.findUnique({ where: { id } });

      if (!post) {
        return null;
      }

      const likeIndex = post.likes.findIndex(likeId => likeId === userIdString);
      let newLikes: string[];

      if (likeIndex === -1) {
        // Like the post
        newLikes = [...post.likes, userIdString];
      } else {
        // Unlike the post
        newLikes = post.likes.filter((_, index) => index !== likeIndex);
      }

      const updated = await tx.post.update({
        where: { id },
        data: { likes: newLikes, likeCount: newLikes.length },
      });

      return { liked: likeIndex === -1, likeCount: updated.likeCount };
    });

    if (!result) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: result.liked ? "Post liked" : "Post unliked",
      liked: result.liked,
      likeCount: result.likeCount,
    });
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "~~/lib/auth";
import dbConnect from "~~/lib/mongodb";
import { prisma } from "~~/lib/prisma";

// import User from "~~/models/User";

type UserProjection = {
  id: string;
  username: string | null;
  name: string | null;
  avatar: string | null;
};

// Collect every user id referenced by a set of posts (authors, likers, sharers,
// comment authors) and fetch the projection that .populate() used to return.
async function buildUserMap(posts: any[]): Promise<Map<string, UserProjection>> {
  const ids = new Set<string>();
  for (const post of posts) {
    if (post.author) ids.add(post.author);
    for (const id of post.likes || []) ids.add(id);
    for (const id of post.shares || []) ids.add(id);
    for (const comment of (post.comments as any[]) || []) {
      if (comment?.author) ids.add(comment.author);
    }
  }

  if (ids.size === 0) return new Map();

  const users = await prisma.user.findMany({
    where: { id: { in: Array.from(ids) } },
    select: { id: true, username: true, name: true, avatar: true },
  });

  return new Map(users.map(u => [u.id, u]));
}

// Re-shape a raw post into the same nested JSON the populated Mongoose doc returned.
function populatePost(post: any, userMap: Map<string, UserProjection>) {
  const likes = (post.likes || []).map((id: string) => ({ username: userMap.get(id)?.username ?? null }));
  const shares = (post.shares || []).map((id: string) => ({ username: userMap.get(id)?.username ?? null }));
  const comments = ((post.comments as any[]) || []).map(comment => ({
    ...comment,
    author: userMap.get(comment.author) ?? comment.author,
  }));

  return {
    ...post,
    author: userMap.get(post.author) ?? post.author,
    likes,
    shares,
    comments,
  };
}

// GET posts (feed)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const authorId = searchParams.get("author");
    const tag = searchParams.get("tag");

    await dbConnect();

    // Build query
    const where: any = {};
    if (authorId) {
      where.author = authorId;
    }
    if (tag) {
      where.tags = { has: tag.toLowerCase() };
    }

    // Get posts with pagination
    const rawPosts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    });

    const userMap = await buildUserMap(rawPosts);
    const posts = rawPosts.map(post => populatePost(post, userMap));

    const total = await prisma.post.count({ where });

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Posts fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST create new post
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, images, tags } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Post content is required" }, { status: 400 });
    }

    await dbConnect();

    // Extract hashtags from content
    const hashtagRegex = /#[\w]+/g;
    const extractedTags = content.match(hashtagRegex) || [];
    const allTags = [...new Set([...extractedTags.map((tag: string) => tag.slice(1).toLowerCase()), ...(tags || [])])];

    const rawPost = await prisma.post.create({
      data: {
        author: session.user.id as string,
        content: content.trim(),
        images: images || [],
        tags: allTags,
        likes: [],
        likeCount: 0,
        shares: [],
        shareCount: 0,
        comments: [] as unknown as Prisma.InputJsonValue,
        commentCount: 0,
      },
    });

    // Populate author info
    const userMap = await buildUserMap([rawPost]);
    const post = populatePost(rawPost, userMap);

    return NextResponse.json(
      {
        message: "Post created successfully",
        post,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Post creation error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

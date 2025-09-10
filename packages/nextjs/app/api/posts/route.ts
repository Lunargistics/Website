import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "~~/lib/auth";
import dbConnect from "~~/lib/mongodb";
import Post from "~~/models/Post";

// import User from "~~/models/User";

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
    const query: any = {};
    if (authorId) {
      query.author = authorId;
    }
    if (tag) {
      query.tags = tag.toLowerCase();
    }

    // Get posts with pagination
    const posts = await Post.find(query)
      .populate("author", "username name avatar")
      .populate("likes", "username")
      .populate("shares", "username")
      .populate("comments.author", "username name avatar")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments(query);

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

    const post = await Post.create({
      author: session.user.id as any,
      content: content.trim(),
      images: images || [],
      tags: allTags,
      likes: [],
      shares: [],
      comments: [],
    });

    // Populate author info
    await post.populate("author", "username name avatar");

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

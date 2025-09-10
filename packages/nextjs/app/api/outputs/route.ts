import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "~~/lib/auth";
import dbConnect from "~~/lib/mongodb";
import GeneratedOutput from "~~/models/GeneratedOutput";

// GET /api/outputs - Get all outputs for authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = parseInt(searchParams.get("skip") || "0");

    const query: any = { userId: session.user.email };
    if (type) {
      query.type = type;
    }

    const outputs = await GeneratedOutput.find(query).sort({ createdAt: -1 }).limit(limit).skip(skip).lean();

    const total = await GeneratedOutput.countDocuments(query);

    return NextResponse.json({
      outputs,
      total,
      limit,
      skip,
      hasMore: skip + outputs.length < total,
    });
  } catch (error) {
    console.error("Error fetching outputs:", error);
    return NextResponse.json({ error: "Failed to fetch outputs" }, { status: 500 });
  }
}

// POST /api/outputs - Create new output for authenticated user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, prompt, output, metadata } = body;

    if (!type || !prompt || !output) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();

    const generatedOutput = await GeneratedOutput.create({
      userId: session.user.email,
      type,
      prompt,
      output,
      metadata,
    });

    return NextResponse.json(generatedOutput, { status: 201 });
  } catch (error) {
    console.error("Error creating output:", error);
    return NextResponse.json({ error: "Failed to create output" }, { status: 500 });
  }
}

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
      console.log("Unauthorized access attempt to /api/outputs");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Invalid JSON in request body:", parseError);
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const { type, prompt, output, metadata } = body;

    if (!type || !prompt || !output) {
      console.error("Missing required fields:", { type: !!type, prompt: !!prompt, output: !!output });
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: { type: !!type, prompt: !!prompt, output: !!output },
        },
        { status: 400 },
      );
    }

    // Validate type enum
    const validTypes = ["mission_plan", "icd_driver", "test_case", "orbital_analysis"];
    if (!validTypes.includes(type)) {
      console.error("Invalid type:", type, "Valid types:", validTypes);
      return NextResponse.json(
        {
          error: "Invalid type",
          validTypes,
        },
        { status: 400 },
      );
    }

    console.log("Connecting to database...");
    await dbConnect();

    console.log("Creating output for user:", session.user.email, "type:", type);
    const generatedOutput = await GeneratedOutput.create({
      userId: session.user.email,
      type,
      prompt,
      output,
      metadata: metadata || {},
    });

    console.log("Output created successfully:", generatedOutput._id);
    return NextResponse.json(generatedOutput, { status: 201 });
  } catch (error: any) {
    console.error("Error creating output:", error);

    // Provide more specific error information
    if (error?.name === "ValidationError") {
      return NextResponse.json(
        {
          error: "Validation error",
          details: error.message,
        },
        { status: 400 },
      );
    }

    if (error?.name === "MongoError" || error?.name === "MongooseError") {
      console.error("Database error:", error.message);
      return NextResponse.json(
        {
          error: "Database connection error",
          details: process.env.NODE_ENV === "development" ? error.message : "Database unavailable",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : "An unexpected error occurred",
      },
      { status: 500 },
    );
  }
}

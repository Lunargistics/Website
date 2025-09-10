import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "~~/lib/auth";
import dbConnect from "~~/lib/mongodb";
import GeneratedOutput from "~~/models/GeneratedOutput";

// GET /api/outputs/[id] - Get specific output for authenticated user
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const resolvedParams = await params;

    const output = await GeneratedOutput.findOne({
      _id: resolvedParams.id,
      userId: session.user.email,
    });

    if (!output) {
      return NextResponse.json({ error: "Output not found" }, { status: 404 });
    }

    return NextResponse.json(output);
  } catch (error) {
    console.error("Error fetching output:", error);
    return NextResponse.json({ error: "Failed to fetch output" }, { status: 500 });
  }
}

// DELETE /api/outputs/[id] - Delete specific output for authenticated user
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const resolvedParams = await params;

    const result = await GeneratedOutput.deleteOne({
      _id: resolvedParams.id,
      userId: session.user.email,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Output not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Output deleted successfully" });
  } catch (error) {
    console.error("Error deleting output:", error);
    return NextResponse.json({ error: "Failed to delete output" }, { status: 500 });
  }
}

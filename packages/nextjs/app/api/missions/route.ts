import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "~~/lib/auth";
import dbConnect from "~~/lib/mongodb";

// Mission schema (you'll need to create a proper Mongoose model)
// interface Mission {
//   userId: string;
//   name: string;
//   description: string;
//   elements: any[];
//   aiResponse: string;
//   createdAt: Date;
//   updatedAt: Date;
// }

// GET - Fetch user's missions
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // For now, return empty array - in production, fetch from MongoDB
    // const missions = await Mission.find({ userId: session.user.id }).sort({ createdAt: -1 });

    return NextResponse.json({ missions: [] });
  } catch (error) {
    console.error("Error fetching missions:", error);
    return NextResponse.json({ error: "Failed to fetch missions" }, { status: 500 });
  }
}

// POST - Save a new mission
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, elements, aiResponse } = body;

    if (!name || !description) {
      return NextResponse.json({ error: "Name and description are required" }, { status: 400 });
    }

    await dbConnect();

    // In production, save to MongoDB
    const mission = {
      id: Date.now().toString(),
      userId: session.user.id,
      name,
      description,
      elements: elements || [],
      aiResponse: aiResponse || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // const savedMission = await Mission.create(mission);

    return NextResponse.json({ mission, message: "Mission saved successfully" });
  } catch (error) {
    console.error("Error saving mission:", error);
    return NextResponse.json({ error: "Failed to save mission" }, { status: 500 });
  }
}

// DELETE - Delete a mission
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const missionId = searchParams.get("id");

    if (!missionId) {
      return NextResponse.json({ error: "Mission ID required" }, { status: 400 });
    }

    await dbConnect();

    // In production, delete from MongoDB
    // await Mission.findOneAndDelete({ _id: missionId, userId: session.user.id });

    return NextResponse.json({ message: "Mission deleted successfully" });
  } catch (error) {
    console.error("Error deleting mission:", error);
    return NextResponse.json({ error: "Failed to delete mission" }, { status: 500 });
  }
}

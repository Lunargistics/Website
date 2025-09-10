/**
 * Mission Planning Suite REST API
 * Provides external access to mission data and operations
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth, withCredits } from "~~/lib/creditMiddleware";

// Mock services for now
const pinataService = {
  uploadMissionData: async (_data?: any) => ({ cid: "mock-cid" }),
  getMissionData: async (_cid?: string) => ({}),
  listPins: async (_filters?: any) => ({
    rows: [
      { id: "1", name: "Mission Alpha", type: "Earth Observation" },
      { id: "2", name: "Mission Beta", type: "Communication" },
    ],
    count: 2,
  }),
  pinMissionData: async (_data?: any) => "QmMockIPFSHash123",
  unpin: async (_hash?: string) => true,
};

// Unused services - commented out for now
// const orbitService = {
//   calculateOrbit: () => ({ position: { x: 0, y: 0, z: 0 }, velocity: { x: 0, y: 0, z: 0 } }),
// };
//
// const documentGenerator = {
//   generateMissionDocument: () => "# Mission Document\n\nGenerated document content...",
// };

// GET /api/missions - List all missions (Free endpoint with auth)
// GET /api/missions?id=123 - Get specific mission
export async function GET(request: NextRequest) {
  return withAuth(request, async _userId => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const missionId = searchParams.get("id");
      const missionName = searchParams.get("name");

      if (missionId) {
        // In production, would fetch from blockchain contract
        // For now, return mock data
        return NextResponse.json({
          id: missionId,
          name: "Sample Mission",
          type: "Earth Observation",
          status: "Active",
          ipfsHash: "QmSampleHash",
        });
      }

      if (missionName) {
        // Search missions by name in IPFS
        const pins = await pinataService.listPins({
          missionName: missionName,
          type: "mission",
        });

        return NextResponse.json({
          missions: pins.rows,
          total: pins.count,
        });
      }

      // List all missions
      const pins = await pinataService.listPins({
        type: "mission",
        pageLimit: 20,
      });

      return NextResponse.json({
        missions: pins.rows,
        total: pins.count,
      });
    } catch (error) {
      console.error("Error fetching missions:", error);
      return NextResponse.json({ error: "Failed to fetch missions" }, { status: 500 });
    }
  });
}

// POST /api/missions - Create new mission (Costs 5 credits)
export async function POST(request: NextRequest) {
  return withCredits(request, async _userId => {
    try {
      const body = await request.json();

      // Validate required fields
      if (!body.name || !body.type) {
        return NextResponse.json({ error: "Missing required fields: name, type" }, { status: 400 });
      }

      // Save to IPFS
      const ipfsHash = await pinataService.pinMissionData(body);

      // In production, would also create on-chain record

      return NextResponse.json({
        success: true,
        ipfsHash: ipfsHash,
        message: "Mission created successfully",
      });
    } catch (error) {
      console.error("Error creating mission:", error);
      return NextResponse.json({ error: "Failed to create mission" }, { status: 500 });
    }
  });
}

// PUT /api/missions - Update mission (Costs 3 credits)
export async function PUT(request: NextRequest) {
  return withCredits(request, async _userId => {
    try {
      const body = await request.json();

      if (!body.id) {
        return NextResponse.json({ error: "Mission ID required" }, { status: 400 });
      }

      // Update IPFS data
      const ipfsHash = await pinataService.pinMissionData(body);

      // In production, would update blockchain record

      return NextResponse.json({
        success: true,
        ipfsHash: ipfsHash,
        message: "Mission updated successfully",
      });
    } catch (error) {
      console.error("Error updating mission:", error);
      return NextResponse.json({ error: "Failed to update mission" }, { status: 500 });
    }
  });
}

// DELETE /api/missions?id=123 - Delete mission (Costs 1 credit)
export async function DELETE(request: NextRequest) {
  return withCredits(request, async _userId => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const missionId = searchParams.get("id");
      const ipfsHash = searchParams.get("hash");

      if (!missionId && !ipfsHash) {
        return NextResponse.json({ error: "Mission ID or IPFS hash required" }, { status: 400 });
      }

      if (ipfsHash) {
        // Unpin from IPFS
        await pinataService.unpin(ipfsHash);
      }

      // In production, would also update blockchain status

      return NextResponse.json({
        success: true,
        message: "Mission deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting mission:", error);
      return NextResponse.json({ error: "Failed to delete mission" }, { status: 500 });
    }
  });
}

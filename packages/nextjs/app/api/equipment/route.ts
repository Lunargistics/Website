import { NextRequest, NextResponse } from "next/server";

// This would typically connect to actual supplier APIs
// For now, we'll use mock data and caching

// Future implementation will use these APIs
// const SUPPLIER_APIS = {
//   cubesatshop: "https://api.cubesatshop.com/v1/products",
//   satsearch: "https://api.satsearch.co/v1/products",
//   endurosat: "https://api.endurosat.com/products",
// };

// Cache for supplier data (in production, use Redis or similar)
const cache = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const supplier = searchParams.get("supplier");
    const search = searchParams.get("search");

    const cacheKey = `${category}-${supplier}-${search}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && cached.timestamp > Date.now() - CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // In production, make actual API calls to suppliers
    // For now, return mock data based on category
    const mockData = getMockEquipment(category, supplier, search);

    // Cache the result
    cache.set(cacheKey, {
      data: mockData,
      timestamp: Date.now(),
    });

    return NextResponse.json(mockData);
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json({ error: "Failed to fetch equipment data" }, { status: 500 });
  }
}

// POST endpoint for getting AI recommendations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { missionType, satelliteSize, budget, requirements } = body;

    // Generate AI-powered recommendations based on mission requirements
    const recommendations = await generateRecommendations({
      missionType,
      satelliteSize,
      budget,
      requirements,
    });

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 });
  }
}

function getMockEquipment(category: string | null, supplier: string | null, search: string | null) {
  // This would be replaced with actual API calls
  const equipment = [
    {
      id: "mock-1",
      name: "High-Performance OBC",
      category: "OBC",
      supplier: "CubeSat Shop",
      price: "$8,500",
      specs: {
        processor: "ARM Cortex-M7",
        memory: "512MB RAM",
      },
    },
    {
      id: "mock-2",
      name: "S-Band Transmitter",
      category: "COMM",
      supplier: "Satsearch",
      price: "$12,000",
      specs: {
        frequency: "2.2-2.3 GHz",
        dataRate: "2 Mbps",
      },
    },
  ];

  let filtered = equipment;

  if (category) {
    filtered = filtered.filter(eq => eq.category === category);
  }

  if (supplier) {
    filtered = filtered.filter(eq => eq.supplier.toLowerCase().includes(supplier.toLowerCase()));
  }

  if (search) {
    filtered = filtered.filter(eq => eq.name.toLowerCase().includes(search.toLowerCase()));
  }

  return {
    equipment: filtered,
    total: filtered.length,
    suppliers: ["CubeSat Shop", "Satsearch", "EnduroSat"],
  };
}

async function generateRecommendations(params: any) {
  // This would use AI to generate personalized recommendations
  // For now, return mock recommendations

  const recommendations = [];

  if (params.satelliteSize === "3U") {
    recommendations.push({
      category: "OBC",
      reason: "Recommended for 3U CubeSat missions",
      products: [
        {
          name: "ISIS OBC",
          price: "$8,500",
          compatibility: "Excellent",
        },
        {
          name: "GomSpace NanoMind",
          price: "$12,000",
          compatibility: "Good",
        },
      ],
    });
  }

  if (params.missionType === "Earth Observation") {
    recommendations.push({
      category: "PAYLOAD",
      reason: "Essential for Earth observation missions",
      products: [
        {
          name: "Simera Sense xScape100",
          price: "$45,000",
          compatibility: "Perfect match",
        },
      ],
    });
  }

  return {
    recommendations,
    totalBudgetEstimate: recommendations.reduce(sum => sum + 50000, 0),
    suppliers: ["CubeSat Shop", "Satsearch", "EnduroSat"],
  };
}

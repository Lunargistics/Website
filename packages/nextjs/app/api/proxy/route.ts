import { NextRequest, NextResponse } from "next/server";
import { fetchWithRetry } from "~~/utils/api-helpers";

const ALLOWED_DOMAINS = ["api.satoshiverse.io", "api.web3modal.org"];

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Check if domain is allowed
    const isAllowed = ALLOWED_DOMAINS.some(domain => parsedUrl.hostname.includes(domain));

    if (!isAllowed) {
      return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
    }

    // Fetch data from external API
    const response = await fetchWithRetry(url, {
      headers: {
        "User-Agent": "LunarGistics/1.0",
      },
    });

    const data = await response.text();

    // Try to parse as JSON, otherwise return as text
    try {
      const jsonData = JSON.parse(data);
      return NextResponse.json(jsonData);
    } catch {
      return new NextResponse(data, {
        headers: {
          "Content-Type": response.headers.get("Content-Type") || "text/plain",
        },
      });
    }
  } catch (error) {
    console.error("Proxy error:", error);

    // Return cached/fallback data for known endpoints
    const url = request.nextUrl.searchParams.get("url");

    if (url?.includes("satoshiverse.io/metadata")) {
      // Return placeholder metadata
      return NextResponse.json({
        name: "Legionnaire",
        description: "A brave warrior from the Satoshiverse",
        image: "/images/placeholder-nft.png",
        attributes: [
          { trait_type: "Type", value: "Legionnaire" },
          { trait_type: "Status", value: "Loading" },
        ],
      });
    }

    return NextResponse.json({ error: "Failed to fetch external resource" }, { status: 500 });
  }
}

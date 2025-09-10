/**
 * Credits Balance API
 * Get user's current credit balance and usage statistics
 */
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "~~/lib/creditMiddleware";
import { CreditsService } from "~~/services/credits/creditsService";

// GET /api/credits/balance - Get user's credit balance
export async function GET(request: NextRequest) {
  return withAuth(request, async userId => {
    try {
      const balance = await CreditsService.getUserBalance(userId);
      const analytics = await CreditsService.getUsageAnalytics(userId, 30);

      return NextResponse.json({
        balance: balance.balance,
        totalPurchased: balance.totalPurchased,
        totalUsed: balance.totalUsed,
        analytics: {
          last30Days: analytics.totalUsed,
          dailyAverage: analytics.avgDaily,
          topEndpoints: Object.entries(analytics.endpointUsage)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 5)
            .map(([endpoint, usage]) => ({ endpoint, usage })),
        },
        lastUpdated: balance.lastUpdated,
      });
    } catch (error) {
      console.error("Error fetching credit balance:", error);
      return NextResponse.json(
        {
          error: "Failed to fetch credit balance",
          code: "BALANCE_FETCH_ERROR",
        },
        { status: 500 },
      );
    }
  });
}

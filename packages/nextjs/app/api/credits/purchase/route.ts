/**
 * Credit Purchase API
 * Create Stripe checkout sessions for credit purchases
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "~~/lib/auth";
import { withAuth } from "~~/lib/creditMiddleware";
import dbConnect from "~~/lib/mongodb";
import { CreditsService } from "~~/services/credits/creditsService";
import { StripeService } from "~~/services/stripe/stripeService";

// POST /api/credits/purchase - Create checkout session
export async function POST(request: NextRequest) {
  return withAuth(request, async userId => {
    try {
      // Ensure database connection
      await dbConnect();

      const body = await request.json();
      const { packageId, returnUrl } = body;

      if (!packageId) {
        return NextResponse.json(
          {
            error: "Package ID is required",
            code: "MISSING_PACKAGE_ID",
          },
          { status: 400 },
        );
      }

      // Get user session for email
      const session = await getServerSession(authOptions);
      const userEmail = session?.user?.email;

      // Create checkout session
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const successUrl = returnUrl || `${baseUrl}/dashboard?tab=credits&success=true`;
      const cancelUrl = returnUrl || `${baseUrl}/dashboard?tab=credits&cancelled=true`;

      const checkoutSession = await StripeService.createCheckoutSession({
        userId,
        packageId,
        successUrl,
        cancelUrl,
        customerEmail: userEmail,
      });

      return NextResponse.json({
        sessionId: checkoutSession.sessionId,
        url: checkoutSession.url,
      });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      return NextResponse.json(
        {
          error: "Failed to create checkout session",
          code: "CHECKOUT_ERROR",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  });
}

// GET /api/credits/purchase - Get purchase history
export async function GET(request: NextRequest) {
  return withAuth(request, async userId => {
    try {
      // Ensure database connection
      await dbConnect();

      const searchParams = request.nextUrl.searchParams;
      const limit = parseInt(searchParams.get("limit") || "20");
      const offset = parseInt(searchParams.get("offset") || "0");

      // Get transaction history from our database
      const transactions = await CreditsService.getTransactionHistory(userId, limit, offset);

      // Get Stripe payment history
      const stripeHistory = await StripeService.getPaymentHistory(userId);

      return NextResponse.json({
        transactions: transactions.map(tx => ({
          id: (tx as any).id,
          type: tx.type,
          amount: tx.amount,
          description: tx.description,
          balanceBefore: tx.balanceBefore,
          balanceAfter: tx.balanceAfter,
          apiEndpoint: tx.apiEndpoint,
          createdAt: tx.createdAt,
        })),
        stripePayments: stripeHistory,
        pagination: {
          limit,
          offset,
          hasMore: transactions.length === limit,
        },
      });
    } catch (error) {
      console.error("Error fetching purchase history:", error);
      return NextResponse.json(
        {
          error: "Failed to fetch purchase history",
          code: "HISTORY_FETCH_ERROR",
        },
        { status: 500 },
      );
    }
  });
}

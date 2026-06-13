/**
 * Credit Packages API
 * Get available credit packages for purchase
 */
import { NextRequest, NextResponse } from "next/server";
import { withPublic } from "~~/lib/creditMiddleware";
import dbConnect from "~~/lib/mongodb";
import { StripeService } from "~~/services/stripe/stripeService";

// GET /api/credits/packages - Get available credit packages
export async function GET(request: NextRequest) {
  return withPublic(request, async () => {
    try {
      // Ensure database connection
      await dbConnect();

      // Initialize packages if they don't exist
      let packages = await StripeService.getCreditPackages();

      // If no packages exist, initialize them
      if (!packages || packages.length === 0) {
        console.log("No credit packages found, initializing default packages...");
        packages = await StripeService.initializeCreditPackages();
      }

      const formattedPackages = packages.map(pkg => ({
        id: (pkg as any).id,
        name: pkg.name,
        credits: pkg.credits,
        bonusCredits: pkg.bonusCredits || 0,
        totalCredits: pkg.credits + (pkg.bonusCredits || 0),
        price: pkg.price,
        pricePerCredit: (pkg.price / 100 / (pkg.credits + (pkg.bonusCredits || 0))).toFixed(4),
        description: pkg.description,
        popular: pkg.popular || false,
        savings: pkg.bonusCredits
          ? Math.round(((pkg.bonusCredits || 0) / (pkg.credits + (pkg.bonusCredits || 0))) * 100)
          : 0,
      }));

      return NextResponse.json({
        packages: formattedPackages,
        currency: "USD",
      });
    } catch (error) {
      console.error("Error fetching credit packages:", error);
      return NextResponse.json(
        {
          error: "Failed to fetch credit packages",
          code: "PACKAGES_FETCH_ERROR",
        },
        { status: 500 },
      );
    }
  });
}

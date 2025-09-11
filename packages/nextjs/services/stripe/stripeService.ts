import { CreditPackage, ICreditPackage } from "../../models/Credits";
import { CreditsService } from "../credits/creditsService";
import Stripe from "stripe";

// Initialize Stripe (handle build-time absence of env vars)
const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key_for_build";
const stripe = new Stripe(stripeKey, {
  apiVersion: "2025-08-27.basil",
});

export interface CreateCheckoutSessionParams {
  userId: string;
  packageId: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}

export interface CreatePaymentIntentParams {
  userId: string;
  packageId: string;
  customerEmail?: string;
}

export class StripeService {
  /**
   * Helper to ensure Stripe is properly configured
   */
  private static ensureStripeConfigured(): void {
    if (stripeKey === "sk_test_dummy_key_for_build") {
      throw new Error("Stripe is using a dummy key. Please set STRIPE_SECRET_KEY environment variable.");
    }
  }

  /**
   * Create default credit packages in Stripe and database
   */
  static async initializeCreditPackages(): Promise<ICreditPackage[]> {
    const useStripe = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== "sk_test_dummy_key_for_build";
    const packages = [
      {
        name: "Starter Pack",
        credits: 1000,
        price: 999, // $9.99
        description: "Perfect for getting started with mission planning",
        popular: false,
        bonusCredits: 0,
      },
      {
        name: "Professional Pack",
        credits: 5000,
        price: 3999, // $39.99
        description: "Ideal for professional mission planners",
        popular: true,
        bonusCredits: 500,
      },
      {
        name: "Enterprise Pack",
        credits: 15000,
        price: 9999, // $99.99
        description: "For large-scale mission planning operations",
        popular: false,
        bonusCredits: 2000,
      },
      {
        name: "Mega Pack",
        credits: 50000,
        price: 29999, // $299.99
        description: "Maximum credits for intensive operations",
        popular: false,
        bonusCredits: 10000,
      },
    ];

    const createdPackages: ICreditPackage[] = [];

    for (const pkg of packages) {
      try {
        // Check if package already exists
        const existing = await CreditPackage.findOne({ name: pkg.name });
        if (existing) {
          createdPackages.push(existing);
          continue;
        }

        let stripePriceId = "price_dummy_" + pkg.name.toLowerCase().replace(/\s+/g, "_");
        let stripeProductId = "prod_dummy_" + pkg.name.toLowerCase().replace(/\s+/g, "_");

        // Only create Stripe products if Stripe is configured
        if (useStripe) {
          try {
            // Create Stripe product
            const product = await stripe.products.create({
              name: pkg.name,
              description: pkg.description,
              metadata: {
                credits: pkg.credits.toString(),
                bonusCredits: pkg.bonusCredits.toString(),
              },
            });

            // Create Stripe price
            const price = await stripe.prices.create({
              product: product.id,
              unit_amount: pkg.price,
              currency: "usd",
              metadata: {
                credits: pkg.credits.toString(),
                bonusCredits: pkg.bonusCredits.toString(),
              },
            });

            stripePriceId = price.id;
            stripeProductId = product.id;
          } catch (stripeError) {
            console.warn(`Stripe error for ${pkg.name}, using dummy IDs:`, stripeError);
          }
        }

        // Save to database
        const creditPackage = new CreditPackage({
          name: pkg.name,
          credits: pkg.credits,
          price: pkg.price,
          stripePriceId,
          stripeProductId,
          description: pkg.description,
          popular: pkg.popular,
          bonusCredits: pkg.bonusCredits,
          isActive: true,
        });

        await creditPackage.save();
        createdPackages.push(creditPackage);
      } catch (error) {
        console.error(`Error creating credit package ${pkg.name}:`, error);
      }
    }

    return createdPackages;
  }

  /**
   * Get all active credit packages
   */
  static async getCreditPackages(): Promise<ICreditPackage[]> {
    return await CreditPackage.find({ isActive: true }).sort({ price: 1 });
  }

  /**
   * Create Stripe Checkout Session
   */
  static async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<{
    sessionId: string;
    url: string;
  }> {
    this.ensureStripeConfigured();

    const creditPackage = await CreditPackage.findById(params.packageId);
    if (!creditPackage) {
      throw new Error("Credit package not found");
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: params.customerEmail,
      line_items: [
        {
          price: creditPackage.stripePriceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: params.userId,
        packageId: params.packageId,
        credits: creditPackage.credits.toString(),
        bonusCredits: creditPackage.bonusCredits?.toString() || "0",
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      allow_promotion_codes: true,
    });

    return {
      sessionId: session.id,
      url: session.url!,
    };
  }

  /**
   * Create Payment Intent for embedded checkout
   */
  static async createPaymentIntent(params: CreatePaymentIntentParams): Promise<{
    clientSecret: string;
    amount: number;
  }> {
    const creditPackage = await CreditPackage.findById(params.packageId);
    if (!creditPackage) {
      throw new Error("Credit package not found");
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: creditPackage.price,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: params.userId,
        packageId: params.packageId,
        credits: creditPackage.credits.toString(),
        bonusCredits: creditPackage.bonusCredits?.toString() || "0",
      },
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      amount: creditPackage.price,
    };
  }

  /**
   * Handle successful payment webhook
   */
  static async handlePaymentSuccess(
    paymentIntentId: string,
    checkoutSessionId?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      let metadata: any;

      if (checkoutSessionId) {
        // Get metadata from checkout session
        const session = await stripe.checkout.sessions.retrieve(checkoutSessionId);
        metadata = session.metadata;
      } else {
        // Get metadata from payment intent
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        metadata = paymentIntent.metadata;
      }

      if (!metadata?.userId || !metadata?.credits) {
        throw new Error("Missing required metadata in payment");
      }

      const userId = metadata.userId;
      const credits = parseInt(metadata.credits);
      const bonusCredits = parseInt(metadata.bonusCredits || "0");
      const totalCredits = credits + bonusCredits;

      // Add credits to user account
      const result = await CreditsService.addCredits(
        userId,
        totalCredits,
        `Credit purchase: ${credits} credits${bonusCredits > 0 ? ` + ${bonusCredits} bonus` : ""}`,
        paymentIntentId,
      );

      if (!result.success) {
        throw new Error("Failed to add credits to user account");
      }

      return {
        success: true,
        message: `Successfully added ${totalCredits} credits to user ${userId}`,
      };
    } catch (error) {
      console.error("Error handling payment success:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get customer's payment history
   */
  static async getPaymentHistory(userId: string): Promise<any[]> {
    try {
      // Search for charges with user metadata
      const charges = await stripe.charges.search({
        query: `metadata['userId']:'${userId}'`,
        limit: 50,
      });

      return charges.data.map(charge => ({
        id: charge.id,
        amount: charge.amount,
        currency: charge.currency,
        status: charge.status,
        created: new Date(charge.created * 1000),
        description: charge.description,
        metadata: charge.metadata,
      }));
    } catch (error) {
      console.error("Error fetching payment history:", error);
      return [];
    }
  }

  /**
   * Create customer portal session for subscription management
   */
  static async createPortalSession(userId: string, returnUrl: string): Promise<{ url: string }> {
    // First, find or create a customer
    const customers = await stripe.customers.search({
      query: `metadata['userId']:'${userId}'`,
      limit: 1,
    });

    let customerId: string;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        metadata: { userId },
      });
      customerId = customer.id;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  /**
   * Get usage statistics for a customer
   */
  static async getUsageStats(userId: string): Promise<{
    totalSpent: number;
    totalCreditspurchased: number;
    lastPurchaseDate?: Date;
  }> {
    try {
      const charges = await stripe.charges.search({
        query: `metadata['userId']:'${userId}' AND status:'succeeded'`,
        limit: 100,
      });

      const totalSpent = charges.data.reduce((sum, charge) => sum + charge.amount, 0);
      const totalCreditsData = charges.data.reduce((sum, charge) => {
        const credits = parseInt(charge.metadata?.credits || "0");
        const bonus = parseInt(charge.metadata?.bonusCredits || "0");
        return sum + credits + bonus;
      }, 0);

      const lastPurchase =
        charges.data.length > 0 ? new Date(Math.max(...charges.data.map(c => c.created * 1000))) : undefined;

      return {
        totalSpent,
        totalCreditspurchased: totalCreditsData,
        lastPurchaseDate: lastPurchase,
      };
    } catch (error) {
      console.error("Error fetching usage stats:", error);
      return {
        totalSpent: 0,
        totalCreditspurchased: 0,
      };
    }
  }

  /**
   * Refund a payment
   */
  static async refundPayment(
    paymentIntentId: string,
    amount?: number,
    reason?: string,
  ): Promise<{ success: boolean; refundId?: string; message: string }> {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
        reason: reason as any,
      });

      return {
        success: true,
        refundId: refund.id,
        message: "Refund created successfully",
      };
    } catch (error) {
      console.error("Error creating refund:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Construct webhook event from raw body and signature
   */
  static constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("Stripe webhook secret not configured");
    }

    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}

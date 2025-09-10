/**
 * Stripe Webhook Handler
 * Process payment events and update user credits
 */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { StripeService } from "~~/services/stripe/stripeService";

// Disable body parsing for webhooks
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      console.error("Missing Stripe signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = StripeService.constructWebhookEvent(body, signature);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout session completed:", session.id);

        if (session.payment_status === "paid" && session.payment_intent) {
          const result = await StripeService.handlePaymentSuccess(session.payment_intent as string, session.id);

          if (!result.success) {
            console.error("Failed to process payment:", result.message);
            // Don't return error to Stripe - we've received the webhook
            // Log the error for manual investigation
          } else {
            console.log("Payment processed successfully:", result.message);
          }
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment intent succeeded:", paymentIntent.id);

        // Only process if not already handled by checkout.session.completed
        if (!paymentIntent.metadata?.checkout_session_id) {
          const result = await StripeService.handlePaymentSuccess(paymentIntent.id);

          if (!result.success) {
            console.error("Failed to process payment intent:", result.message);
          } else {
            console.log("Payment intent processed successfully:", result.message);
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment failed:", paymentIntent.id, paymentIntent.last_payment_error?.message);

        // Log the failure for analytics/debugging
        // Could also send notification to user about failed payment
        break;
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        console.log("Dispute created:", dispute.id, dispute.charge);

        // Handle dispute - might need to freeze credits or investigate
        // This is important for fraud prevention
        break;
      }

      case "invoice.payment_succeeded": {
        // For future subscription support
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Invoice payment succeeded:", invoice.id);
        break;
      }

      case "invoice.payment_failed": {
        // For future subscription support
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Invoice payment failed:", invoice.id);
        break;
      }

      case "customer.subscription.deleted": {
        // For future subscription support
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription deleted:", subscription.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      {
        error: "Webhook handler failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    webhook: "stripe",
    timestamp: new Date().toISOString(),
  });
}

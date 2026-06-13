import { Prisma } from "@prisma/client";
import { startOfDay } from "date-fns";
import { prisma } from "~~/lib/prisma";
import { API_CREDIT_COSTS, ICreditBalance, ICreditTransaction, TransactionType } from "~~/models/Credits";

// Prisma transaction client type (the `tx` handed to $transaction callbacks).
type Tx = Prisma.TransactionClient;

export class CreditsService {
  /**
   * Get user's current credit balance
   */
  static async getUserBalance(userId: string): Promise<ICreditBalance> {
    let balance = await prisma.creditBalance.findUnique({ where: { userId } });

    if (!balance) {
      // Create initial balance for new user with starter credits
      balance = await prisma.creditBalance.create({
        data: {
          userId,
          balance: 100, // 100 free starter credits
          totalPurchased: 100,
          totalUsed: 0,
        },
      });

      // Record the initial credit transaction
      await this.recordTransaction({
        userId,
        type: TransactionType.BONUS,
        amount: 100,
        balanceBefore: 0,
        balanceAfter: 100,
        description: "Welcome bonus - 100 free credits",
      });
    }

    return balance;
  }

  /**
   * Check if user has sufficient credits for an operation
   */
  static async hasCredits(userId: string, requiredCredits: number): Promise<boolean> {
    const balance = await this.getUserBalance(userId);
    return balance.balance >= requiredCredits;
  }

  /**
   * Get credit cost for an API endpoint
   */
  static getCreditCost(endpoint: string): number {
    // Normalize endpoint to match our cost mapping
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    return API_CREDIT_COSTS[normalizedEndpoint as keyof typeof API_CREDIT_COSTS] || 1;
  }

  /**
   * Consume credits for API usage
   */
  static async consumeCredits(
    userId: string,
    endpoint: string,
    customAmount?: number,
  ): Promise<{ success: boolean; newBalance: number; message: string }> {
    const creditsToConsume = customAmount || this.getCreditCost(endpoint);

    const balance = await this.getUserBalance(userId);

    if (balance.balance < creditsToConsume) {
      return {
        success: false,
        newBalance: balance.balance,
        message: `Insufficient credits. Required: ${creditsToConsume}, Available: ${balance.balance}`,
      };
    }

    try {
      // Use a Prisma transaction to ensure atomicity
      await prisma.$transaction(async tx => {
        // Update balance
        const updatedBalance = await tx.creditBalance.update({
          where: { userId },
          data: {
            balance: { decrement: creditsToConsume },
            totalUsed: { increment: creditsToConsume },
          },
        });

        if (!updatedBalance) {
          throw new Error("Failed to update balance");
        }

        // Record transaction
        await this.recordTransaction(
          {
            userId,
            type: TransactionType.USAGE,
            amount: -creditsToConsume,
            balanceBefore: balance.balance,
            balanceAfter: updatedBalance.balance,
            description: `API usage: ${endpoint}`,
            apiEndpoint: endpoint,
          },
          tx,
        );

        // Update daily analytics
        await this.updateDailyAnalytics(userId, endpoint, creditsToConsume, tx);
      });

      return {
        success: true,
        newBalance: balance.balance - creditsToConsume,
        message: "Credits consumed successfully",
      };
    } catch (error) {
      console.error("Error consuming credits:", error);
      return {
        success: false,
        newBalance: balance.balance,
        message: "Failed to consume credits",
      };
    }
  }

  /**
   * Add credits to user account (for purchases)
   */
  static async addCredits(
    userId: string,
    amount: number,
    description: string,
    stripePaymentIntentId?: string,
  ): Promise<{ success: boolean; newBalance: number }> {
    const balance = await this.getUserBalance(userId);

    try {
      await prisma.$transaction(async tx => {
        // Update balance
        const updatedBalance = await tx.creditBalance.update({
          where: { userId },
          data: {
            balance: { increment: amount },
            totalPurchased: { increment: amount },
          },
        });

        if (!updatedBalance) {
          throw new Error("Failed to update balance");
        }

        // Record transaction
        await this.recordTransaction(
          {
            userId,
            type: TransactionType.PURCHASE,
            amount,
            balanceBefore: balance.balance,
            balanceAfter: updatedBalance.balance,
            description,
            stripePaymentIntentId,
          },
          tx,
        );
      });

      return {
        success: true,
        newBalance: balance.balance + amount,
      };
    } catch (error) {
      console.error("Error adding credits:", error);
      return {
        success: false,
        newBalance: balance.balance,
      };
    }
  }

  /**
   * Get user's credit transaction history
   */
  static async getTransactionHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ICreditTransaction[]> {
    return (await prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    })) as unknown as ICreditTransaction[];
  }

  /**
   * Get user's credit usage analytics
   */
  static async getUsageAnalytics(userId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await prisma.creditUsageAnalytics.findMany({
      where: {
        userId,
        date: { gte: startOfDay(startDate) },
      },
      orderBy: { date: "asc" },
    });

    const totalUsed = analytics.reduce((sum, day) => sum + day.totalUsed, 0);
    const avgDaily = analytics.length > 0 ? totalUsed / analytics.length : 0;

    // Aggregate endpoint usage
    const endpointUsage: Record<string, number> = {};
    analytics.forEach(day => {
      const byEndpoint = (day.usageByEndpoint as Record<string, number>) || {};
      Object.entries(byEndpoint).forEach(([endpoint, count]) => {
        endpointUsage[endpoint] = (endpointUsage[endpoint] || 0) + (count as number);
      });
    });

    return {
      totalUsed,
      avgDaily: Math.round(avgDaily * 100) / 100,
      dailyUsage: analytics,
      endpointUsage,
    };
  }

  /**
   * Record a credit transaction
   */
  private static async recordTransaction(
    transaction: {
      userId: string;
      type: TransactionType;
      amount: number;
      balanceBefore: number;
      balanceAfter: number;
      description: string;
      apiEndpoint?: string;
      stripePaymentIntentId?: string;
      metadata?: Record<string, any>;
    },
    tx?: Tx,
  ): Promise<void> {
    const client = tx ?? prisma;

    await client.creditTransaction.create({
      data: {
        userId: transaction.userId,
        type: transaction.type,
        amount: transaction.amount,
        balanceBefore: transaction.balanceBefore,
        balanceAfter: transaction.balanceAfter,
        description: transaction.description,
        apiEndpoint: transaction.apiEndpoint,
        stripePaymentIntentId: transaction.stripePaymentIntentId,
        metadata: (transaction.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  /**
   * Update daily usage analytics
   */
  private static async updateDailyAnalytics(
    userId: string,
    endpoint: string,
    creditsUsed: number,
    tx?: Tx,
  ): Promise<void> {
    const client = tx ?? prisma;
    const today = startOfDay(new Date());

    // Read-modify-write the per-endpoint usage map so we can merge JSON.
    const existing = await client.creditUsageAnalytics.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    const mergedUsageByEndpoint: Record<string, number> = {
      ...((existing?.usageByEndpoint as Record<string, number>) || {}),
    };
    mergedUsageByEndpoint[endpoint] = (mergedUsageByEndpoint[endpoint] || 0) + creditsUsed;

    await client.creditUsageAnalytics.upsert({
      where: { userId_date: { userId, date: today } },
      update: {
        totalUsed: { increment: creditsUsed },
        usageByEndpoint: mergedUsageByEndpoint as Prisma.InputJsonValue,
      },
      create: {
        userId,
        date: today,
        totalUsed: creditsUsed,
        usageByEndpoint: { [endpoint]: creditsUsed } as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Normalize endpoint for cost lookup
   */
  private static normalizeEndpoint(endpoint: string): string {
    // Remove query parameters and trailing slashes
    const cleanEndpoint = endpoint.split("?")[0].replace(/\/$/, "");

    // Handle specific endpoint patterns
    if (cleanEndpoint.includes("/missions") && cleanEndpoint.includes("/create")) {
      return "/api/missions/create";
    }

    if (cleanEndpoint.includes("/missions")) {
      return "/api/missions";
    }

    return cleanEndpoint;
  }

  /**
   * Admin function to adjust user credits
   */
  static async adminAdjustCredits(
    userId: string,
    amount: number,
    reason: string,
    adminId: string,
  ): Promise<{ success: boolean; newBalance: number }> {
    const balance = await this.getUserBalance(userId);

    if (balance.balance + amount < 0) {
      return {
        success: false,
        newBalance: balance.balance,
      };
    }

    try {
      await prisma.$transaction(async tx => {
        const updatedBalance = await tx.creditBalance.update({
          where: { userId },
          data: {
            balance: { increment: amount },
          },
        });

        if (!updatedBalance) {
          throw new Error("Failed to update balance");
        }

        await this.recordTransaction(
          {
            userId,
            type: TransactionType.ADMIN_ADJUSTMENT,
            amount,
            balanceBefore: balance.balance,
            balanceAfter: updatedBalance.balance,
            description: `Admin adjustment: ${reason}`,
            metadata: { adminId, reason },
          },
          tx,
        );
      });

      return {
        success: true,
        newBalance: balance.balance + amount,
      };
    } catch (error) {
      console.error("Error adjusting credits:", error);
      return {
        success: false,
        newBalance: balance.balance,
      };
    }
  }
}

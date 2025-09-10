import {
  API_CREDIT_COSTS,
  CreditBalance,
  CreditTransaction,
  CreditUsageAnalytics,
  ICreditBalance,
  ICreditTransaction,
  TransactionType,
} from "../../models/Credits";
import { startOfDay } from "date-fns";

export class CreditsService {
  /**
   * Get user's current credit balance
   */
  static async getUserBalance(userId: string): Promise<ICreditBalance> {
    let balance = await CreditBalance.findOne({ userId });

    if (!balance) {
      // Create initial balance for new user with starter credits
      balance = new CreditBalance({
        userId,
        balance: 100, // 100 free starter credits
        totalPurchased: 100,
        totalUsed: 0,
      });
      await balance.save();

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

    // Use MongoDB transaction to ensure atomicity
    const session = await CreditBalance.startSession();

    try {
      await session.withTransaction(async () => {
        // Update balance
        const updatedBalance = await CreditBalance.findOneAndUpdate(
          { userId },
          {
            $inc: {
              balance: -creditsToConsume,
              totalUsed: creditsToConsume,
            },
            $set: { lastUpdated: new Date() },
          },
          { new: true, session },
        );

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
          session,
        );

        // Update daily analytics
        await this.updateDailyAnalytics(userId, endpoint, creditsToConsume, session);
      });

      await session.endSession();

      return {
        success: true,
        newBalance: balance.balance - creditsToConsume,
        message: "Credits consumed successfully",
      };
    } catch (error) {
      await session.endSession();
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

    const session = await CreditBalance.startSession();

    try {
      await session.withTransaction(async () => {
        // Update balance
        const updatedBalance = await CreditBalance.findOneAndUpdate(
          { userId },
          {
            $inc: {
              balance: amount,
              totalPurchased: amount,
            },
            $set: { lastUpdated: new Date() },
          },
          { new: true, session },
        );

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
          session,
        );
      });

      await session.endSession();

      return {
        success: true,
        newBalance: balance.balance + amount,
      };
    } catch (error) {
      await session.endSession();
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
    return await CreditTransaction.find({ userId }).sort({ createdAt: -1 }).limit(limit).skip(offset).exec();
  }

  /**
   * Get user's credit usage analytics
   */
  static async getUsageAnalytics(userId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await CreditUsageAnalytics.find({
      userId,
      date: { $gte: startOfDay(startDate) },
    })
      .sort({ date: 1 })
      .exec();

    const totalUsed = analytics.reduce((sum, day) => sum + day.totalUsed, 0);
    const avgDaily = analytics.length > 0 ? totalUsed / analytics.length : 0;

    // Aggregate endpoint usage
    const endpointUsage: Record<string, number> = {};
    analytics.forEach(day => {
      Object.entries(day.usageByEndpoint).forEach(([endpoint, count]) => {
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
    session?: any,
  ): Promise<void> {
    const newTransaction = new CreditTransaction({
      ...transaction,
      createdAt: new Date(),
    });

    if (session) {
      await newTransaction.save({ session });
    } else {
      await newTransaction.save();
    }
  }

  /**
   * Update daily usage analytics
   */
  private static async updateDailyAnalytics(
    userId: string,
    endpoint: string,
    creditsUsed: number,
    session?: any,
  ): Promise<void> {
    const today = startOfDay(new Date());

    const updateQuery = {
      $inc: {
        totalUsed: creditsUsed,
        [`usageByEndpoint.${endpoint}`]: creditsUsed,
      },
      $setOnInsert: {
        userId,
        date: today,
        createdAt: new Date(),
      },
    };

    if (session) {
      await CreditUsageAnalytics.findOneAndUpdate({ userId, date: today }, updateQuery, { upsert: true, session });
    } else {
      await CreditUsageAnalytics.findOneAndUpdate({ userId, date: today }, updateQuery, { upsert: true });
    }
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

    const session = await CreditBalance.startSession();

    try {
      await session.withTransaction(async () => {
        const updatedBalance = await CreditBalance.findOneAndUpdate(
          { userId },
          {
            $inc: { balance: amount },
            $set: { lastUpdated: new Date() },
          },
          { new: true, session },
        );

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
          session,
        );
      });

      await session.endSession();

      return {
        success: true,
        newBalance: balance.balance + amount,
      };
    } catch (error) {
      await session.endSession();
      console.error("Error adjusting credits:", error);
      return {
        success: false,
        newBalance: balance.balance,
      };
    }
  }
}

"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowUpIcon,
  BoltIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface CreditBalance {
  balance: number;
  totalPurchased: number;
  totalUsed: number;
  analytics: {
    last30Days: number;
    dailyAverage: number;
    topEndpoints: Array<{ endpoint: string; usage: number }>;
  };
  lastUpdated: string;
}

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  bonusCredits: number;
  totalCredits: number;
  price: number;
  pricePerCredit: string;
  description: string;
  popular: boolean;
  savings: number;
}

interface Transaction {
  id: string;
  type: "purchase" | "usage" | "refund" | "bonus" | "admin_adjustment";
  amount: number;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  apiEndpoint?: string;
  createdAt: string;
}

export default function CreditsManager() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showTransactions, setShowTransactions] = useState(false);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch balance and packages in parallel
      const [balanceRes, packagesRes, transactionsRes] = await Promise.all([
        fetch("/api/credits/balance"),
        fetch("/api/credits/packages"),
        fetch("/api/credits/purchase?limit=10"),
      ]);

      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setBalance(balanceData);
      }

      if (packagesRes.ok) {
        const packagesData = await packagesRes.json();
        setPackages(packagesData.packages);
      }

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setTransactions(transactionsData.transactions);
      }
    } catch (error) {
      console.error("Error fetching credits data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    try {
      setPurchasing(packageId);

      const response = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageId,
          returnUrl: `${window.location.origin}/dashboard?tab=credits&success=true`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error("Error purchasing credits:", error);
      alert("Failed to start purchase. Please try again.");
    } finally {
      setPurchasing(null);
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance < 50) return "text-red-500";
    if (balance < 200) return "text-yellow-500";
    return "text-green-500";
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
      case "usage":
        return <BoltIcon className="h-4 w-4 text-blue-500" />;
      case "refund":
        return <CurrencyDollarIcon className="h-4 w-4 text-yellow-500" />;
      case "bonus":
        return <CheckCircleIcon className="h-4 w-4 text-purple-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Credit Balance Overview */}
      {balance ? (
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <BoltIcon className="h-6 w-6" />
              Credits Overview
            </h2>
            <button onClick={fetchData} className="text-purple-400 hover:text-purple-300">
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm">Current Balance</p>
                  <p className={`text-2xl font-bold ${getBalanceColor(balance.balance)}`}>
                    {balance.balance.toLocaleString()}
                  </p>
                </div>
                <BoltIcon className="h-8 w-8 text-purple-400" />
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm">Total Purchased</p>
                  <p className="text-2xl font-bold text-white">{balance.totalPurchased.toLocaleString()}</p>
                </div>
                <CreditCardIcon className="h-8 w-8 text-green-400" />
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm">Total Used</p>
                  <p className="text-2xl font-bold text-white">{balance.totalUsed.toLocaleString()}</p>
                </div>
                <ChartBarIcon className="h-8 w-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm">Daily Average (30d)</p>
                  <p className="text-2xl font-bold text-white">{balance.analytics.dailyAverage}</p>
                </div>
                <ClockIcon className="h-8 w-8 text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Low Balance Warning */}
          {balance.balance < 50 && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-400">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <span className="font-medium">Low Credit Balance</span>
              </div>
              <p className="text-red-300 mt-1">
                You have {balance.balance} credits remaining. Consider purchasing more to continue using the API.
              </p>
            </div>
          )}

          {/* Top API Usage */}
          {balance.analytics.topEndpoints.length > 0 && (
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Top API Usage (30 days)</h3>
              <div className="space-y-2">
                {balance.analytics.topEndpoints.map((endpoint, _index) => (
                  <div key={endpoint.endpoint} className="flex justify-between items-center">
                    <span className="text-purple-200">{endpoint.endpoint}</span>
                    <span className="text-white font-medium">{endpoint.usage} credits</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        !loading && (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Credits Overview</h2>
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-400">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <span className="font-medium">Unable to load balance</span>
              </div>
              <p className="text-yellow-300 mt-1">
                Your credit balance is being initialized. You&apos;ll receive 100 free starter credits on first use.
              </p>
            </div>
          </div>
        )
      )}

      {/* Credit Packages */}
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Purchase Credits</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {packages.map(pkg => (
            <div
              key={pkg.id}
              className={`relative bg-white/5 rounded-lg p-6 border-2 transition-all duration-200 hover:bg-white/10 ${
                pkg.popular ? "border-purple-500 ring-2 ring-purple-500/20" : "border-white/20 hover:border-purple-400"
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">${(pkg.price / 100).toFixed(2)}</span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-200">Base Credits:</span>
                    <span className="text-white">{pkg.credits.toLocaleString()}</span>
                  </div>
                  {pkg.bonusCredits > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-200">Bonus Credits:</span>
                      <span className="text-green-400">+{pkg.bonusCredits.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-medium border-t border-white/20 pt-2">
                    <span className="text-purple-200">Total Credits:</span>
                    <span className="text-white">{pkg.totalCredits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-200">Price per Credit:</span>
                    <span className="text-white">${pkg.pricePerCredit}</span>
                  </div>
                </div>

                {pkg.savings > 0 && (
                  <div className="text-green-400 text-sm font-medium mb-4">{pkg.savings}% Bonus Credits!</div>
                )}

                <p className="text-purple-200 text-sm mb-4">{pkg.description}</p>

                <button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={purchasing === pkg.id}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                    pkg.popular
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {purchasing === pkg.id ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </div>
                  ) : (
                    "Purchase Credits"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Recent Transactions</h2>
          <button
            onClick={() => setShowTransactions(!showTransactions)}
            className="text-purple-400 hover:text-purple-300"
          >
            {showTransactions ? "Hide" : "Show"} History
          </button>
        </div>

        {showTransactions && (
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-purple-200 text-center py-8">No transactions yet</p>
            ) : (
              transactions.map(tx => (
                <div key={tx.id} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(tx.type)}
                    <div>
                      <p className="text-white font-medium">{tx.description}</p>
                      <p className="text-purple-200 text-sm">{new Date(tx.createdAt).toLocaleString()}</p>
                      {tx.apiEndpoint && <p className="text-purple-300 text-xs">{tx.apiEndpoint}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                      {tx.amount > 0 ? "+" : ""}
                      {tx.amount}
                    </p>
                    <p className="text-purple-200 text-sm">Balance: {tx.balanceAfter}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

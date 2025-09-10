"use client";

import React, { useEffect, useState } from "react";
import { BoltIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface CreditBalance {
  balance: number;
  totalPurchased: number;
  totalUsed: number;
  lastUpdated: string;
}

interface CreditBalanceWidgetProps {
  onManageCredits?: () => void;
  showManageButton?: boolean;
  compact?: boolean;
}

export default function CreditBalanceWidget({
  onManageCredits,
  showManageButton = true,
  compact = false,
}: CreditBalanceWidgetProps) {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/credits/balance");
      if (!response.ok) {
        throw new Error("Failed to fetch credit balance");
      }

      const data = await response.json();
      setBalance(data);
    } catch (err) {
      console.error("Error fetching credit balance:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance < 50) return "text-red-400";
    if (balance < 200) return "text-yellow-400";
    return "text-green-400";
  };

  const isLowBalance = balance && balance.balance < 50;

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <BoltIcon className="h-5 w-5 text-purple-400" />
          <span className="text-white font-medium">Credits</span>
        </div>
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-2"></div>
          <div className="h-4 bg-white/20 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-red-500/20">
        <div className="flex items-center gap-2 mb-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
          <span className="text-white font-medium">Credits Error</span>
        </div>
        <p className="text-red-300 text-sm">{error}</p>
        <button onClick={fetchBalance} className="text-purple-400 hover:text-purple-300 text-sm mt-2">
          Retry
        </button>
      </div>
    );
  }

  if (!balance) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-white">
        <BoltIcon className="h-4 w-4 text-purple-400" />
        <span className={`font-medium ${getBalanceColor(balance.balance)}`}>{balance.balance.toLocaleString()}</span>
        <span className="text-purple-200 text-sm">credits</span>
        {isLowBalance && <ExclamationTriangleIcon className="h-4 w-4 text-red-400 ml-1" />}
      </div>
    );
  }

  return (
    <div className={`bg-white/10 backdrop-blur-lg rounded-lg p-4 ${isLowBalance ? "border border-red-500/30" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BoltIcon className="h-5 w-5 text-purple-400" />
          <span className="text-white font-medium">Credits</span>
        </div>
        {showManageButton && (
          <button onClick={onManageCredits} className="text-purple-400 hover:text-purple-300 text-sm">
            Manage
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-purple-200 text-sm">Balance:</span>
          <span className={`text-lg font-bold ${getBalanceColor(balance.balance)}`}>
            {balance.balance.toLocaleString()}
          </span>
        </div>

        {isLowBalance && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-2 mt-2">
            <div className="flex items-center gap-1">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />
              <span className="text-red-400 text-sm font-medium">Low Balance</span>
            </div>
            <p className="text-red-300 text-xs mt-1">Consider purchasing more credits to continue using the API.</p>
          </div>
        )}

        <div className="text-xs text-purple-300 space-y-1">
          <div className="flex justify-between">
            <span>Total Purchased:</span>
            <span>{balance.totalPurchased.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Used:</span>
            <span>{balance.totalUsed.toLocaleString()}</span>
          </div>
        </div>

        <div className="text-xs text-purple-400 mt-2">
          Last updated: {new Date(balance.lastUpdated).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { ArrowTrendingDownIcon, ArrowTrendingUpIcon } from "@heroicons/react/24/outline";

interface MarketStat {
  label: string;
  value: string;
  change: number;
  trend: "up" | "down";
}

export function AsteroidMarketStats() {
  const [stats] = useState<MarketStat[]>([
    { label: "Total Value Locked", value: "$12.4M", change: 15.2, trend: "up" },
    { label: "24h Volume", value: "$2.1M", change: -3.4, trend: "down" },
    { label: "Active Traders", value: "1,234", change: 8.7, trend: "up" },
    { label: "Listed Asteroids", value: "127", change: 2.1, trend: "up" },
  ]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="card bg-base-200 shadow-sm">
          <div className="card-body p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-base-content/70">{stat.label}</p>
            <p className="text-lg sm:text-2xl font-bold">{stat.value}</p>
            <div
              className={`flex items-center gap-1 text-xs sm:text-sm ${
                stat.trend === "up" ? "text-success" : "text-error"
              }`}
            >
              {stat.trend === "up" ? (
                <ArrowTrendingUpIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              ) : (
                <ArrowTrendingDownIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
              <span>{Math.abs(stat.change)}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

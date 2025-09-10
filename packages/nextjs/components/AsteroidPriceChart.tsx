"use client";

import { useState, useEffect } from "react";

interface PricePoint {
  time: string;
  price: number;
}

export function AsteroidPriceChart({ commodity }: { commodity: string }) {
  const [timeframe, setTimeframe] = useState<"1H" | "1D" | "1W" | "1M">("1D");
  const [priceData, setPriceData] = useState<PricePoint[]>([]);

  useEffect(() => {
    // Generate mock price data
    const generatePriceData = () => {
      const points = 24;
      const basePrice = 100;
      const data: PricePoint[] = [];
      
      for (let i = 0; i < points; i++) {
        const time = new Date(Date.now() - (points - i) * 3600000).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        const price = basePrice + (Math.random() - 0.5) * 20;
        data.push({ time, price });
      }
      
      setPriceData(data);
    };

    generatePriceData();
  }, [timeframe, commodity]);

  const minPrice = Math.min(...priceData.map(d => d.price));
  const maxPrice = Math.max(...priceData.map(d => d.price));
  const currentPrice = priceData[priceData.length - 1]?.price || 0;
  const priceChange = priceData.length > 1 
    ? ((currentPrice - priceData[0].price) / priceData[0].price) * 100
    : 0;

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
          <div>
            <h3 className="text-lg font-bold capitalize">{commodity} Price</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">${currentPrice.toFixed(2)}</span>
              <span className={`text-sm ${priceChange >= 0 ? 'text-success' : 'text-error'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          </div>
          
          <div className="join join-horizontal">
            {(["1H", "1D", "1W", "1M"] as const).map(tf => (
              <button
                key={tf}
                className={`join-item btn btn-xs ${timeframe === tf ? 'btn-active' : ''}`}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Simple SVG Chart */}
        <div className="w-full h-48 sm:h-64 relative bg-base-200 rounded-lg p-2">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-primary"
              points={priceData.map((point, i) => {
                const x = (i / (priceData.length - 1)) * 100;
                const y = 100 - ((point.price - minPrice) / (maxPrice - minPrice)) * 100;
                return `${x},${y}`;
              }).join(' ')}
            />
            
            {/* Area under the line */}
            <polygon
              fill="currentColor"
              fillOpacity="0.1"
              className="text-primary"
              points={`0,100 ${priceData.map((point, i) => {
                const x = (i / (priceData.length - 1)) * 100;
                const y = 100 - ((point.price - minPrice) / (maxPrice - minPrice)) * 100;
                return `${x},${y}`;
              }).join(' ')} 100,100`}
            />
          </svg>
          
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 flex flex-col justify-between h-full text-xs text-base-content/50">
            <span>${maxPrice.toFixed(0)}</span>
            <span>${((maxPrice + minPrice) / 2).toFixed(0)}</span>
            <span>${minPrice.toFixed(0)}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="text-center">
            <p className="text-xs text-base-content/70">24h High</p>
            <p className="font-semibold text-sm">${maxPrice.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-base-content/70">24h Low</p>
            <p className="font-semibold text-sm">${minPrice.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-base-content/70">Volume</p>
            <p className="font-semibold text-sm">$1.2M</p>
          </div>
        </div>
      </div>
    </div>
  );
}
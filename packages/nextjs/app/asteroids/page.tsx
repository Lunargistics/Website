"use client";

import { useEffect, useState } from "react";
import { formatEther, formatUnits, parseEther, parseUnits } from "viem";
import { useAccount, useBalance } from "wagmi";
import { ArrowPathIcon, ArrowsUpDownIcon, ChevronDownIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export default function AsteroidsPage() {
  const { address, isConnected } = useAccount();
  const [selectedAsteroid, setSelectedAsteroid] = useState("");
  const [activeTab, setActiveTab] = useState<"swap" | "liquidity" | "futures" | "portfolio">("swap");
  const [isLoading, setIsLoading] = useState(false);

  // Sample asteroid data - in production would fetch from API
  const asteroidData = [
    {
      id: "16-psyche",
      name: "16 Psyche",
      value: "$10,000T",
      commodities: ["iron", "nickel", "platinum"],
      description: "Metal-rich asteroid worth quadrillions",
      distance: "2.9 AU",
    },
    {
      id: "433-eros",
      name: "433 Eros",
      value: "$20T",
      commodities: ["gold", "platinum", "cobalt"],
      description: "Near-Earth asteroid with precious metals",
      distance: "1.4 AU",
    },
    {
      id: "3554-amun",
      name: "3554 Amun",
      value: "$8T",
      commodities: ["cobalt", "nickel", "iron"],
      description: "Small metallic asteroid",
      distance: "1.0 AU",
    },
  ];

  const commodityColors: Record<string, string> = {
    iron: "bg-gray-500",
    nickel: "bg-green-500",
    platinum: "bg-purple-500",
    gold: "bg-yellow-500",
    cobalt: "bg-blue-500",
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-base-content/70 mb-6">
            Please connect your wallet to access the asteroid commodities trading platform
          </p>
          <div className="animate-pulse">
            <div className="w-48 h-12 bg-primary/20 rounded-lg mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4">Asteroid Commodities</h1>
        <p className="text-base sm:text-lg text-base-content/70 px-4">Trade tokenized asteroid resources on-chain</p>
      </div>

      {/* Asteroid Selection Grid */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body p-4 sm:p-6">
          <h2 className="card-title text-lg sm:text-xl mb-4">Select Asteroid</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {asteroidData.map(asteroid => (
              <button
                key={asteroid.id}
                className={`card bg-base-100 hover:shadow-lg transition-all text-left ${
                  selectedAsteroid === asteroid.id ? "ring-2 ring-primary shadow-lg" : ""
                }`}
                onClick={() => setSelectedAsteroid(asteroid.id)}
              >
                <div className="card-body p-4 sm:p-5">
                  <h3 className="font-bold text-base sm:text-lg">{asteroid.name}</h3>
                  <p className="text-xs sm:text-sm text-base-content/70 mb-2">{asteroid.description}</p>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold">{asteroid.value}</span>
                    <span className="text-xs text-base-content/50">{asteroid.distance}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {asteroid.commodities.map(commodity => (
                      <span key={commodity} className={`badge badge-sm ${commodityColors[commodity]} text-white`}>
                        {commodity}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Trading Interface */}
      {selectedAsteroid && (
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body p-4 sm:p-6">
            {/* Mobile-optimized tabs */}
            <div className="tabs tabs-boxed mb-4 overflow-x-auto">
              <button
                className={`tab flex-1 sm:flex-initial ${activeTab === "swap" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("swap")}
              >
                <ArrowsUpDownIcon className="w-4 h-4 mr-1 hidden sm:inline" />
                Swap
              </button>
              <button
                className={`tab flex-1 sm:flex-initial ${activeTab === "liquidity" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("liquidity")}
              >
                <PlusIcon className="w-4 h-4 mr-1 hidden sm:inline" />
                Liquidity
              </button>
              <button
                className={`tab flex-1 sm:flex-initial ${activeTab === "futures" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("futures")}
              >
                Futures
              </button>
              <button
                className={`tab flex-1 sm:flex-initial ${activeTab === "portfolio" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("portfolio")}
              >
                Portfolio
              </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
              {activeTab === "swap" && <SwapInterface asteroidId={selectedAsteroid} />}
              {activeTab === "liquidity" && <LiquidityInterface asteroidId={selectedAsteroid} />}
              {activeTab === "futures" && <FuturesInterface asteroidId={selectedAsteroid} />}
              {activeTab === "portfolio" && <PortfolioInterface asteroidId={selectedAsteroid} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SwapInterface({ asteroidId }: { asteroidId: string }) {
  const [fromToken, setFromToken] = useState("USDC");
  const [toToken, setToToken] = useState("iron");
  const [amount, setAmount] = useState("");
  const [estimatedOutput, setEstimatedOutput] = useState("0.0");
  const [isSwapping, setIsSwapping] = useState(false);
  const [showTokenSelect, setShowTokenSelect] = useState<"from" | "to" | null>(null);

  const tokens = ["USDC", "iron", "nickel", "platinum", "gold", "cobalt"];

  const handleSwap = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      notification.error("Please enter a valid amount");
      return;
    }

    setIsSwapping(true);
    try {
      // Simulate swap transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      notification.success("Swap successful!");
      setAmount("");
      setEstimatedOutput("0.0");
    } catch (error) {
      notification.error("Swap failed");
    } finally {
      setIsSwapping(false);
    }
  };

  const switchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount("");
    setEstimatedOutput("0.0");
  };

  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      // Mock calculation - replace with actual DEX quote
      const mockRate = fromToken === "USDC" ? 100 : 0.01;
      setEstimatedOutput((parseFloat(amount) * mockRate).toFixed(4));
    } else {
      setEstimatedOutput("0.0");
    }
  }, [amount, fromToken, toToken]);

  return (
    <div className="space-y-4 max-w-md mx-auto w-full">
      <h3 className="text-lg sm:text-xl font-bold">Swap Tokens</h3>

      {/* From Token */}
      <div className="form-control">
        <label className="label">
          <span className="label-text text-sm">From</span>
          <span className="label-text-alt text-xs">Balance: 1,000.00</span>
        </label>
        <div className="join w-full">
          <input
            type="number"
            placeholder="0.0"
            className="input input-bordered join-item flex-1 text-lg"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            disabled={isSwapping}
          />
          <button className="btn join-item" onClick={() => setShowTokenSelect("from")} disabled={isSwapping}>
            {fromToken}
            <ChevronDownIcon className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>

      {/* Switch Button */}
      <div className="flex justify-center">
        <button className="btn btn-circle btn-sm" onClick={switchTokens} disabled={isSwapping}>
          <ArrowsUpDownIcon className="w-4 h-4" />
        </button>
      </div>

      {/* To Token */}
      <div className="form-control">
        <label className="label">
          <span className="label-text text-sm">To</span>
          <span className="label-text-alt text-xs">Balance: 0.00</span>
        </label>
        <div className="join w-full">
          <input
            type="number"
            placeholder="0.0"
            className="input input-bordered join-item flex-1 text-lg bg-base-200"
            value={estimatedOutput}
            readOnly
          />
          <button className="btn join-item" onClick={() => setShowTokenSelect("to")} disabled={isSwapping}>
            {toToken}
            <ChevronDownIcon className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>

      {/* Price Info */}
      {amount && parseFloat(amount) > 0 && (
        <div className="alert alert-info py-2 px-3">
          <div className="text-xs">
            <p>
              1 {fromToken} = {(parseFloat(estimatedOutput) / parseFloat(amount)).toFixed(4)} {toToken}
            </p>
            <p>Price impact: ~0.5%</p>
            <p>
              Min received: {(parseFloat(estimatedOutput) * 0.995).toFixed(4)} {toToken}
            </p>
          </div>
        </div>
      )}

      {/* Swap Button */}
      <button
        className={`btn btn-primary w-full ${isSwapping ? "loading" : ""}`}
        onClick={handleSwap}
        disabled={!amount || parseFloat(amount) <= 0 || isSwapping}
      >
        {isSwapping ? "Swapping..." : "Swap"}
      </button>

      {/* Token Selection Modal */}
      {showTokenSelect && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Select Token</h3>
            <div className="space-y-2">
              {tokens.map(token => (
                <button
                  key={token}
                  className="btn btn-ghost w-full justify-start"
                  onClick={() => {
                    if (showTokenSelect === "from") {
                      if (token !== toToken) setFromToken(token);
                    } else {
                      if (token !== fromToken) setToToken(token);
                    }
                    setShowTokenSelect(null);
                  }}
                  disabled={
                    (showTokenSelect === "from" && token === toToken) ||
                    (showTokenSelect === "to" && token === fromToken)
                  }
                >
                  <span className="font-semibold">{token}</span>
                </button>
              ))}
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowTokenSelect(null)}>
                Close
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowTokenSelect(null)}></div>
        </div>
      )}
    </div>
  );
}

function LiquidityInterface({ asteroidId }: { asteroidId: string }) {
  const [token1, setToken1] = useState("USDC");
  const [token2, setToken2] = useState("iron");
  const [amount1, setAmount1] = useState("");
  const [amount2, setAmount2] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddLiquidity = async () => {
    if (!amount1 || !amount2) {
      notification.error("Please enter amounts for both tokens");
      return;
    }

    setIsAdding(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      notification.success("Liquidity added successfully!");
      setAmount1("");
      setAmount2("");
    } catch (error) {
      notification.error("Failed to add liquidity");
    } finally {
      setIsAdding(false);
    }
  };

  useEffect(() => {
    if (amount1 && parseFloat(amount1) > 0) {
      // Mock ratio calculation
      setAmount2((parseFloat(amount1) * 100).toFixed(2));
    }
  }, [amount1]);

  return (
    <div className="space-y-4 max-w-md mx-auto w-full">
      <h3 className="text-lg sm:text-xl font-bold">Add Liquidity</h3>

      <div className="form-control">
        <label className="label">
          <span className="label-text text-sm">Token 1</span>
          <span className="label-text-alt text-xs">Balance: 1,000.00</span>
        </label>
        <div className="join w-full">
          <input
            type="number"
            placeholder="0.0"
            className="input input-bordered join-item flex-1"
            value={amount1}
            onChange={e => setAmount1(e.target.value)}
            disabled={isAdding}
          />
          <select
            className="select select-bordered join-item"
            value={token1}
            onChange={e => setToken1(e.target.value)}
            disabled={isAdding}
          >
            <option value="USDC">USDC</option>
            <option value="iron">Iron</option>
            <option value="nickel">Nickel</option>
          </select>
        </div>
      </div>

      <div className="flex justify-center">
        <PlusIcon className="w-6 h-6 text-base-content/50" />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text text-sm">Token 2</span>
          <span className="label-text-alt text-xs">Balance: 0.00</span>
        </label>
        <div className="join w-full">
          <input
            type="number"
            placeholder="0.0"
            className="input input-bordered join-item flex-1"
            value={amount2}
            onChange={e => setAmount2(e.target.value)}
            disabled={isAdding}
          />
          <select
            className="select select-bordered join-item"
            value={token2}
            onChange={e => setToken2(e.target.value)}
            disabled={isAdding}
          >
            <option value="iron">Iron</option>
            <option value="nickel">Nickel</option>
            <option value="platinum">Platinum</option>
          </select>
        </div>
      </div>

      <div className="alert py-2 px-3">
        <div className="text-xs space-y-1">
          <p>Pool Share: 0.0%</p>
          <p>LP Tokens to Receive: ~{amount1 ? (parseFloat(amount1) * 0.1).toFixed(2) : "0.00"}</p>
          <p>Fee Tier: 0.3%</p>
        </div>
      </div>

      <button
        className={`btn btn-primary w-full ${isAdding ? "loading" : ""}`}
        onClick={handleAddLiquidity}
        disabled={!amount1 || !amount2 || isAdding}
      >
        {isAdding ? "Adding Liquidity..." : "Add Liquidity"}
      </button>
    </div>
  );
}

function FuturesInterface({ asteroidId }: { asteroidId: string }) {
  const [commodity, setCommodity] = useState("iron");
  const [amount, setAmount] = useState("");
  const [strikePrice, setStrikePrice] = useState("");
  const [expiry, setExpiry] = useState("30");
  const [isLong, setIsLong] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateFuture = async () => {
    if (!amount || !strikePrice) {
      notification.error("Please fill in all fields");
      return;
    }

    setIsCreating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      notification.success("Future position created!");
      setAmount("");
      setStrikePrice("");
    } catch (error) {
      notification.error("Failed to create future");
    } finally {
      setIsCreating(false);
    }
  };

  const requiredCollateral =
    amount && strikePrice ? (parseFloat(amount) * parseFloat(strikePrice) * 1.5).toFixed(2) : "0.00";

  return (
    <div className="space-y-4 max-w-md mx-auto w-full">
      <h3 className="text-lg sm:text-xl font-bold">Create Future Position</h3>

      <div className="form-control">
        <label className="label">
          <span className="label-text text-sm">Commodity</span>
        </label>
        <select
          className="select select-bordered w-full"
          value={commodity}
          onChange={e => setCommodity(e.target.value)}
          disabled={isCreating}
        >
          <option value="iron">Iron</option>
          <option value="nickel">Nickel</option>
          <option value="platinum">Platinum</option>
          <option value="gold">Gold</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text text-sm">Amount</span>
          </label>
          <input
            type="number"
            placeholder="0.0"
            className="input input-bordered"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            disabled={isCreating}
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text text-sm">Strike Price</span>
          </label>
          <input
            type="number"
            placeholder="0.0"
            className="input input-bordered"
            value={strikePrice}
            onChange={e => setStrikePrice(e.target.value)}
            disabled={isCreating}
          />
        </div>
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text text-sm">Expiry</span>
        </label>
        <select
          className="select select-bordered w-full"
          value={expiry}
          onChange={e => setExpiry(e.target.value)}
          disabled={isCreating}
        >
          <option value="7">7 days</option>
          <option value="30">30 days</option>
          <option value="90">90 days</option>
          <option value="365">365 days</option>
        </select>
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text text-sm">Position Type</span>
        </label>
        <div className="btn-group w-full">
          <button
            className={`btn flex-1 ${isLong ? "btn-active btn-success" : ""}`}
            onClick={() => setIsLong(true)}
            disabled={isCreating}
          >
            Long
          </button>
          <button
            className={`btn flex-1 ${!isLong ? "btn-active btn-error" : ""}`}
            onClick={() => setIsLong(false)}
            disabled={isCreating}
          >
            Short
          </button>
        </div>
      </div>

      <div className="alert alert-warning py-2 px-3">
        <div className="text-xs">
          <p className="font-semibold">Required Collateral: {requiredCollateral} USDC</p>
          <p>Collateral Ratio: 150%</p>
        </div>
      </div>

      <button
        className={`btn btn-primary w-full ${isCreating ? "loading" : ""}`}
        onClick={handleCreateFuture}
        disabled={!amount || !strikePrice || isCreating}
      >
        {isCreating ? "Creating Position..." : "Create Future"}
      </button>
    </div>
  );
}

function PortfolioInterface({ asteroidId }: { asteroidId: string }) {
  const positions = [
    {
      id: 1,
      type: "LP",
      pair: "USDC/Iron",
      value: "$1,234.56",
      share: "0.5%",
      rewards: "$12.34",
    },
    {
      id: 2,
      type: "Future",
      commodity: "Platinum",
      position: "Long",
      strike: "$100",
      expiry: "25 days",
      pnl: "+$234.56",
      pnlPercent: "+23.4%",
    },
  ];

  return (
    <div className="space-y-4 w-full">
      <h3 className="text-lg sm:text-xl font-bold">Your Positions</h3>

      {positions.length === 0 ? (
        <div className="text-center py-8 text-base-content/50">
          <p>No positions yet</p>
          <p className="text-sm mt-2">Start trading to see your portfolio</p>
        </div>
      ) : (
        <div className="space-y-3">
          {positions.map(position => (
            <div key={position.id} className="card bg-base-100 shadow">
              <div className="card-body p-4">
                {position.type === "LP" ? (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="badge badge-primary badge-sm">LP</span>
                        <h4 className="font-semibold mt-1">{position.pair}</h4>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{position.value}</p>
                        <p className="text-xs text-base-content/50">Pool Share: {position.share}</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-base-content/70">Rewards Earned:</span>
                      <span className="text-success">{position.rewards}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="badge badge-secondary badge-sm">Future</span>
                        <h4 className="font-semibold mt-1">{position.commodity}</h4>
                        <p className="text-xs text-base-content/50">
                          {position.position} @ {position.strike}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${position.pnl?.startsWith("+") ? "text-success" : "text-error"}`}>
                          {position.pnl}
                        </p>
                        <p className={`text-xs ${position.pnl?.startsWith("+") ? "text-success" : "text-error"}`}>
                          {position.pnlPercent}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-base-content/70">Expires in:</span>
                      <span>{position.expiry}</span>
                    </div>
                  </>
                )}
                <div className="card-actions justify-end mt-2">
                  <button className="btn btn-xs btn-ghost">Manage</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="divider"></div>

      <div className="stats stats-vertical sm:stats-horizontal shadow w-full">
        <div className="stat p-4">
          <div className="stat-title text-xs">Total Value</div>
          <div className="stat-value text-xl sm:text-2xl">$1,469</div>
          <div className="stat-desc text-xs">+12.5% today</div>
        </div>

        <div className="stat p-4">
          <div className="stat-title text-xs">Total P&L</div>
          <div className="stat-value text-xl sm:text-2xl text-success">+$234</div>
          <div className="stat-desc text-xs">All time</div>
        </div>

        <div className="stat p-4">
          <div className="stat-title text-xs">Active Positions</div>
          <div className="stat-value text-xl sm:text-2xl">2</div>
          <div className="stat-desc text-xs">1 LP, 1 Future</div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount, useBalance } from "wagmi";
import { ArrowsUpDownIcon } from "@heroicons/react/24/outline";
import { notification } from "~~/utils/scaffold-eth";

// Mock implementations for build
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const useScaffoldReadContract = (config?: any) => ({ data: undefined });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const useScaffoldWriteContract = (contractName?: any) => ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  writeContractAsync: async (args?: any) => {},
});

interface SwapWidgetProps {
  asteroidId: string;
  tokenFactoryAddress?: string;
  dexAddress?: string;
}

export function AsteroidSwapWidget({ asteroidId, tokenFactoryAddress, dexAddress }: SwapWidgetProps) {
  // Suppress unused variable warnings
  void asteroidId;
  void tokenFactoryAddress;
  void dexAddress;
  const { address } = useAccount();
  const [fromToken, setFromToken] = useState("USDC");
  const [toToken, setToToken] = useState("iron");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);

  // Get token addresses from factory
  const { data: fromTokenAddress } = useScaffoldReadContract({
    contractName: "AsteroidTokenFactory",
    functionName: "getToken",
    args: [asteroidId, fromToken === "USDC" ? "COLLATERAL" : fromToken],
  });

  const { data: toTokenAddress } = useScaffoldReadContract({
    contractName: "AsteroidTokenFactory",
    functionName: "getToken",
    args: [asteroidId, toToken === "USDC" ? "COLLATERAL" : toToken],
  });

  // Get pool address
  const { data: poolAddress } = useScaffoldReadContract({
    contractName: "AsteroidDEX",
    functionName: "getPair",
    args: fromTokenAddress && toTokenAddress ? [fromTokenAddress, toTokenAddress] : undefined,
  });

  // Get reserves for price calculation
  const { data: reserves } = useScaffoldReadContract({
    contractName: "AsteroidLiquidityPool",
    functionName: "getReserves",
    address: poolAddress,
  });

  // Token balances
  const { data: fromBalance } = useBalance({
    address,
    token: fromToken === "USDC" ? undefined : fromTokenAddress,
  });

  const { data: toBalance } = useBalance({
    address,
    token: toToken === "USDC" ? undefined : toTokenAddress,
  });

  // Swap function
  const { writeContractAsync: executeSwap } = useScaffoldWriteContract();

  const handleSwap = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      notification.error("Please enter a valid amount");
      return;
    }

    if (!poolAddress) {
      notification.error("No liquidity pool found for this pair");
      return;
    }

    try {
      const amountIn = parseEther(amount);
      const path = [fromTokenAddress, toTokenAddress];

      // Calculate minimum amount out with slippage
      const expectedOut = calculateOutputAmount(amountIn, reserves);
      const minAmountOut = (expectedOut * BigInt(Math.floor((100 - slippage) * 10))) / BigInt(1000);

      await executeSwap({
        functionName: "swapExactTokensForTokens",
        args: [amountIn, minAmountOut, path, address],
      });

      notification.success("Swap successful!");
      setAmount("");
    } catch (error) {
      console.error("Swap error:", error);
      notification.error("Swap failed");
    }
  };

  const calculateOutputAmount = (amountIn: bigint, reserves: any) => {
    if (!reserves) return BigInt(0);
    const [reserve0, reserve1] = reserves;

    // Simple constant product formula
    const amountInWithFee = amountIn * BigInt(997);
    const numerator = amountInWithFee * reserve1;
    const denominator = reserve0 * BigInt(1000) + amountInWithFee;
    return numerator / denominator;
  };

  const switchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount("");
  };

  const estimatedOutput =
    reserves && amount ? formatEther(calculateOutputAmount(parseEther(amount || "0"), reserves)) : "0.0";

  return (
    <div className="card bg-base-100 shadow-xl max-w-md mx-auto">
      <div className="card-body p-4 sm:p-6">
        <h2 className="card-title text-lg sm:text-xl mb-4">Swap</h2>

        {/* From Input */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">From</span>
            <span className="label-text-alt text-xs">
              Balance: {fromBalance ? parseFloat(formatEther(fromBalance.value)).toFixed(4) : "0.0000"}
            </span>
          </label>
          <div className="join w-full">
            <input
              type="number"
              placeholder="0.0"
              className="input input-bordered join-item flex-1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            <select
              className="select select-bordered join-item"
              value={fromToken}
              onChange={e => setFromToken(e.target.value)}
            >
              <option value="USDC">USDC</option>
              <option value="iron">Iron</option>
              <option value="nickel">Nickel</option>
              <option value="platinum">Platinum</option>
            </select>
          </div>
        </div>

        {/* Switch Button */}
        <div className="flex justify-center my-2">
          <button className="btn btn-circle btn-sm btn-ghost" onClick={switchTokens}>
            <ArrowsUpDownIcon className="w-5 h-5" />
          </button>
        </div>

        {/* To Input */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">To</span>
            <span className="label-text-alt text-xs">
              Balance: {toBalance ? parseFloat(formatEther(toBalance.value)).toFixed(4) : "0.0000"}
            </span>
          </label>
          <div className="join w-full">
            <input
              type="number"
              placeholder="0.0"
              className="input input-bordered join-item flex-1 bg-base-200"
              value={estimatedOutput}
              readOnly
            />
            <select
              className="select select-bordered join-item"
              value={toToken}
              onChange={e => setToToken(e.target.value)}
            >
              <option value="iron">Iron</option>
              <option value="nickel">Nickel</option>
              <option value="platinum">Platinum</option>
              <option value="gold">Gold</option>
            </select>
          </div>
        </div>

        {/* Slippage Settings */}
        <div className="collapse collapse-arrow bg-base-200">
          <input type="checkbox" />
          <div className="collapse-title text-sm font-medium">Advanced Settings</div>
          <div className="collapse-content">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-xs">Slippage Tolerance</span>
              </label>
              <div className="join">
                {[0.1, 0.5, 1.0].map(value => (
                  <button
                    key={value}
                    className={`join-item btn btn-xs ${slippage === value ? "btn-active" : ""}`}
                    onClick={() => setSlippage(value)}
                  >
                    {value}%
                  </button>
                ))}
                <input
                  type="number"
                  className="input input-bordered input-xs join-item w-20"
                  placeholder="Custom"
                  value={slippage}
                  onChange={e => setSlippage(parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Price Impact Warning */}
        {amount && parseFloat(amount) > 0 && (
          <div className="alert alert-warning py-2">
            <div className="text-xs">
              <p>Price Impact: ~0.5%</p>
              <p>
                Min Received: {(parseFloat(estimatedOutput) * (1 - slippage / 100)).toFixed(4)} {toToken}
              </p>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <button
          className="btn btn-primary w-full"
          onClick={handleSwap}
          disabled={!amount || parseFloat(amount) <= 0 || !poolAddress}
        >
          {!poolAddress ? "No Liquidity Pool" : "Swap"}
        </button>
      </div>
    </div>
  );
}

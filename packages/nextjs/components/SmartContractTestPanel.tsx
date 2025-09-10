"use client";

import { useState } from "react";
import { Address, formatEther, parseEther } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import { notification } from "~~/utils/scaffold-eth";

// Mock functions for missing scaffold-eth hooks
const useScaffoldContractWrite = () => ({ writeContractAsync: async () => {} });
const useScaffoldContractRead = () => ({ data: null, isLoading: false });

const TestPanel = () => {
  const { address: connectedAddress } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [activeTab, setActiveTab] = useState("tokens");

  // Token Factory State
  const [asteroidId, setAsteroidId] = useState("16-Psyche");
  const [commodity, setCommodity] = useState("Iron");
  const [initialSupply, setInitialSupply] = useState("1000000");
  const [mintAmount, setMintAmount] = useState("10000");
  const [mintTo, setMintTo] = useState("");

  // Space Activity State
  const [activityName, setActivityName] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [activityOrg, setActivityOrg] = useState("");
  const [activityManager, setActivityManager] = useState("");
  const [activityType, setActivityType] = useState("0");
  const [activityStatus, setActivityStatus] = useState("0");

  // DEX State
  const [tokenA, setTokenA] = useState("");
  const [tokenB, setTokenB] = useState("");
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [, setSwapPath] = useState<string[]>([]);
  const [, setSwapAmount] = useState("");

  // Get deployed contracts
  const contracts = deployedContracts[31337];

  // Token Factory Contract Calls
  const { writeAsync: createToken } = useScaffoldContractWrite({
    contractName: "AsteroidTokenFactory",
    functionName: "createAsteroidToken",
    args: [asteroidId, commodity, parseEther(initialSupply)],
  });

  const { data: allTokens } = useScaffoldContractRead({
    contractName: "AsteroidTokenFactory",
    functionName: "getAllTokens",
  });

  // Space Activity Contract Calls
  const { writeAsync: logActivity } = useScaffoldContractWrite({
    contractName: "SpaceActivityManager",
    functionName: "logActivity",
    args: [
      parseInt(activityType),
      activityName,
      activityDescription,
      activityOrg,
      activityManager,
      BigInt(Math.floor(Date.now() / 1000)),
      BigInt(Math.floor(Date.now() / 1000) + 86400),
      BigInt(0),
      parseInt(activityStatus),
      "",
      "",
      "",
      "",
      "",
    ],
  });

  const { data: myActivities } = useScaffoldContractRead({
    contractName: "SpaceActivityManager",
    functionName: "getActivitiesByOwner",
    args: [connectedAddress],
  });

  // DEX Contract Calls
  const { writeAsync: createPair } = useScaffoldContractWrite({
    contractName: "AsteroidDEX",
    functionName: "createPair",
    args: [tokenA as Address, tokenB as Address],
  });

  const { data: allPools } = useScaffoldContractRead({
    contractName: "AsteroidDEX",
    functionName: "getAllPools",
  });

  // Mint tokens directly to an address (for deployed tokens)
  const mintTokens = async (tokenAddress: string) => {
    if (!walletClient || !publicClient) return;

    try {
      const hash = await walletClient.writeContract({
        address: tokenAddress as Address,
        abi: contracts.AsteroidCommodityToken.abi,
        functionName: "mint",
        args: [mintTo || connectedAddress, parseEther(mintAmount)],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      notification.success("Tokens minted successfully!");
    } catch (error) {
      console.error("Error minting tokens:", error);
      notification.error("Failed to mint tokens");
    }
  };

  // Burn tokens
  const burnTokens = async (tokenAddress: string, amount: string) => {
    if (!walletClient || !publicClient) return;

    try {
      const hash = await walletClient.writeContract({
        address: tokenAddress as Address,
        abi: contracts.AsteroidCommodityToken.abi,
        functionName: "burn",
        args: [parseEther(amount)],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      notification.success("Tokens burned successfully!");
    } catch (error) {
      console.error("Error burning tokens:", error);
      notification.error("Failed to burn tokens");
    }
  };

  // Get token balance
  const _getTokenBalance = async (tokenAddress: string, account: string) => {
    if (!publicClient) return "0";

    try {
      const balance = await publicClient.readContract({
        address: tokenAddress as Address,
        abi: contracts.AsteroidCommodityToken.abi,
        functionName: "balanceOf",
        args: [account as Address],
      });

      return formatEther(balance as bigint);
    } catch (error) {
      console.error("Error getting balance:", error);
      return "0";
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Smart Contract Test Panel</h1>

      {!connectedAddress && (
        <div className="alert alert-warning mb-4">Please connect your wallet to use the test panel</div>
      )}

      <div className="tabs tabs-boxed mb-4">
        <a className={`tab ${activeTab === "tokens" ? "tab-active" : ""}`} onClick={() => setActiveTab("tokens")}>
          Token Factory
        </a>
        <a
          className={`tab ${activeTab === "activities" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("activities")}
        >
          Space Activities
        </a>
        <a className={`tab ${activeTab === "dex" ? "tab-active" : ""}`} onClick={() => setActiveTab("dex")}>
          DEX
        </a>
        <a className={`tab ${activeTab === "existing" ? "tab-active" : ""}`} onClick={() => setActiveTab("existing")}>
          Existing Tokens
        </a>
      </div>

      {activeTab === "tokens" && (
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Create Asteroid Commodity Token</h2>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Asteroid ID</span>
              </label>
              <input
                type="text"
                placeholder="e.g., 16-Psyche"
                className="input input-bordered"
                value={asteroidId}
                onChange={e => setAsteroidId(e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Commodity Type</span>
              </label>
              <select className="select select-bordered" value={commodity} onChange={e => setCommodity(e.target.value)}>
                <option value="Iron">Iron</option>
                <option value="Nickel">Nickel</option>
                <option value="Gold">Gold</option>
                <option value="Platinum">Platinum</option>
                <option value="Water">Water</option>
                <option value="Helium3">Helium-3</option>
                <option value="RareEarth">Rare Earth Elements</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Initial Supply</span>
              </label>
              <input
                type="text"
                placeholder="1000000"
                className="input input-bordered"
                value={initialSupply}
                onChange={e => setInitialSupply(e.target.value)}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={async () => {
                try {
                  await createToken();
                  notification.success("Token created successfully!");
                } catch (error) {
                  console.error(error);
                  notification.error("Failed to create token");
                }
              }}
              disabled={!connectedAddress}
            >
              Create Token
            </button>

            {allTokens && allTokens.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Created Tokens:</h3>
                <div className="overflow-x-auto">
                  <table className="table table-compact w-full">
                    <thead>
                      <tr>
                        <th>Token Address</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(allTokens as string[]).map((token, idx) => (
                        <tr key={idx}>
                          <td className="font-mono text-xs">{token}</td>
                          <td>
                            <button
                              className="btn btn-xs btn-secondary"
                              onClick={() => navigator.clipboard.writeText(token)}
                            >
                              Copy
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "activities" && (
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Log Space Activity</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Activity Name</span>
                </label>
                <input
                  type="text"
                  placeholder="Mission Name"
                  className="input input-bordered"
                  value={activityName}
                  onChange={e => setActivityName(e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Activity Type</span>
                </label>
                <select
                  className="select select-bordered"
                  value={activityType}
                  onChange={e => setActivityType(e.target.value)}
                >
                  <option value="0">Rocket Launch</option>
                  <option value="1">Satellite Deployment</option>
                  <option value="2">Exploration Mission</option>
                  <option value="3">Research Project</option>
                  <option value="4">Space Tourism</option>
                  <option value="5">Manufacturing</option>
                  <option value="6">Resource Extraction</option>
                  <option value="7">Other</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Organization</span>
                </label>
                <input
                  type="text"
                  placeholder="SpaceX, NASA, etc."
                  className="input input-bordered"
                  value={activityOrg}
                  onChange={e => setActivityOrg(e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Project Manager</span>
                </label>
                <input
                  type="text"
                  placeholder="Manager Name"
                  className="input input-bordered"
                  value={activityManager}
                  onChange={e => setActivityManager(e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Status</span>
                </label>
                <select
                  className="select select-bordered"
                  value={activityStatus}
                  onChange={e => setActivityStatus(e.target.value)}
                >
                  <option value="0">Planned</option>
                  <option value="1">Preparation</option>
                  <option value="2">In Progress</option>
                  <option value="3">Completed Success</option>
                  <option value="4">Completed Failure</option>
                  <option value="5">Completed Partial Success</option>
                  <option value="6">On Hold</option>
                  <option value="7">Cancelled</option>
                </select>
              </div>

              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  placeholder="Activity description..."
                  className="textarea textarea-bordered"
                  value={activityDescription}
                  onChange={e => setActivityDescription(e.target.value)}
                />
              </div>
            </div>

            <button
              className="btn btn-primary mt-4"
              onClick={async () => {
                try {
                  await logActivity();
                  notification.success("Activity logged successfully!");
                } catch (error) {
                  console.error(error);
                  notification.error("Failed to log activity");
                }
              }}
              disabled={!connectedAddress || !activityName}
            >
              Log Activity
            </button>

            {myActivities && (myActivities as any[]).length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Your Activities:</h3>
                <div className="space-y-2">
                  {(myActivities as string[]).map((activityId, idx) => (
                    <div key={idx} className="badge badge-primary">
                      Activity ID: {activityId.slice(0, 10)}...
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "dex" && (
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">DEX Operations</h2>

            <div className="divider">Create Liquidity Pool</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Token A Address</span>
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  className="input input-bordered font-mono text-xs"
                  value={tokenA}
                  onChange={e => setTokenA(e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Token B Address</span>
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  className="input input-bordered font-mono text-xs"
                  value={tokenB}
                  onChange={e => setTokenB(e.target.value)}
                />
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={async () => {
                try {
                  await createPair();
                  notification.success("Pair created successfully!");
                } catch (error) {
                  console.error(error);
                  notification.error("Failed to create pair");
                }
              }}
              disabled={!connectedAddress || !tokenA || !tokenB}
            >
              Create Pair
            </button>

            <div className="divider">Add Liquidity</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Amount Token A</span>
                </label>
                <input
                  type="text"
                  placeholder="100"
                  className="input input-bordered"
                  value={amountA}
                  onChange={e => setAmountA(e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Amount Token B</span>
                </label>
                <input
                  type="text"
                  placeholder="100"
                  className="input input-bordered"
                  value={amountB}
                  onChange={e => setAmountB(e.target.value)}
                />
              </div>
            </div>

            <button
              className="btn btn-secondary"
              disabled={!connectedAddress || !tokenA || !tokenB || !amountA || !amountB}
            >
              Add Liquidity (Requires Token Approval)
            </button>

            {allPools && (allPools as any[]).length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Liquidity Pools:</h3>
                <div className="overflow-x-auto">
                  <table className="table table-compact w-full">
                    <thead>
                      <tr>
                        <th>Pool Address</th>
                        <th>Token 0</th>
                        <th>Token 1</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(allPools as any[]).map((pool, idx) => (
                        <tr key={idx}>
                          <td className="font-mono text-xs">{pool.poolAddress}</td>
                          <td className="font-mono text-xs">{pool.token0.slice(0, 8)}...</td>
                          <td className="font-mono text-xs">{pool.token1.slice(0, 8)}...</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "existing" && (
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Test Existing Tokens</h2>

            <div className="alert alert-info mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span>Use these controls to mint test tokens for any deployed token contract</span>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Token Contract Address</span>
              </label>
              <input
                type="text"
                placeholder="0x..."
                className="input input-bordered font-mono text-xs"
                value={mintTo}
                onChange={e => setMintTo(e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Mint Amount</span>
              </label>
              <input
                type="text"
                placeholder="10000"
                className="input input-bordered"
                value={mintAmount}
                onChange={e => setMintAmount(e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Recipient Address (leave empty for self)</span>
              </label>
              <input
                type="text"
                placeholder="0x... (optional)"
                className="input input-bordered font-mono text-xs"
                value={mintTo}
                onChange={e => setMintTo(e.target.value)}
              />
            </div>

            {allTokens && allTokens.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Quick Actions for Deployed Tokens:</h3>
                <div className="space-y-2">
                  {(allTokens as string[]).slice(0, 5).map((token, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-base-100 rounded">
                      <span className="font-mono text-xs flex-1">{token}</span>
                      <button className="btn btn-xs btn-primary" onClick={() => mintTokens(token)}>
                        Mint {mintAmount}
                      </button>
                      <button className="btn btn-xs btn-error" onClick={() => burnTokens(token, "100")}>
                        Burn 100
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="divider">Predefined Test Tokens</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <button
                className="btn btn-outline"
                onClick={async () => {
                  try {
                    await createToken();
                    notification.success("Created Iron token for 16-Psyche!");
                  } catch (error) {
                    notification.error("Failed to create token");
                  }
                }}
              >
                Create 16-Psyche Iron Token
              </button>
              <button
                className="btn btn-outline"
                onClick={async () => {
                  setAsteroidId("433-Eros");
                  setCommodity("Gold");
                  setInitialSupply("500000");
                  await createToken();
                }}
              >
                Create 433-Eros Gold Token
              </button>
              <button
                className="btn btn-outline"
                onClick={async () => {
                  setAsteroidId("1-Ceres");
                  setCommodity("Water");
                  setInitialSupply("2000000");
                  await createToken();
                }}
              >
                Create 1-Ceres Water Token
              </button>
              <button
                className="btn btn-outline"
                onClick={async () => {
                  setAsteroidId("3554-Amun");
                  setCommodity("Platinum");
                  setInitialSupply("100000");
                  await createToken();
                }}
              >
                Create 3554-Amun Platinum Token
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestPanel;

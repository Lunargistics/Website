/**
 * Script to upgrade deployed upgradeable contracts
 * Usage: npx hardhat run scripts/upgrade-contracts.ts --network <network>
 */

import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("🔄 Starting contract upgrade process...\n");

  // Get the current proxy address (this should be stored/retrieved from deployment)
  const PROXY_ADDRESS = process.env.MISSION_REGISTRY_PROXY_ADDRESS || "";

  if (!PROXY_ADDRESS) {
    throw new Error("Please set MISSION_REGISTRY_PROXY_ADDRESS in environment");
  }

  console.log("📍 Proxy address:", PROXY_ADDRESS);

  // Get current implementation
  const currentImplAddress = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);
  console.log("📍 Current implementation:", currentImplAddress);

  // Deploy new implementation
  console.log("\n🚀 Deploying new implementation...");
  const MissionRegistryV2 = await ethers.getContractFactory("MissionRegistryV2");

  // Upgrade the proxy to point to new implementation
  const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, MissionRegistryV2, {
    kind: "uups",
  });

  await upgraded.deployed();

  // Get new implementation address
  const newImplAddress = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);
  console.log("✅ New implementation deployed:", newImplAddress);

  // Verify the upgrade
  const contract = MissionRegistryV2.attach(PROXY_ADDRESS);
  const version = await contract.version();
  console.log("📌 Contract version:", version);

  console.log("\n✅ Upgrade complete!");
  console.log("   Proxy remains at:", PROXY_ADDRESS);
  console.log("   Old implementation:", currentImplAddress);
  console.log("   New implementation:", newImplAddress);

  // Verify on explorer if not localhost
  if (process.env.HARDHAT_NETWORK !== "localhost" && process.env.HARDHAT_NETWORK !== "hardhat") {
    console.log("\n📝 Verifying new implementation on explorer...");
    try {
      await run("verify:verify", {
        address: newImplAddress,
        constructorArguments: [],
      });
      console.log("✅ Verification complete");
    } catch (error) {
      console.log("⚠️  Verification failed:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("❌ Upgrade failed:", error);
    process.exit(1);
  });

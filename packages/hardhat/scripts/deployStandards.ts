import { ethers } from "hardhat";

async function main() {
  console.log("Deploying StandardsCompliance to TEA Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "TEA\n");

  try {
    // Deploy StandardsCompliance
    console.log("Deploying StandardsCompliance...");
    const StandardsCompliance = await ethers.getContractFactory("StandardsCompliance");
    const standardsCompliance = await StandardsCompliance.deploy();
    await standardsCompliance.waitForDeployment();
    const standardsAddress = await standardsCompliance.getAddress();
    console.log("✅ StandardsCompliance deployed to:", standardsAddress);

    const finalBalance = await ethers.provider.getBalance(deployer.address);
    console.log("\nFinal balance:", ethers.formatEther(finalBalance), "TEA");
    console.log("Gas used:", ethers.formatEther(balance - finalBalance), "TEA");

    console.log("\n🌐 View on TEA Sepolia Explorer:");
    console.log(`   https://testnet.explorer.tea.xyz/address/${standardsAddress}`);
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

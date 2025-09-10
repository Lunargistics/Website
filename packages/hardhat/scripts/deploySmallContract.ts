import { ethers } from "hardhat";

async function main() {
  console.log("Deploying AsteroidCommodityToken to TEA Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "TEA\n");

  try {
    // Deploy AsteroidCommodityToken (smaller contract)
    console.log("Deploying AsteroidCommodityToken...");
    const AsteroidCommodityToken = await ethers.getContractFactory("AsteroidCommodityToken");
    const token = await AsteroidCommodityToken.deploy(
      "Asteroid Commodity",
      "ASTRO",
      "16-Psyche",
      "Iron-Nickel",
      ethers.parseEther("1000000"),
    );
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("✅ AsteroidCommodityToken deployed to:", tokenAddress);

    const finalBalance = await ethers.provider.getBalance(deployer.address);
    console.log("\nFinal balance:", ethers.formatEther(finalBalance), "TEA");
    console.log("Gas used:", ethers.formatEther(balance - finalBalance), "TEA");

    console.log("\n🌐 View on TEA Sepolia Explorer:");
    console.log(`   https://testnet.explorer.tea.xyz/address/${tokenAddress}`);
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
